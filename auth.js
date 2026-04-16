/* ============================================================
   KINE — Authentication Controller
   ============================================================ */

const KINEAuth = (() => {
  'use strict';

  const auth = firebase.auth();
  const db = firebase.database();

  /**
   * Helper to show toast notifications
   */
  function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="ph ${type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'}"></i>
        <span>${message}</span>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  /**
   * Set Persistence to LOCAL (ensures session survives tab closes)
   */
  async function initPersistence() {
    try {
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      console.log("💾 [KINE Auth] Persistence set to LOCAL.");
    } catch (error) {
      console.warn("⚠️ [KINE Auth] Could not set persistence:", error.message);
    }
  }

  /**
   * Sign Up Flow
   */
  async function signUp(name, email, password) {
    console.log("🚀 [KINE Auth] Starting Signup process for:", email);
    try {
      await initPersistence();
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log("✅ [KINE Auth] Step 1: Firebase Auth account created. UID:", user.uid);

      console.log("⏳ [KINE Auth] Step 2: Attempting to initialize user data in Realtime Database...");
      
      // Initialize Profile
      await db.ref(`users/${user.uid}/profile`).set({
        name: name,
        email: email,
        age: 28,
        height: 175,
        joinedAt: firebase.database.ServerValue.TIMESTAMP
      });
      console.log("   - Profile initialized.");

      // Initialize Settings
      await db.ref(`users/${user.uid}/settings`).set({
        vibration: {
          enabled: true,
          intensity: 70,
          pattern: 'steady',
          correctionDelay: 3
        },
        smartSleep: {
          enabled: false,
          bedtime: '22:00',
          wakeUp: '07:00'
        },
        notifications: {
          reminders: true,
          milestones: true
        }
      });
      console.log("   - Settings initialized.");

      // Initialize Device info
      await db.ref(`users/${user.uid}/device`).set({
        name: 'KINE Necklace Pro',
        firmware: '1.0.4',
        serial: 'KN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        battery: 100,
        status: 'disconnected'
      });
      console.log("   - Device info initialized.");

      // Initialize Calibration
      await db.ref(`users/${user.uid}/calibration`).set({
        minAngle: -20,
        maxAngle: 20,
        baseline: 0,
        lastCalibrated: firebase.database.ServerValue.TIMESTAMP
      });
      console.log("   - Calibration data initialized.");

      // Initialize Posture node
      await db.ref(`users/${user.uid}/posture`).set({
        isAligned: true,
        currentScore: 100,
        corrections: 0,
        streak: 0,
        wearTime: 0,
        lastUpdate: firebase.database.ServerValue.TIMESTAMP
      });
      console.log("✅ [KINE Auth] Step 2 Complete: All database nodes created.");

      showToast('Account created successfully!', 'success');
      console.log("🏁 [KINE Auth] Signup Flow Finished Successfully!");
      
      return user;
    } catch (error) {
      console.error("❌ [KINE Auth] SIGNUP ERROR:", error.code, error.message);
      showToast(error.message, 'error');
      throw error;
    }
  }

  /**
   * Log in an existing user
   */
  async function logIn(email, password) {
    console.log("🚀 [KINE Auth] Starting Login process for:", email);
    try {
      await initPersistence();
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log("✅ [KINE Auth] Login successful. UID:", user.uid);

      // Verify profile exists, if not, create a basic one (failsafe)
      const profileSnap = await db.ref(`users/${user.uid}/profile`).once('value');
      if (!profileSnap.exists()) {
        console.warn("⚠️ [KINE Auth] Profile missing! Creating fallback...");
        await db.ref(`users/${user.uid}/profile`).set({
          email: user.email,
          name: user.email.split('@')[0],
          joinedAt: firebase.database.ServerValue.TIMESTAMP
        });
      }

      showToast('Welcome back!', 'success');
      return user;
    } catch (error) {
      console.error("❌ [KINE Auth] LOGIN ERROR:", error.code, error.message);
      showToast(error.message, 'error');
      throw error;
    }
  }

  /**
   * Log out the current user
   */
  async function logOut() {
    console.log("🚀 [KINE Auth] Starting Logout...");
    try {
      await auth.signOut();
      console.log("✅ [KINE Auth] Logout successful.");
      window.location.href = 'login.html';
    } catch (error) {
      console.error("❌ [KINE Auth] LOGOUT ERROR:", error);
      showToast('Error logging out', 'error');
    }
  }

  /**
   * Password Reset Flow
   */
  async function resetPassword(email) {
    try {
      await auth.sendPasswordResetEmail(email);
      showToast('Password reset email sent!', 'success');
    } catch (error) {
      showToast(error.message, 'error');
      throw error;
    }
  }

  /**
   * Auth Guard - Redirect to login if not authenticated
   * Call this on protected pages
   */
  function requireAuth() {
    console.log("🛡️ [KINE Auth] Auth Guard activated. Checking state...");
    auth.onAuthStateChanged(user => {
      if (!user) {
        // Only redirect if we are NOT on a public page
        const publicPages = ['login.html', 'signup.html', 'intro.html', 'index.html'];
        const isPublic = publicPages.some(p => window.location.pathname.endsWith(p));
        
        if (!isPublic) {
          console.warn("🚫 [KINE Auth] Unauthorized access. Redirecting...");
          window.location.href = 'login.html';
        }
      } else {
        console.log("✅ [KINE Auth] User authenticated:", user.email);
      }
    });
  }

  /**
   * Get Current User State
   */
  function onReady(callback) {
    auth.onAuthStateChanged(user => {
      callback(user);
    });
  }

  return {
    signUp,
    logIn,
    logOut,
    resetPassword,
    requireAuth,
    onReady,
    showToast
  };
})();

window.KINEAuth = KINEAuth;
