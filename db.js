/* ============================================================
   KINE — Realtime Database Controller
   ============================================================ */

const KINEdb = (() => {
  'use strict';

  const db = firebase.database();

  // --- USER DATA ---

  function onProfile(uid, callback) {
    const ref = db.ref(`users/${uid}/profile`);
    ref.on('value', snapshot => {
      callback(snapshot.val());
    });
    return () => ref.off();
  }

  async function updateProfile(uid, data) {
    try {
      await db.ref(`users/${uid}/profile`).update(data);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }

  function onSettings(uid, path, callback) {
    const ref = db.ref(`users/${uid}/settings/${path}`);
    ref.on('value', snapshot => {
      callback(snapshot.val());
    });
    return () => ref.off();
  }

  async function updateSettings(uid, path, data) {
    try {
      await db.ref(`users/${uid}/settings/${path}`).update(data);
    } catch (error) {
      console.error('Settings update failed:', error);
      throw error;
    }
  }

  function onPosture(uid, callback) {
    const ref = db.ref(`users/${uid}/posture`);
    ref.on('value', snapshot => {
      callback(snapshot.val());
    });
    return () => ref.off();
  }

  // --- HARDWARE CALIBRATION ---

  function onCalibration(uid, callback) {
    const ref = db.ref(`users/${uid}/posture/calibration`);
    ref.on('value', snapshot => {
      callback(snapshot.val());
    });
    return () => ref.off();
  }

  async function updateCalibration(uid, data) {
    try {
      // 1. Save local record of calibration (timestamp)
      if (uid && data) {
        await db.ref(`users/${uid}/posture/calibration`).update(data);
      }
      // 2. Trigger hardware calibration via global control path
      await db.ref('/control').update({ calibrate: true });
      console.log('[KINEdb] Hardware calibration command sent.');
    } catch (error) {
      console.error('Calibration update failed:', error);
      throw error;
    }
  }

  // --- LIVE DEVICE POSTURE ---

  function onLiveDevicePosture(callback) {
    const angleRef = db.ref('/device/angle');
    const baselineRef = db.ref('/device/baseline');
    const timeRef = db.ref('/device/time');
    
    let currentAngle = 0;
    let currentBaseline = 0;
    let lastUpdate = 0;
    
    const notify = () => {
      const deviation = Math.abs(currentAngle - currentBaseline);
      const isAligned = deviation <= 1000; 
      const score = Math.max(0, Math.min(100, Math.round(100 - (deviation / 100)))); 
      
      const payload = {
        angle: currentAngle,
        baseline: currentBaseline,
        deviation: deviation,
        isAligned: isAligned,
        currentScore: score,
        lastUpdate: lastUpdate
      };

      callback(payload);
    };

    angleRef.on('value', snap => {
      currentAngle = parseFloat(snap.val() || 0);
      notify();
    });

    baselineRef.on('value', snap => {
      currentBaseline = parseFloat(snap.val() || 0);
      notify();
    });

    timeRef.on('value', snap => {
      lastUpdate = snap.val();
      notify();
    });

    return () => {
      angleRef.off();
      baselineRef.off();
      timeRef.off();
    };
  }

  // --- LOGGING & ANALYTICS ---

  async function addTimelineEvent(uid, type, deviation) {
    try {
      await db.ref('/posture/logs').push({
        status: type, 
        deviation: deviation || 0,
        timestamp: new Date().toLocaleString('en-GB').replace(/\//g, '-') 
      });
    } catch (error) {
      console.error('Timeline log failed:', error);
    }
  }

  function onTimeline(uid, callback) {
    const ref = db.ref('/posture/logs');
    ref.on('value', snapshot => {
      const data = snapshot.val();
      const list = [];
      if (data) {
        Object.keys(data).forEach(key => {
          const item = data[key];
          list.push({ 
            id: key, 
            type: item.status || 'Log', 
            deviation: item.deviation || 0,
            timestamp: item.timestamp 
          });
        });
        list.reverse();
      }
      callback(list);
    });
    return () => ref.off();
  }

  async function incrementCorrections(uid) {
    if (!uid) return;
    try {
      await db.ref(`users/${uid}/posture`).update({
        corrections: firebase.database.ServerValue.increment(1),
        lastUpdate: firebase.database.ServerValue.TIMESTAMP
      });
    } catch (error) {
      console.error('Increment corrections failed:', error);
    }
  }

  async function updatePostureScore(uid, score) {
    if (!uid) return;
    try {
      await db.ref(`users/${uid}/posture`).update({
        currentScore: score,
        lastUpdate: firebase.database.ServerValue.TIMESTAMP
      });
    } catch (error) {
      console.error('Score update failed:', error);
    }
  }

  // --- ROLLING HISTORY (75s Trend) ---

  function onHistory(uid, callback) {
    const ref = db.ref(`users/${uid}/posture/history`);
    ref.on('value', snapshot => {
      callback(snapshot.val());
    });
    return () => ref.off();
  }

  async function updateLiveHistory(uid, score, appendNewPoint = false) {
    if (!uid) return;
    try {
      const ref = db.ref(`users/${uid}/posture/history`);
      const snapshot = await ref.once('value');
      let history = snapshot.val();
      
      if (!history || !Array.isArray(history)) {
        history = [score, score];
      }

      if (appendNewPoint) {
        history.push(score);
        if (history.length > 15) history.shift(); 
      } else {
        history[history.length - 1] = score;
      }
      
      await ref.set(history);
    } catch (error) {
      console.error('Update history failed:', error);
    }
  }

  // --- DAILY PERSISTENT STATS ---

  async function updateDailyStats(uid, score) {
    const ref = db.ref(`users/${uid}/posture/summary`);
    const today = new Date().toLocaleDateString('en-CA'); 

    try {
      const snapshot = await ref.once('value');
      let data = snapshot.val() || { totalScore: 0, sampleCount: 0, date: today };

      if (data.date !== today) {
        data = { totalScore: score, sampleCount: 1, date: today };
      } else {
        data.totalScore = (parseFloat(data.totalScore) || 0) + score;
        data.sampleCount = (parseInt(data.sampleCount) || 0) + 1;
      }

      // Cleanup: Explicitly null out removed fields to wipe them from the database
      data.streak = null;
      data.wearMinutes = null;
      data.lastActiveDate = null;

      await ref.update(data);
    } catch (error) {
      console.error('[KINEdb] updateDailyStats failed:', error);
    }
  }

  function onDailyStats(uid, callback) {
    const ref = db.ref(`users/${uid}/posture/summary`);
    ref.on('value', snap => {
      const data = snap.val();
      if (data && data.sampleCount > 0) {
        const total = parseFloat(data.totalScore) || 0;
        const count = parseInt(data.sampleCount) || 1;
        const avg = Math.max(0, Math.min(100, Math.round(total / count)));
        callback(avg);
      } else {
        callback(0);
      }
    });
    return () => ref.off();
  }

  return {
    onProfile,
    updateProfile,
    onSettings,
    updateSettings,
    onPosture,
    onCalibration,
    updateCalibration,
    onLiveDevicePosture,
    addTimelineEvent,
    onTimeline,
    incrementCorrections,
    updatePostureScore,
    onHistory,
    updateLiveHistory,
    onDailyStats,
    updateDailyStats
  };
})();

window.KINEdb = KINEdb;
