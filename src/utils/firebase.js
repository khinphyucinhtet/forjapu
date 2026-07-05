import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const fallbackFirebaseConfig = {
  apiKey: 'AIzaSyB_iMbx4hUWp0OJDwnEBrFbRr3O9Yavrxk',
  authDomain: 'forjapu-2b79d.firebaseapp.com',
  projectId: 'forjapu-2b79d',
  storageBucket: 'forjapu-2b79d.firebasestorage.app',
  messagingSenderId: '106651746354',
  appId: '1:106651746354:web:9d98ea12af5f0057197c2b',
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackFirebaseConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackFirebaseConfig.appId,
}

export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every(Boolean)
}

const firebaseApp = isFirebaseConfigured()
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null

const auth = firebaseApp ? getAuth(firebaseApp) : null
const db = firebaseApp ? getFirestore(firebaseApp) : null

export { auth, db, firebaseApp, firebaseConfig }
