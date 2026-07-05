import { useSyncExternalStore } from 'react'
import {
  defaultHistory,
  defaultMessages,
  defaultReminders,
  defaultSettings,
  defaultUsers,
  defaultWhiteboard,
} from './mockData'
import { auth, db, isFirebaseConfigured } from './firebase'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
  updateProfile,
} from 'firebase/auth'
import { collection, doc, getDoc, getDocs, limit, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore'

const storageKeys = {
  currentUser: 'currentUser',
  users: 'users',
  reminders: 'reminders',
  messages: 'messages',
  whiteboardData: 'whiteboardData',
  reminderHistory: 'reminderHistory',
  appSettings: 'appSettings',
}

const inMemoryStore = new Map()

function getStore() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }

  return {
    getItem(key) {
      return inMemoryStore.get(key) ?? null
    },
    setItem(key, value) {
      inMemoryStore.set(key, value)
    },
    removeItem(key) {
      inMemoryStore.delete(key)
    },
  }
}

function readJson(key, fallbackValue) {
  const rawValue = getStore().getItem(key)

  if (!rawValue) {
    return fallbackValue
  }

  try {
    return JSON.parse(rawValue)
  } catch {
    return fallbackValue
  }
}

function writeJson(key, value) {
  getStore().setItem(key, JSON.stringify(value))
}

function makeId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

function normalizeRole(role) {
  return role === 'pinky' ? 'pinky' : 'japu'
}

function normalizeUsername(username) {
  return String(username || '')
    .trim()
    .toLowerCase()
}

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase()
}

function isEmailLike(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value))
}

function makeLegacyShadowEmail(username) {
  const safeUsername = normalizeUsername(username).replace(/[^a-z0-9._-]/g, '')
  return `${safeUsername || makeId('user')}@forjapu.app`
}

function normalizeLocalUser(user) {
  const derivedUsername =
    normalizeUsername(user.username) ||
    normalizeUsername(user.name) ||
    normalizeUsername(user.email?.split('@')[0]) ||
    makeId('user')

  return {
    ...user,
    name: user.name || user.username || user.email?.split('@')[0] || 'Friend',
    email: normalizeEmail(user.email) || makeLegacyShadowEmail(derivedUsername),
    role: normalizeRole(user.role),
    username: derivedUsername,
  }
}

const storeKeyMap = {
  currentUser: storageKeys.currentUser,
  users: storageKeys.users,
  reminders: storageKeys.reminders,
  messages: storageKeys.messages,
  whiteboardData: storageKeys.whiteboardData,
  reminderHistory: storageKeys.reminderHistory,
  appSettings: storageKeys.appSettings,
}

const sharedDataKeys = ['reminders', 'messages', 'whiteboardData', 'reminderHistory', 'appSettings']

function createDefaultSettingsState() {
  return {
    pinky: { ...defaultSettings },
    japu: { ...defaultSettings },
  }
}

function normalizeSettingsState(value) {
  const fallback = createDefaultSettingsState()

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fallback
  }

  const hasRoleBuckets =
    value.pinky &&
    typeof value.pinky === 'object' &&
    value.japu &&
    typeof value.japu === 'object'

  if (hasRoleBuckets) {
    return {
      pinky: { ...defaultSettings, ...value.pinky },
      japu: { ...defaultSettings, ...value.japu },
    }
  }

  return {
    pinky: { ...defaultSettings, ...value },
    japu: { ...defaultSettings, ...value },
  }
}

function buildInitialStoreState() {
  return {
    currentUser: readJson(storageKeys.currentUser, null),
    users: readJson(storageKeys.users, defaultUsers).map(normalizeLocalUser),
    reminders: readJson(storageKeys.reminders, defaultReminders),
    messages: readJson(storageKeys.messages, defaultMessages),
    whiteboardData: {
      ...defaultWhiteboard,
      ...readJson(storageKeys.whiteboardData, defaultWhiteboard),
    },
    reminderHistory: readJson(storageKeys.reminderHistory, defaultHistory),
    appSettings: normalizeSettingsState(readJson(storageKeys.appSettings, createDefaultSettingsState())),
  }
}

const storeState = buildInitialStoreState()
const storeSubscribers = new Map(
  Object.keys(storeKeyMap).map((key) => [key, new Set()]),
)

let sharedRealtimeUnsubscribe = null
let sharedDocSeeded = false

function emitStoreUpdate(key) {
  const subscribers = storeSubscribers.get(key)

  if (!subscribers) {
    return
  }

  subscribers.forEach((callback) => callback())
}

function setStoreValue(key, value, options = {}) {
  const { persistLocal = true, emit = true } = options
  storeState[key] = value

  if (persistLocal) {
    writeJson(storeKeyMap[key], value)
  }

  if (emit) {
    emitStoreUpdate(key)
  }
}

function useStoreValue(key) {
  return useSyncExternalStore(
    (callback) => {
      const subscribers = storeSubscribers.get(key)
      subscribers.add(callback)
      return () => subscribers.delete(callback)
    },
    () => storeState[key],
    () => storeState[key],
  )
}

function normalizeSharedData(data = {}) {
  return {
    reminders: Array.isArray(data.reminders) ? data.reminders : storeState.reminders,
    messages: Array.isArray(data.messages) ? data.messages : storeState.messages,
    whiteboardData: {
      ...defaultWhiteboard,
      ...(data.whiteboardData && typeof data.whiteboardData === 'object' ? data.whiteboardData : storeState.whiteboardData),
    },
    reminderHistory: Array.isArray(data.reminderHistory) ? data.reminderHistory : storeState.reminderHistory,
    appSettings: normalizeSettingsState(data.appSettings ?? storeState.appSettings),
  }
}

function buildSharedDataPayload(overrides = {}) {
  return {
    reminders: overrides.reminders ?? storeState.reminders,
    messages: overrides.messages ?? storeState.messages,
    whiteboardData: overrides.whiteboardData ?? storeState.whiteboardData,
    reminderHistory: overrides.reminderHistory ?? storeState.reminderHistory,
    appSettings: overrides.appSettings ?? storeState.appSettings,
  }
}

function syncUserIntoLocalState(user, password) {
  const existingUsers = getUsers()
  const updatedUsers = existingUsers.some((entry) => entry.id === user.id)
    ? existingUsers.map((entry) =>
        entry.id === user.id
          ? { ...entry, ...user, ...(password ? { password } : {}) }
          : entry,
      )
    : [...existingUsers, { ...user, ...(password ? { password } : {}) }]

  setStoreValue('users', updatedUsers, { persistLocal: true, emit: true })
  setCurrentUser({ ...getCurrentUser(), ...user })
}

function syncSharedDataToStore(sharedData) {
  sharedDataKeys.forEach((key) => {
    setStoreValue(key, sharedData[key], { persistLocal: true, emit: true })
  })
}

async function seedSharedDataDoc() {
  if (!db || sharedDocSeeded) {
    return
  }

  sharedDocSeeded = true

  try {
    await setDoc(
      doc(db, 'appState', 'shared'),
      {
        ...buildSharedDataPayload(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    sharedDocSeeded = false
    console.error('Unable to seed shared app state.', error)
  }
}

function stopRealtimeSubscriptions() {
  if (sharedRealtimeUnsubscribe) {
    sharedRealtimeUnsubscribe()
    sharedRealtimeUnsubscribe = null
  }
}

function ensureRealtimeSubscriptions() {
  if (!isFirebaseConfigured() || !db || sharedRealtimeUnsubscribe) {
    return
  }

  const sharedDocRef = doc(db, 'appState', 'shared')

  sharedRealtimeUnsubscribe = onSnapshot(
    sharedDocRef,
    async (snapshot) => {
      if (!snapshot.exists()) {
        await seedSharedDataDoc()
        return
      }

      sharedDocSeeded = true
      syncSharedDataToStore(normalizeSharedData(snapshot.data()))
    },
    (error) => {
      console.error('Realtime sync failed. Falling back to local cache.', error)
      stopRealtimeSubscriptions()
    },
  )
}

async function persistSharedSlice(key, value) {
  setStoreValue(key, value, { persistLocal: true, emit: true })

  if (!isFirebaseConfigured() || !db) {
    return value
  }

  ensureRealtimeSubscriptions()

  try {
    await setDoc(
      doc(db, 'appState', 'shared'),
      {
        [key]: value,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    console.error(`Unable to sync ${key} in real time.`, error)
  }

  return value
}

function toFriendlyAuthError(error) {
  const errorCode = error?.code

  switch (errorCode) {
    case 'auth/email-already-in-use':
      return new Error('That email is already registered.')
    case 'auth/invalid-email':
      return new Error('Please enter a valid email address.')
    case 'auth/weak-password':
      return new Error('Password should be at least 6 characters.')
    case 'auth/requires-recent-login':
      return new Error('Please log in again before changing your email or password.')
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return new Error('Invalid email/username or password.')
    default:
      return error instanceof Error ? error : new Error('Something went wrong. Please try again.')
  }
}

async function getFirebaseProfile(uid) {
  if (!db) {
    return null
  }

  const profileSnapshot = await getDoc(doc(db, 'users', uid))
  return profileSnapshot.exists() ? profileSnapshot.data() : null
}

async function findFirebaseProfileByUsername(username) {
  if (!db) {
    return null
  }

  const normalizedUsername = normalizeUsername(username)

  if (!normalizedUsername) {
    return null
  }

  const profileQuery = query(
    collection(db, 'users'),
    where('usernameLower', '==', normalizedUsername),
    limit(1),
  )
  const profileSnapshot = await getDocs(profileQuery)

  return profileSnapshot.empty ? null : profileSnapshot.docs[0].data()
}

async function resolveFirebaseLoginEmail(identifier) {
  const normalizedEmail = normalizeEmail(identifier)

  if (isEmailLike(normalizedEmail)) {
    return normalizedEmail
  }

  try {
    const profile = await findFirebaseProfileByUsername(identifier)

    if (profile?.email) {
      return normalizeEmail(profile.email)
    }
  } catch {
    // Fall back to the legacy username-based auth email format for older accounts.
  }

  return makeLegacyShadowEmail(identifier)
}

async function buildCurrentUserFromFirebase(firebaseUser, fallbackRole = 'japu') {
  const profile = await getFirebaseProfile(firebaseUser.uid)
  const currentUser = {
    id: firebaseUser.uid,
    name: profile?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Friend',
    username:
      profile?.username ||
      normalizeUsername(firebaseUser.displayName) ||
      normalizeUsername(firebaseUser.email?.split('@')[0]) ||
      'friend',
    email: firebaseUser.email || '',
    role: normalizeRole(profile?.role || fallbackRole),
    authProvider: 'firebase',
  }

  setCurrentUser(currentUser)
  ensureRealtimeSubscriptions()
  return currentUser
}

export function initializeMockData() {
  const users = getStore().getItem(storageKeys.users)
    ? readJson(storageKeys.users, defaultUsers).map(normalizeLocalUser)
    : defaultUsers.map(normalizeLocalUser)

  setStoreValue('users', users, { persistLocal: true, emit: false })
  setStoreValue(
    'reminders',
    getStore().getItem(storageKeys.reminders) ? readJson(storageKeys.reminders, defaultReminders) : defaultReminders,
    { persistLocal: true, emit: false },
  )
  setStoreValue(
    'messages',
    getStore().getItem(storageKeys.messages) ? readJson(storageKeys.messages, defaultMessages) : defaultMessages,
    { persistLocal: true, emit: false },
  )
  setStoreValue(
    'whiteboardData',
    {
      ...defaultWhiteboard,
      ...(getStore().getItem(storageKeys.whiteboardData)
        ? readJson(storageKeys.whiteboardData, defaultWhiteboard)
        : defaultWhiteboard),
    },
    { persistLocal: true, emit: false },
  )
  setStoreValue(
    'reminderHistory',
    getStore().getItem(storageKeys.reminderHistory)
      ? readJson(storageKeys.reminderHistory, defaultHistory)
      : defaultHistory,
    { persistLocal: true, emit: false },
  )
  setStoreValue(
    'appSettings',
    normalizeSettingsState(
      getStore().getItem(storageKeys.appSettings)
        ? readJson(storageKeys.appSettings, createDefaultSettingsState())
        : createDefaultSettingsState(),
    ),
    { persistLocal: true, emit: false },
  )
}

export function getUsers() {
  return storeState.users
}

export function getCurrentUser() {
  return storeState.currentUser
}

export function setCurrentUser(user) {
  setStoreValue('currentUser', user, { persistLocal: true, emit: true })
}

export async function hydrateCurrentUser() {
  if (!isFirebaseConfigured() || !auth) {
    return getCurrentUser()
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        unsubscribe()

        if (!firebaseUser) {
          stopRealtimeSubscriptions()
          setStoreValue('currentUser', null, { persistLocal: false, emit: true })
          getStore().removeItem(storageKeys.currentUser)
          resolve(null)
          return
        }

        resolve(await buildCurrentUserFromFirebase(firebaseUser))
      },
      () => {
        unsubscribe()
        resolve(getCurrentUser())
      },
    )
  })
}

export async function loginUser({ username, password }) {
  const identifier = String(username || '').trim()

  if (!identifier) {
    throw new Error('Please enter your email or username.')
  }

  if (isFirebaseConfigured() && auth) {
    try {
      const email = await resolveFirebaseLoginEmail(identifier)
      const credential = await signInWithEmailAndPassword(auth, email, password)
      return buildCurrentUserFromFirebase(credential.user)
    } catch (error) {
      throw toFriendlyAuthError(error)
    }
  }

  const normalizedUsername = normalizeUsername(identifier)
  const normalizedEmail = normalizeEmail(identifier)
  const user = getUsers().find(
    (candidate) =>
      candidate.password === password &&
      (candidate.username === normalizedUsername || candidate.email === normalizedEmail),
  )

  if (!user) {
    throw new Error('Invalid email/username or password.')
  }

  setCurrentUser(user)
  ensureRealtimeSubscriptions()
  return user
}

export async function registerUser({ username, email, password, confirmPassword, role }) {
  const normalizedUsername = normalizeUsername(username)
  const normalizedEmail = normalizeEmail(email)
  const displayName = String(username || '').trim()
  const normalizedRole = normalizeRole(role)

  if (!normalizedUsername) {
    throw new Error('Please enter a username.')
  }

  if (!normalizedEmail) {
    throw new Error('Please enter an email address.')
  }

  if (!isEmailLike(normalizedEmail)) {
    throw new Error('Please enter a valid email address.')
  }

  if (String(password || '').length < 6) {
    throw new Error('Password should be at least 6 characters.')
  }

  if (password !== confirmPassword) {
    throw new Error('Passwords do not match.')
  }

  if (isFirebaseConfigured() && auth && db) {
    try {
      const existingProfile = await findFirebaseProfileByUsername(normalizedUsername).catch(() => null)

      if (existingProfile) {
        throw new Error('That username is already taken.')
      }

      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
      await updateProfile(credential.user, { displayName })
      await setDoc(doc(db, 'users', credential.user.uid), {
        uid: credential.user.uid,
        name: displayName,
        username: normalizedUsername,
        usernameLower: normalizedUsername,
        email: normalizedEmail,
        role: normalizedRole,
        createdAt: serverTimestamp(),
      })

      return buildCurrentUserFromFirebase(credential.user, normalizedRole)
    } catch (error) {
      if (error?.message === 'That username is already taken.') {
        throw error
      }

      throw toFriendlyAuthError(error)
    }
  }

  const users = getUsers()

  if (users.some((user) => user.username === normalizedUsername)) {
    throw new Error(
      'That username is already taken in demo mode. Add your Firebase keys in .env.local to create real Firebase users.',
    )
  }

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error(
      'That email is already registered in demo mode. Add your Firebase keys in .env.local to create real Firebase users.',
    )
  }

  const newUser = {
    id: makeId('user'),
    name: displayName,
    username: normalizedUsername,
    email: normalizedEmail,
    password,
    role: normalizedRole,
  }

  const updatedUsers = [...users, newUser]
  setStoreValue('users', updatedUsers, { persistLocal: true, emit: true })
  setCurrentUser(newUser)
  return newUser
}

export async function logoutUser() {
  if (isFirebaseConfigured() && auth) {
    await signOut(auth)
  }

  stopRealtimeSubscriptions()
  setStoreValue('currentUser', null, { persistLocal: false, emit: true })
  getStore().removeItem(storageKeys.currentUser)
}

export async function updateUserProfile({ name, username, email, password, confirmPassword }) {
  const currentUser = getCurrentUser()

  if (!currentUser) {
    throw new Error('Please log in first.')
  }

  const displayName = String(name || '').trim()
  const normalizedUsername = normalizeUsername(username)
  const normalizedEmail = normalizeEmail(email)
  const nextPassword = String(password || '')
  const nextConfirmPassword = String(confirmPassword || '')

  if (!displayName) {
    throw new Error('Please enter your full name.')
  }

  if (!normalizedUsername) {
    throw new Error('Please enter a username.')
  }

  if (!normalizedEmail || !isEmailLike(normalizedEmail)) {
    throw new Error('Please enter a valid email address.')
  }

  if (nextPassword || nextConfirmPassword) {
    if (nextPassword.length < 6) {
      throw new Error('Password should be at least 6 characters.')
    }

    if (nextPassword !== nextConfirmPassword) {
      throw new Error('Passwords do not match.')
    }
  }

  if (isFirebaseConfigured() && auth && db) {
    try {
      const currentAuthUser = auth.currentUser

      if (!currentAuthUser) {
        throw new Error('Please log in again before editing your profile.')
      }

      const existingProfile = await findFirebaseProfileByUsername(normalizedUsername).catch(() => null)

      if (existingProfile?.uid && existingProfile.uid !== currentAuthUser.uid) {
        throw new Error('That username is already taken.')
      }

      if (normalizedEmail !== normalizeEmail(currentAuthUser.email)) {
        await updateEmail(currentAuthUser, normalizedEmail)
      }

      if (nextPassword) {
        await updatePassword(currentAuthUser, nextPassword)
      }

      await updateProfile(currentAuthUser, { displayName })
      await setDoc(
        doc(db, 'users', currentAuthUser.uid),
        {
          uid: currentAuthUser.uid,
          name: displayName,
          username: normalizedUsername,
          usernameLower: normalizedUsername,
          email: normalizedEmail,
          role: currentUser.role,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      const updatedUser = {
        ...currentUser,
        name: displayName,
        username: normalizedUsername,
        email: normalizedEmail,
      }

      syncUserIntoLocalState(updatedUser)
      return updatedUser
    } catch (error) {
      if (error?.message === 'That username is already taken.') {
        throw error
      }

      throw toFriendlyAuthError(error)
    }
  }

  const existingUsers = getUsers()

  if (existingUsers.some((user) => user.id !== currentUser.id && user.username === normalizedUsername)) {
    throw new Error('That username is already taken.')
  }

  if (existingUsers.some((user) => user.id !== currentUser.id && user.email === normalizedEmail)) {
    throw new Error('That email is already registered.')
  }

  const updatedUser = {
    ...currentUser,
    name: displayName,
    username: normalizedUsername,
    email: normalizedEmail,
  }

  syncUserIntoLocalState(updatedUser, nextPassword || undefined)
  return updatedUser
}

export function getReminders() {
  return storeState.reminders
}

export function saveReminders(reminders) {
  void persistSharedSlice('reminders', reminders)
  return reminders
}

export function addReminder(reminder) {
  const updatedReminders = [...getReminders(), { id: makeId('rem'), active: true, ...reminder }]
  saveReminders(updatedReminders)
  return updatedReminders
}

export function updateReminder(reminderId, patch) {
  const updatedReminders = getReminders().map((reminder) =>
    reminder.id === reminderId ? { ...reminder, ...patch } : reminder,
  )
  saveReminders(updatedReminders)
  return updatedReminders
}

export function deleteReminder(reminderId) {
  const updatedReminders = getReminders().filter((reminder) => reminder.id !== reminderId)
  saveReminders(updatedReminders)
  return updatedReminders
}

export function getMessages() {
  return storeState.messages
}

export function saveMessages(messages) {
  void persistSharedSlice('messages', messages)
  return messages
}

export function sendMessage(message) {
  const newMessage = {
    id: makeId('msg'),
    createdAt: new Date().toISOString(),
    type: 'chat',
    ...message,
  }
  const updatedMessages = [...getMessages(), newMessage]
  saveMessages(updatedMessages)
  return newMessage
}

export function getWhiteboardData() {
  return storeState.whiteboardData
}

export function saveWhiteboardData(data) {
  const payload = {
    ...storeState.whiteboardData,
    ...data,
    updatedAt: new Date().toISOString(),
  }
  void persistSharedSlice('whiteboardData', payload)
  return payload
}

export function getReminderHistory() {
  return storeState.reminderHistory
}

export function saveReminderHistory(history) {
  void persistSharedSlice('reminderHistory', history)
  return history
}

export function markReminderStatus(reminder, status = 'Taken') {
  const historyEntry = {
    id: makeId('hist'),
    title: reminder.title,
    time: reminder.time,
    status,
    date: new Date().toISOString(),
  }
  const updatedHistory = [historyEntry, ...getReminderHistory()].slice(0, 30)
  saveReminderHistory(updatedHistory)
  return updatedHistory
}

export function getSettings() {
  const currentRole = normalizeRole(getCurrentUser()?.role)
  const roleSettings = normalizeSettingsState(storeState.appSettings)
  return roleSettings[currentRole]
}

export function saveSettings(settings, role = getCurrentUser()?.role) {
  const normalizedRole = normalizeRole(role)
  const payload = normalizeSettingsState(storeState.appSettings)
  payload[normalizedRole] = {
    ...payload[normalizedRole],
    ...settings,
  }
  void persistSharedSlice('appSettings', payload)
  return payload[normalizedRole]
}

export function getRoleHome(role) {
  return normalizeRole(role) === 'pinky' ? '/pinky' : '/japu'
}

export function useCurrentUser() {
  return useStoreValue('currentUser')
}

export function useReminders() {
  return useStoreValue('reminders')
}

export function useMessages() {
  return useStoreValue('messages')
}

export function useWhiteboardData() {
  return useStoreValue('whiteboardData')
}

export function useReminderHistory() {
  return useStoreValue('reminderHistory')
}

export function useSettings(role) {
  const appSettings = useStoreValue('appSettings')
  const currentUser = useCurrentUser()
  const resolvedRole = normalizeRole(role || currentUser?.role)
  const normalizedSettings = normalizeSettingsState(appSettings)
  return normalizedSettings[resolvedRole]
}

export { storageKeys }
