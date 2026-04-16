/* ============================================================
   KINE — Real-time Posture Tracker & Event Logger
   Centralized monitoring to ensure consistent logging across pages.
   ============================================================ */

(function() {
  'use strict';

  KINEAuth.onReady(user => {
    if (!user) return;

    let lastLoggedState = null;

    console.log('[Tracker] Global tracker initialized for user:', user.uid);

    KINEdb.onLiveDevicePosture(deviceInfo => {
      if (!deviceInfo) return;

      const isAligned = deviceInfo.isAligned;
      const currentState = isAligned ? 'aligned' : 'deviated';

      // Logic: Only log if the state (Aligned vs Deviated) actually changed
      if (lastLoggedState !== currentState) {
        lastLoggedState = currentState;
        console.log('[Tracker] Posture state changed to:', currentState);
        
        // Match ESP32 status naming
        const eventType = isAligned ? 'Good' : 'Bad';
        
        // Pushes to global posture/logs via the DB controller
        KINEdb.addTimelineEvent(user.uid, eventType, deviceInfo.deviation);
      }
    });

    // Handle device status changes locally if needed
    KINEdb.onDevice(user.uid, device => {
       if (device) {
         console.log('[Tracker] Device status:', device.status);
       }
    });
  });
})();
