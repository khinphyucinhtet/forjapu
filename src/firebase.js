import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'PASTE_HERE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'PASTE_HERE',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'PASTE_HERE',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'PASTE_HERE',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'PASTE_HERE',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'PASTE_HERE',
}

const fallbackFirebaseConfig = {
  apiKey: 'AIzaSyB_iMbx4hUWp0OJDwnEBrFbRr3O9Yavrxk',
  authDomain: 'forjapu-2b79d.firebaseapp.com',
  projectId: 'forjapu-2b79d',
  storageBucket: 'forjapu-2b79d.firebasestorage.app',
  messagingSenderId: '106651746354',
  appId: '1:106651746354:web:9d98ea12af5f0057197c2b',
}

const resolvedFirebaseConfig = {
  apiKey:
    firebaseConfig.apiKey && firebaseConfig.apiKey !== 'PASTE_HERE'
      ? firebaseConfig.apiKey
      : fallbackFirebaseConfig.apiKey,
  authDomain:
    firebaseConfig.authDomain && firebaseConfig.authDomain !== 'PASTE_HERE'
      ? firebaseConfig.authDomain
      : fallbackFirebaseConfig.authDomain,
  projectId:
    firebaseConfig.projectId && firebaseConfig.projectId !== 'PASTE_HERE'
      ? firebaseConfig.projectId
      : fallbackFirebaseConfig.projectId,
  storageBucket:
    firebaseConfig.storageBucket && firebaseConfig.storageBucket !== 'PASTE_HERE'
      ? firebaseConfig.storageBucket
      : fallbackFirebaseConfig.storageBucket,
  messagingSenderId:
    firebaseConfig.messagingSenderId && firebaseConfig.messagingSenderId !== 'PASTE_HERE'
      ? firebaseConfig.messagingSenderId
      : fallbackFirebaseConfig.messagingSenderId,
  appId:
    firebaseConfig.appId && firebaseConfig.appId !== 'PASTE_HERE' ? firebaseConfig.appId : fallbackFirebaseConfig.appId,
}

const firebaseApp = getApps().length ? getApp() : initializeApp(resolvedFirebaseConfig)
const db = getFirestore(firebaseApp)

export {
  addDoc,
  collection,
  db,
  deleteDoc,
  doc,
  firebaseApp,
  firebaseConfig,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
}
