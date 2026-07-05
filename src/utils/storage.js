import { useSyncExternalStore } from 'react'
import {
  addDoc,
  collection,
  db,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '../firebase'
import { formatReminderTime, toReminderTimeValue } from './app'

const roomId = 'pinky-japu-room'

const fixedUsers = [
  {
    id: 'pinky-user',
    name: 'Pinky',
    username: 'pinky',
    email: 'pinky@email.com',
    password: '123456',
    role: 'pinky',
  },
  {
    id: 'japu-user',
    name: 'Japu',
    username: 'japu',
    email: 'japu@email.com',
    password: '123456',
    role: 'japu',
  },
]

const defaultSettings = {
  notifications: true,
  vibration: true,
  reminderSound: 'Cute chime',
  theme: 'Role based',
  timezone: 'GMT+8',
  backgroundMode: true,
  reminderCheckIn: true,
}

const defaultWhiteboardState = {
  drawing: '',
  textNote: '',
  updatedAt: '',
  updatedBy: '',
  updatedByRole: '',
  lastSentAt: '',
  lastSentBy: '',
  lastSentByName: '',
  sendCount: 0,
}

const storageKeys = {
  currentUser: 'currentUser',
}

const storeState = {
  currentUser: null,
  reminders: [],
  messages: [],
  whiteboardData: defaultWhiteboardState,
  reminderHistory: [],
  syncState: {
    messages: null,
    reminders: null,
    whiteboard: null,
  },
  appSettings: {
    pinky: { ...defaultSettings },
    japu: { ...defaultSettings },
  },
}

const storeSubscribers = new Map(
  ['currentUser', 'reminders', 'messages', 'whiteboardData', 'reminderHistory', 'syncState', 'appSettings'].map((key) => [
    key,
    new Set(),
  ]),
)

let messagesUnsubscribe = null
let remindersUnsubscribe = null
let whiteboardUnsubscribe = null

function getStore() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }

  return {
    getItem() {
      return null
    },
    setItem() {},
    removeItem() {},
  }
}

function normalizeRole(role) {
  return role === 'pinky' ? 'pinky' : 'japu'
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function emitStoreUpdate(key) {
  const subscribers = storeSubscribers.get(key)

  if (!subscribers) {
    return
  }

  subscribers.forEach((callback) => callback())
}

function setStoreValue(key, value, emit = true) {
  storeState[key] = value

  if (emit) {
    emitStoreUpdate(key)
  }
}

function getFriendlyFirestoreMessage(error, fallbackMessage) {
  if (error?.code === 'permission-denied') {
    return 'Firebase permissions are blocking live sync. Publish the Firestore rules for this app to restore shared updates.'
  }

  if (error?.code === 'unavailable') {
    return 'Live sync is temporarily unavailable. Check the internet connection and try again.'
  }

  return fallbackMessage
}

function updateSyncState(channel, message) {
  setStoreValue('syncState', {
    ...storeState.syncState,
    [channel]: message,
  })
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

function getFixedUserByIdentifier(identifier) {
  const normalizedUsername = normalizeUsername(identifier)
  const normalizedEmail = normalizeEmail(identifier)

  return fixedUsers.find(
    (user) =>
      normalizeUsername(user.username) === normalizedUsername || normalizeEmail(user.email) === normalizedEmail,
  )
}

function findFixedUserByRole(role) {
  return fixedUsers.find((user) => user.role === normalizeRole(role)) || fixedUsers[1]
}

function readStoredCurrentUser() {
  const rawValue = getStore().getItem(storageKeys.currentUser)

  if (!rawValue) {
    return null
  }

  try {
    const storedUser = JSON.parse(rawValue)
    const fixedUser = getFixedUserByIdentifier(storedUser?.email || storedUser?.username)

    if (!fixedUser) {
      return null
    }

    return {
      ...fixedUser,
      name: storedUser?.name || fixedUser.name,
    }
  } catch {
    return null
  }
}

function persistCurrentUser(user) {
  if (!user) {
    getStore().removeItem(storageKeys.currentUser)
    return
  }

  getStore().setItem(
    storageKeys.currentUser,
    JSON.stringify({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    }),
  )
}

function setCurrentUserInternal(user) {
  persistCurrentUser(user)
  setStoreValue('currentUser', user)
}

function stopRealtimeSubscriptions() {
  if (messagesUnsubscribe) {
    messagesUnsubscribe()
    messagesUnsubscribe = null
  }

  if (remindersUnsubscribe) {
    remindersUnsubscribe()
    remindersUnsubscribe = null
  }

  if (whiteboardUnsubscribe) {
    whiteboardUnsubscribe()
    whiteboardUnsubscribe = null
  }
}

function toIsoString(value) {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  if (value?.toDate) {
    return value.toDate().toISOString()
  }

  return ''
}

function toDateMs(value) {
  if (!value) {
    return 0
  }

  if (typeof value === 'string') {
    return new Date(value).getTime()
  }

  if (value?.toDate) {
    return value.toDate().getTime()
  }

  return 0
}

function normalizeReminder(data = {}, id) {
  const timeValue = data.timeValue || toReminderTimeValue(data)

  return {
    id,
    title: data.title || '',
    timeValue,
    time: data.time || formatReminderTime(timeValue),
    note: data.note || '',
    active: data.active !== false,
    status: data.status === 'taken' ? 'taken' : 'pending',
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
    takenAt: toIsoString(data.takenAt),
  }
}

function buildReminderHistory(reminders) {
  return reminders
    .map((reminder) => ({
      id: reminder.id,
      title: reminder.title,
      time: reminder.time,
      status: reminder.status === 'taken' ? 'Taken' : 'Pending',
      date: reminder.takenAt || reminder.updatedAt || reminder.createdAt || new Date().toISOString(),
    }))
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
}

function normalizeMessage(data = {}, id) {
  return {
    id,
    text: data.text || '',
    senderRole: data.senderRole || 'pinky',
    senderName: data.senderName || 'Pinky',
    createdAt: toIsoString(data.createdAt),
  }
}

function normalizeWhiteboardData(data = {}) {
  return {
    drawing: data.imageData || '',
    textNote: data.textNote || '',
    updatedAt: toIsoString(data.updatedAt),
    updatedBy: data.updatedBy || '',
    updatedByRole: data.updatedByRole || '',
    lastSentAt: toIsoString(data.lastSentAt),
    lastSentBy: data.lastSentBy || '',
    lastSentByName: data.lastSentByName || '',
    sendCount: Number(data.sendCount || 0),
  }
}

function startRealtimeSubscriptions() {
  if (messagesUnsubscribe || remindersUnsubscribe || whiteboardUnsubscribe) {
    return
  }

  const messagesRef = query(collection(db, 'rooms', roomId, 'messages'), orderBy('createdAt', 'asc'))
  messagesUnsubscribe = onSnapshot(messagesRef, (snapshot) => {
    const messages = snapshot.docs.map((messageDoc) => normalizeMessage(messageDoc.data(), messageDoc.id))
    setStoreValue('messages', messages)
    updateSyncState('messages', null)
  }, (error) => {
    updateSyncState('messages', getFriendlyFirestoreMessage(error, 'Messages could not sync right now.'))
  })

  const remindersRef = query(collection(db, 'rooms', roomId, 'reminders'), orderBy('createdAt', 'asc'))
  remindersUnsubscribe = onSnapshot(remindersRef, (snapshot) => {
    const reminders = snapshot.docs.map((reminderDoc) => normalizeReminder(reminderDoc.data(), reminderDoc.id))
    setStoreValue('reminders', reminders)
    setStoreValue('reminderHistory', buildReminderHistory(reminders))
    updateSyncState('reminders', null)
  }, (error) => {
    updateSyncState('reminders', getFriendlyFirestoreMessage(error, 'Reminders could not sync right now.'))
  })

  const whiteboardRef = doc(db, 'rooms', roomId, 'whiteboard', 'current')
  whiteboardUnsubscribe = onSnapshot(whiteboardRef, (snapshot) => {
    if (!snapshot.exists()) {
      setStoreValue('whiteboardData', defaultWhiteboardState)
      updateSyncState('whiteboard', null)
      return
    }

    setStoreValue('whiteboardData', normalizeWhiteboardData(snapshot.data()))
    updateSyncState('whiteboard', null)
  }, (error) => {
    updateSyncState('whiteboard', getFriendlyFirestoreMessage(error, 'Whiteboard sync is currently unavailable.'))
  })
}

export function initializeMockData() {
  setStoreValue('currentUser', readStoredCurrentUser(), false)
}

export async function hydrateCurrentUser() {
  const storedUser = readStoredCurrentUser()

  if (!storedUser) {
    stopRealtimeSubscriptions()
    setStoreValue('currentUser', null)
    return null
  }

  setCurrentUserInternal(storedUser)
  startRealtimeSubscriptions()
  return storedUser
}

export function getCurrentUser() {
  return storeState.currentUser
}

export function getRoleHome(role) {
  return normalizeRole(role) === 'pinky' ? '/pinky' : '/japu'
}

export async function loginUser({ username, password }) {
  const fixedUser = getFixedUserByIdentifier(username)

  if (!fixedUser || String(password || '') !== fixedUser.password) {
    throw new Error('Invalid username/email or password.')
  }

  const rememberedUser = readStoredCurrentUser()
  const nextUser =
    rememberedUser && rememberedUser.role === fixedUser.role
      ? { ...fixedUser, name: rememberedUser.name || fixedUser.name }
      : { ...fixedUser }

  setCurrentUserInternal(nextUser)
  startRealtimeSubscriptions()
  return nextUser
}

export async function logoutUser() {
  stopRealtimeSubscriptions()
  persistCurrentUser(null)
  setStoreValue('currentUser', null)
}

export async function updateUserProfile({ name, username, email, password, confirmPassword }) {
  const currentUser = getCurrentUser()

  if (!currentUser) {
    throw new Error('Please log in first.')
  }

  const fixedUser = findFixedUserByRole(currentUser.role)
  const displayName = String(name || '').trim()

  if (!displayName) {
    throw new Error('Please enter your full name.')
  }

  if (
    normalizeUsername(username) !== normalizeUsername(fixedUser.username) ||
    normalizeEmail(email) !== normalizeEmail(fixedUser.email)
  ) {
    throw new Error('Username and email are fixed for this shared app.')
  }

  if (password || confirmPassword) {
    throw new Error('Password is fixed for this shared app.')
  }

  const updatedUser = {
    ...fixedUser,
    name: displayName,
  }

  setCurrentUserInternal(updatedUser)
  return updatedUser
}

export function getReminders() {
  return storeState.reminders
}

export async function addReminder(reminder) {
  const remindersCollection = collection(db, 'rooms', roomId, 'reminders')

  try {
    await addDoc(remindersCollection, {
      title: String(reminder.title || '').trim(),
      timeValue: reminder.timeValue || '',
      time: reminder.time || formatReminderTime(reminder.timeValue),
      note: String(reminder.note || '').trim(),
      active: reminder.active !== false,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      takenAt: null,
    })
  } catch (error) {
    updateSyncState('reminders', getFriendlyFirestoreMessage(error, 'Reminder save failed.'))
    throw new Error(getFriendlyFirestoreMessage(error, 'Reminder save failed.'))
  }
}

export async function updateReminder(reminderId, patch) {
  const reminderRef = doc(db, 'rooms', roomId, 'reminders', reminderId)
  const payload = { updatedAt: serverTimestamp() }

  if ('title' in patch) {
    payload.title = String(patch.title || '').trim()
  }

  if ('note' in patch) {
    payload.note = String(patch.note || '').trim()
  }

  if ('active' in patch) {
    payload.active = Boolean(patch.active)
  }

  if ('timeValue' in patch || 'time' in patch) {
    const timeValue = patch.timeValue || toReminderTimeValue(patch)
    payload.timeValue = timeValue
    payload.time = patch.time || formatReminderTime(timeValue)
  }

  if ('status' in patch) {
    payload.status = patch.status
  }

  if ('takenAt' in patch) {
    payload.takenAt = patch.takenAt
  }

  try {
    await updateDoc(reminderRef, payload)
  } catch (error) {
    updateSyncState('reminders', getFriendlyFirestoreMessage(error, 'Reminder update failed.'))
    throw new Error(getFriendlyFirestoreMessage(error, 'Reminder update failed.'))
  }
}

export async function deleteReminder(reminderId) {
  try {
    await deleteDoc(doc(db, 'rooms', roomId, 'reminders', reminderId))
  } catch (error) {
    updateSyncState('reminders', getFriendlyFirestoreMessage(error, 'Reminder delete failed.'))
    throw new Error(getFriendlyFirestoreMessage(error, 'Reminder delete failed.'))
  }
}

export async function markReminderStatus(reminder, status = 'Taken') {
  const reminderRef = doc(db, 'rooms', roomId, 'reminders', reminder.id)

  if (status === 'Taken') {
    try {
      await updateDoc(reminderRef, {
        status: 'taken',
        takenAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      updateSyncState('reminders', getFriendlyFirestoreMessage(error, 'Reminder check-in failed.'))
      throw new Error(getFriendlyFirestoreMessage(error, 'Reminder check-in failed.'))
    }
    return
  }

  try {
    await updateDoc(reminderRef, {
      status: 'pending',
      takenAt: null,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    updateSyncState('reminders', getFriendlyFirestoreMessage(error, 'Reminder check-in failed.'))
    throw new Error(getFriendlyFirestoreMessage(error, 'Reminder check-in failed.'))
  }
}

export function getMessages() {
  return storeState.messages
}

export async function sendMessage({ text, senderRole, senderName }) {
  const trimmedText = String(text || '').trim()

  if (!trimmedText) {
    return
  }

  try {
    await addDoc(collection(db, 'rooms', roomId, 'messages'), {
      text: trimmedText,
      senderRole,
      senderName,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    updateSyncState('messages', getFriendlyFirestoreMessage(error, 'Message send failed.'))
    throw new Error(getFriendlyFirestoreMessage(error, 'Message send failed.'))
  }
}

export function getWhiteboardData() {
  return storeState.whiteboardData
}

export async function saveWhiteboardData(data) {
  const currentUser = getCurrentUser()
  const whiteboardRef = doc(db, 'rooms', roomId, 'whiteboard', 'current')
  const payload = {
    imageData: data.drawing || data.imageData || '',
    textNote: data.textNote || '',
    updatedBy: currentUser?.name || data.updatedBy || '',
    updatedByRole: currentUser?.role || data.updatedByRole || '',
    updatedAt: serverTimestamp(),
  }

  if (data.lastSentAt) {
    payload.lastSentAt = serverTimestamp()
    payload.lastSentBy = data.lastSentBy || currentUser?.role || ''
    payload.lastSentByName = data.lastSentByName || currentUser?.name || ''
    payload.sendCount = Number(data.sendCount || storeState.whiteboardData.sendCount || 0)
  }

  try {
    await setDoc(whiteboardRef, payload, { merge: true })
  } catch (error) {
    updateSyncState('whiteboard', getFriendlyFirestoreMessage(error, 'Whiteboard save failed.'))
    throw new Error(getFriendlyFirestoreMessage(error, 'Whiteboard save failed.'))
  }
}

export function getReminderHistory() {
  return storeState.reminderHistory
}

export function getSettings() {
  const currentRole = normalizeRole(getCurrentUser()?.role)
  return storeState.appSettings[currentRole]
}

export function saveSettings(settings, role = getCurrentUser()?.role) {
  const nextRole = normalizeRole(role)
  const nextSettings = {
    ...storeState.appSettings,
    [nextRole]: {
      ...storeState.appSettings[nextRole],
      ...settings,
    },
  }

  setStoreValue('appSettings', nextSettings)
  return nextSettings[nextRole]
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

export function useSyncState() {
  return useStoreValue('syncState')
}

export function useSettings(role) {
  const appSettings = useStoreValue('appSettings')
  const currentUser = useCurrentUser()
  const nextRole = normalizeRole(role || currentUser?.role)
  return appSettings[nextRole]
}

export { fixedUsers, roomId, storageKeys }
