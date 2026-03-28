import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getAnalytics, type Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyADd0HCDsN-Z3ddC-6U1qf4iFzYGbseQFw",
  authDomain: "os-vlab-a3dd6.firebaseapp.com",
  projectId: "os-vlab-a3dd6",
  storageBucket: "os-vlab-a3dd6.firebasestorage.app",
  messagingSenderId: "806217178539",
  appId: "1:806217178539:web:5ceba99707850ab67c46ee",
  measurementId: "G-90SZQKXYEB"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let analytics: Analytics | null = null;

// Conditionally initialize Firebase only if the config is not a placeholder.
// This prevents the app from crashing if the configuration is missing.
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  analytics = getAnalytics(app);
} else {
  console.warn("Firebase configuration is missing or incomplete in firebase.ts. Authentication features will be disabled.");
}

// Export auth and analytics services (which may be null if not configured)
export { auth, googleProvider, analytics };