import { useSyncExternalStore } from 'react'
import { addDoc, collection, db, onSnapshot, orderBy, query, serverTimestamp } from '../firebase'
import { REAL_SHARED_SPACE_ID } from '../config/authorizedUsers'
import { loginWithFixedUser, logoutAuthUser, subscribeToAuthSession, updateAuthorizedDisplayName } from '../services/authService'
import {
  createReminder,
  deleteReminderRecord,
  subscribeToRealtimeReminders,
  updateReminderCompletion,
  updateReminderRecord,
} from '../services/reminderService'
import {
  createWhiteboardObject as createRealtimeWhiteboardObject,
  normalizeWhiteboardMetadata,
  sendWhiteboard,
  softDeleteWhiteboardObject as removeRealtimeWhiteboardObject,
  subscribeToRealtimeWhiteboard,
  touchWhiteboard,
} from '../services/whiteboardService'

const defaultSettings = {
  notifications: true,
  vibration: true,
  reminderSound: 'Cute chime',
  theme: 'Role based',
  timezone: 'Asia/Kuala_Lumpur',
  backgroundMode: true,
  reminderCheckIn: true,
}

const defaultWhiteboardState = {
  ...normalizeWhiteboardMetadata(),
  objects: [],
}

const storageKeys = {
  appSettings: 'forjapu-app-settings',
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

let authUnsubscribe = null
let authReadyPromise = null
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
  }
}

function normalizeRole(role) {
  if (role === 'sender') {
    return 'pinky'
  }

  if (role === 'receiver') {
    return 'japu'
  }

  return role === 'pinky' ? 'pinky' : 'japu'
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

function getFriendlyFirestoreMessage(error, fallbackMessage) {
  if (error?.code === 'permission-denied') {
    return 'Firebase permissions are blocking private live sync. Publish the updated Firestore rules for ForJapu.'
  }

  if (error?.code === 'unavailable') {
    return 'Live sync is temporarily unavailable. Check the internet connection and try again.'
  }

  return error?.message || fallbackMessage
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

function buildReminderHistory(reminders) {
  return reminders
    .map((reminder) => ({
      id: reminder.id,
      title: reminder.title,
      time: reminder.time,
      status: reminder.status === 'completed' ? 'Taken' : reminder.status === 'cancelled' ? 'Cancelled' : 'Pending',
      date: reminder.completedAt || reminder.updatedAt || reminder.createdAt || new Date().toISOString(),
    }))
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
}

function normalizeMessage(messageDoc) {
  const data = messageDoc.data()

  return {
    id: messageDoc.id,
    text: data.text || '',
    senderRole: data.senderRole || 'pinky',
    senderName: data.senderName || 'Pinky',
    createdAt: toIsoString(data.createdAt),
  }
}

function setWhiteboardState(patch) {
  setStoreValue('whiteboardData', {
    ...storeState.whiteboardData,
    ...patch,
  })
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

function startRealtimeSubscriptions() {
  if (!storeState.currentUser || messagesUnsubscribe || remindersUnsubscribe || whiteboardUnsubscribe) {
    return
  }

  const messagesRef = query(
    collection(db, 'sharedSpaces', REAL_SHARED_SPACE_ID, 'messages'),
    orderBy('createdAt', 'asc'),
  )

  messagesUnsubscribe = onSnapshot(
    messagesRef,
    (snapshot) => {
      setStoreValue('messages', snapshot.docs.map(normalizeMessage))
      updateSyncState('messages', null)
    },
    (error) => {
      updateSyncState('messages', getFriendlyFirestoreMessage(error, 'Messages could not sync right now.'))
    },
  )

  remindersUnsubscribe = subscribeToRealtimeReminders(
    (reminders) => {
      setStoreValue('reminders', reminders)
      setStoreValue('reminderHistory', buildReminderHistory(reminders))
      updateSyncState('reminders', null)
    },
    (error) => {
      updateSyncState('reminders', getFriendlyFirestoreMessage(error, 'Reminders could not sync right now.'))
    },
  )

  whiteboardUnsubscribe = subscribeToRealtimeWhiteboard({
    onMetadata(metadata) {
      setWhiteboardState(metadata)
      updateSyncState('whiteboard', null)
    },
    onObjects(objects) {
      setWhiteboardState({ objects })
      updateSyncState('whiteboard', null)
    },
    onError(error) {
      updateSyncState('whiteboard', getFriendlyFirestoreMessage(error, 'Whiteboard sync is currently unavailable.'))
    },
  })
}

function resetRealtimeState() {
  setStoreValue('reminders', [])
  setStoreValue('messages', [])
  setStoreValue('whiteboardData', defaultWhiteboardState)
  setStoreValue('reminderHistory', [])
  setStoreValue(
    'syncState',
    {
      messages: null,
      reminders: null,
      whiteboard: null,
    },
    false,
  )
}

function setCurrentUserInternal(user) {
  setStoreValue('currentUser', user)
}

function ensureAuthListener() {
  if (authUnsubscribe) {
    return authReadyPromise || Promise.resolve(storeState.currentUser)
  }

  authReadyPromise = new Promise((resolve) => {
    let isFirstEvent = true

    authUnsubscribe = subscribeToAuthSession(({ session, error }) => {
      if (session) {
        setCurrentUserInternal(session)
        startRealtimeSubscriptions()
      } else {
        stopRealtimeSubscriptions()
        setCurrentUserInternal(null)
        resetRealtimeState()

        if (error) {
          updateSyncState('messages', error)
        }
      }

      if (isFirstEvent) {
        isFirstEvent = false
        resolve(session)
      }
    })
  })

  return authReadyPromise
}

function loadStoredSettings() {
  const rawValue = getStore().getItem(storageKeys.appSettings)

  if (!rawValue) {
    return
  }

  try {
    const parsed = JSON.parse(rawValue)

    setStoreValue(
      'appSettings',
      {
        pinky: { ...defaultSettings, ...(parsed?.pinky || {}) },
        japu: { ...defaultSettings, ...(parsed?.japu || {}) },
      },
      false,
    )
  } catch {
    setStoreValue(
      'appSettings',
      {
        pinky: { ...defaultSettings },
        japu: { ...defaultSettings },
      },
      false,
    )
  }
}

function persistSettings(settings) {
  getStore().setItem(storageKeys.appSettings, JSON.stringify(settings))
}

export function initializeMockData() {
  loadStoredSettings()
}

export async function hydrateCurrentUser() {
  await ensureAuthListener()
  return storeState.currentUser
}

export function getCurrentUser() {
  return storeState.currentUser
}

export function getRoleHome(role) {
  return normalizeRole(role) === 'pinky' ? '/pinky' : '/japu'
}

export async function loginUser(credentials) {
  await ensureAuthListener()
  const session = await loginWithFixedUser(credentials)
  setCurrentUserInternal(session)
  startRealtimeSubscriptions()
  return session
}

export async function logoutUser() {
  stopRealtimeSubscriptions()
  resetRealtimeState()
  setCurrentUserInternal(null)
  await logoutAuthUser()
}

export async function updateUserProfile({ name, username, email, password, confirmPassword }) {
  const currentUser = getCurrentUser()

  if (!currentUser) {
    throw new Error('Please log in first.')
  }

  if (
    String(username || '').trim().toLowerCase() !== currentUser.username ||
    String(email || '').trim().toLowerCase() !== String(currentUser.email || '').trim().toLowerCase()
  ) {
    throw new Error('Username and email are fixed for this shared app.')
  }

  if (password || confirmPassword) {
    throw new Error('Password stays inside Firebase Auth and cannot be changed here.')
  }

  const nextDisplayName = await updateAuthorizedDisplayName(name)
  const updatedUser = {
    ...currentUser,
    name: nextDisplayName,
  }

  setCurrentUserInternal(updatedUser)
  return updatedUser
}

export function getReminders() {
  return storeState.reminders
}

export async function addReminder(reminder) {
  try {
    await createReminder(reminder, getCurrentUser())
  } catch (error) {
    const message = getFriendlyFirestoreMessage(error, 'Reminder save failed.')
    updateSyncState('reminders', message)
    throw new Error(message)
  }
}

export async function updateReminder(reminderId, patch) {
  try {
    await updateReminderRecord(reminderId, patch, getCurrentUser())
  } catch (error) {
    const message = getFriendlyFirestoreMessage(error, 'Reminder update failed.')
    updateSyncState('reminders', message)
    throw new Error(message)
  }
}

export async function deleteReminder(reminderId) {
  try {
    await deleteReminderRecord(reminderId, getCurrentUser())
  } catch (error) {
    const message = getFriendlyFirestoreMessage(error, 'Reminder delete failed.')
    updateSyncState('reminders', message)
    throw new Error(message)
  }
}

export async function markReminderStatus(reminder, status = 'Taken') {
  const shouldComplete = status === 'Taken' || status === 'completed'

  try {
    await updateReminderCompletion(reminder.id, shouldComplete, getCurrentUser())
  } catch (error) {
    const message = getFriendlyFirestoreMessage(error, 'Reminder check-in failed.')
    updateSyncState('reminders', message)
    throw new Error(message)
  }
}

export function getMessages() {
  return storeState.messages
}

export async function sendMessage({ text, senderRole, senderName }) {
  const currentUser = getCurrentUser()
  const trimmedText = String(text || '').trim()

  if (!currentUser) {
    throw new Error('Please log in first.')
  }

  if (!trimmedText) {
    return
  }

  try {
    await addDoc(collection(db, 'sharedSpaces', REAL_SHARED_SPACE_ID, 'messages'), {
      text: trimmedText,
      senderRole: senderRole || currentUser.role,
      senderName: senderName || currentUser.name,
      createdAt: serverTimestamp(),
      senderUid: currentUser.uid,
    })
  } catch (error) {
    const message = getFriendlyFirestoreMessage(error, 'Message send failed.')
    updateSyncState('messages', message)
    throw new Error(message)
  }
}

export function getWhiteboardData() {
  return storeState.whiteboardData
}

export async function createWhiteboardObject(object) {
  try {
    await createRealtimeWhiteboardObject(object, getCurrentUser())
  } catch (error) {
    const message = getFriendlyFirestoreMessage(error, 'Whiteboard save failed.')
    updateSyncState('whiteboard', message)
    throw new Error(message)
  }
}

export async function deleteWhiteboardObject(objectId, version) {
  try {
    await removeRealtimeWhiteboardObject(objectId, getCurrentUser(), version)
  } catch (error) {
    const message = getFriendlyFirestoreMessage(error, 'Whiteboard undo failed.')
    updateSyncState('whiteboard', message)
    throw new Error(message)
  }
}

export async function saveWhiteboardData() {
  try {
    await touchWhiteboard(getCurrentUser())
  } catch (error) {
    const message = getFriendlyFirestoreMessage(error, 'Whiteboard save failed.')
    updateSyncState('whiteboard', message)
    throw new Error(message)
  }
}

export async function sendWhiteboardData() {
  try {
    await sendWhiteboard(getCurrentUser())
  } catch (error) {
    const message = getFriendlyFirestoreMessage(error, 'Whiteboard send failed.')
    updateSyncState('whiteboard', message)
    throw new Error(message)
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
  persistSettings(nextSettings)
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

export { REAL_SHARED_SPACE_ID, storageKeys }
