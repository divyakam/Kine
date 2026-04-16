// KINE Firebase Configuration
// Using Firebase Compat SDK for static multi-page app integration

const firebaseConfig = {
  apiKey: "AIzaSyD8sVH-gYz4f4Hlr8PBnfSJBog172o7NWE",
  authDomain: "esp-project-5d190.firebaseapp.com",
  databaseURL: "https://esp-project-5d190-default-rtdb.firebaseio.com",
  projectId: "esp-project-5d190",
  storageBucket: "esp-project-5d190.firebasestorage.app",
  messagingSenderId: "1094688981180",
  appId: "1:1094688981180:web:7dbd21bf2f581e1db8d0b9"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.database();

window.KINE_FIREBASE = {
  auth,
  db
};
