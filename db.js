/* ============================================================
   KINE — Realtime Database Controller
   ============================================================ */

const KINEdb = (() => {
  'use strict';

  const db = firebase.database();

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

  // GLOBAL DEVICE TRACKING (Matches ESP32 path /device/...)
  function onDevice(uid, callback) {
    const ref = db.ref('/device');
    ref.on('value', snapshot => {
      callback(snapshot.val());
    });
    return () => ref.off();
  }

  function onCalibration(uid, callback) {
    const ref = db.ref('/device/baseline'); // Aligned with ESP32 path
    ref.on('value', snapshot => {
      callback({ baseline: snapshot.val() });
    });
    return () => ref.off();
  }

  async function updateCalibration(uid, data) {
    try {
      // Trigger hardware calibration via global control path
      await db.ref('/control').update({ calibrate: true });
    } catch (error) {
      console.error('Calibration update failed:', error);
      throw error;
    }
  }

  function onLiveDevicePosture(callback) {
    const angleRef = db.ref('/device/angle');
    const baselineRef = db.ref('/device/baseline');
    const timeRef = db.ref('/device/time');
    
    let currentAngle = 0;
    let currentBaseline = 0;
    let lastUpdate = 0;
    
    const notify = () => {
      const deviation = Math.abs(currentAngle - currentBaseline);
      const isAligned = deviation <= 2000; // Updated to match ESP32 threshold
      const score = Math.max(0, Math.round(100 - (deviation / 200)));
      
      const payload = {
        angle: currentAngle,
        baseline: currentBaseline,
        deviation: deviation,
        isAligned: isAligned,
        currentScore: score,
        lastUpdate: lastUpdate
      };

      console.log('[KINEdb] Notify Payload:', payload);
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

  async function addTimelineEvent(uid, type, deviation) {
    try {
      // Pushing to GLOBAL path to match ESP32 logs
      await db.ref('/posture/logs').push({
        status: type, // ESP32 uses 'status'
        deviation: deviation || 0,
        timestamp: new Date().toLocaleString('en-GB').replace(/\//g, '-') // Match ESP32 string format dd-mm-yyyy hh:mm:ss
      });
      console.log('[KINEdb] Global log pushed:', type);
    } catch (error) {
      console.error('Timeline log failed:', error);
    }
  }

  function onTimeline(uid, callback) {
    // Listen to GLOBAL path /posture/logs
    const ref = db.ref('/posture/logs');
    ref.on('value', snapshot => {
      const data = snapshot.val();
      const list = [];
      if (data) {
        Object.keys(data).forEach(key => {
          const item = data[key];
          // Backward compatibility with ESP32 field names
          list.push({ 
            id: key, 
            type: item.status || item.type || 'Log', 
            deviation: item.deviation || 0,
            timestamp: item.timestamp 
          });
        });
        // Try to sort by ID or timestamp string if numeric is missing
        list.reverse();
      }
      callback(list);
    });
    return () => ref.off();
  }

  return {
    onProfile,
    updateProfile,
    onSettings,
    updateSettings,
    onPosture,
    onDevice,
    onCalibration,
    updateCalibration,
    onLiveDevicePosture,
    addTimelineEvent,
    onTimeline
  };
})();

window.KINEdb = KINEdb;
