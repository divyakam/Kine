/* ============================================================
   KINE — Real-time Posture Tracker & Event Logger
   Centralized monitoring to ensure consistent logging across pages.
   ============================================================ */

(function () {
  'use strict';

  KINEAuth.onReady(user => {
    if (!user) return;

    let lastLoggedState = null;
    let lastLogId = localStorage.getItem(`kine_last_log_${user.uid}`);
    let lastSyncedScore = null;

    // History Snapshot Timing
    const SNAPSHOT_INTERVAL = 5 * 1000; // 5 Seconds
    let lastSnapshotTime = parseInt(localStorage.getItem(`kine_last_snapshot_${user.uid}`) || Date.now());

    console.log('[Tracker] Global tracker initialized for user:', user.uid);

    // 1. Listen for Live Readings (Angle/Deviation)
    KINEdb.onLiveDevicePosture(deviceInfo => {
      if (!deviceInfo) return;

      const isAligned = deviceInfo.isAligned;
      const currentState = isAligned ? 'aligned' : 'deviated';

      // Record state changes
      if (lastLoggedState !== currentState) {
        lastLoggedState = currentState;
        console.log('[Tracker] Posture state changed to:', currentState.toUpperCase());
      }

      // --- LIVE DATA SYNC ---
      const now = Date.now();
      let isFirstSync = lastSyncedScore === null;
      let shouldSyncScore = isFirstSync || Math.abs((lastSyncedScore || 0) - deviceInfo.currentScore) >= 1;
      let shouldAppendHistory = (now - lastSnapshotTime) >= SNAPSHOT_INTERVAL;

      if (shouldAppendHistory) {
        console.log('[Tracker] Interval reached. Appending new history snapshot...');
        lastSnapshotTime = now;
        localStorage.setItem(`kine_last_snapshot_${user.uid}`, lastSnapshotTime);
      }

      // Update Current Score in DB
      if (shouldSyncScore) {
        lastSyncedScore = deviceInfo.currentScore;
        KINEdb.updatePostureScore(user.uid, deviceInfo.currentScore);
      }

      // Update History Trend in DB (Live overwrite or New Point)
      // Force update if it's the first sync to ensure the history node exists
      if (shouldSyncScore || shouldAppendHistory || isFirstSync) {
        KINEdb.updateLiveHistory(user.uid, deviceInfo.currentScore, shouldAppendHistory);
      }

      // Update Daily Average Statistics (Persistent across the day)
      if (shouldAppendHistory) {
        console.log('[Tracker] Syncing point to Daily Average:', deviceInfo.currentScore);
        KINEdb.updateDailyStats(user.uid, deviceInfo.currentScore);
      }
    });

    // 2. Listen for Log entries (Timeline events) sent by ESP
    KINEdb.onTimeline(user.uid, logs => {
      if (logs && logs.length > 0) {
        const latest = logs[0]; // newest log is first in the list from onTimeline

        // Only process if it's a new entry we haven't seen yet
        if (lastLogId !== latest.id) {
          lastLogId = latest.id;
          localStorage.setItem(`kine_last_log_${user.uid}`, lastLogId);

          console.log('%c[Tracker] ESP Sent Log: ' + latest.type + ' (Dev: ' + latest.deviation + ')', 'color: #ff9800; font-weight: bold;');

          // If the ESP logged a "Bad" posture event, increment the corrections counter
          if (latest.type === 'Bad') {
            console.log('%c[Tracker] Posture Deviation detected. Recording correction...', 'color: #f44336; font-weight: bold;');
            KINEdb.incrementCorrections(user.uid);
          }
        }
      }
    });

    // Handle device status changes
    KINEdb.onDevice(user.uid, device => {
      if (device) {
        console.log('[Tracker] Device status:', device.status);
      }
    });

    // TEST HELPER: Allow manual snapshot trigger from console
    window.KINE_TestSnapshot = () => {
      console.log('[Tracker] Manual snapshot triggered.');
      localStorage.setItem(`kine_last_snapshot_${user.uid}`, 0); // Force interval match
    };
  });
})();

