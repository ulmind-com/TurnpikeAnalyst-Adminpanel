import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";

/**
 * Firebase's web configuration. Every value here is a public identifier and
 * is served inside the JavaScript bundle of every Firebase web app — the
 * `apiKey` is not a credential and grants nothing on its own. What actually
 * guards the project is the Authorized domains list and the security rules,
 * so these are committed as defaults rather than treated as secrets.
 *
 * They are still read from the environment first, so pointing an app at a
 * different Firebase project is a deploy setting rather than a code change.
 * Override all seven together or none: a half-overridden config points auth
 * at one project and the token audience at another.
 */
const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyBmuYJSJ7_WLOa430pP1xcmRFSjjMYMkt4",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "turnpikeanalyst-ff936.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "turnpikeanalyst-ff936",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "turnpikeanalyst-ff936.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "513152040097",
  appId: env.VITE_FIREBASE_APP_ID || "1:513152040097:web:5add3fe2738a75cc2a44e0",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-TYVHV7PRW1",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");
