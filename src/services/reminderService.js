import { addDoc, collection, db, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from '../firebase'
import { JAPU_UID, REAL_SHARED_SPACE_ID, REMINDER_TIMEZONE } from '../config/authorizedUsers'
import { formatReminderTime } from '../utils/app'

const KUALA_LUMPUR_OFFSET_MS = 8 * 60 * 60 * 1000

function remindersCollectionRef() {
  return collection(db, 'sharedSpaces', REAL_SHARED_SPACE_ID, 'reminders')
}

function reminderDocRef(reminderId) {
  return doc(db, 'sharedSpaces', REAL_SHARED_SPACE_ID, 'reminders', reminderId)
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

function formatReminderTimeForTimezone(value, timezone = REMINDER_TIMEZONE) {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  }).format(new Date(value))
}

function toTimeValueFromIso(isoString, timezone = REMINDER_TIMEZONE) {
  if (!isoString) {
    return ''
  }

  const formatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  })

  return formatter.format(new Date(isoString))
}

export function buildNextReminderDate(timeValue) {
  const normalizedTime = String(timeValue || '').trim()
  const [hoursText = '0', minutesText = '0'] = normalizedTime.split(':')
  const hours = Number(hoursText)
  const minutes = Number(minutesText)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return new Date()
  }

  const now = new Date()
  const klNow = new Date(now.getTime() + KUALA_LUMPUR_OFFSET_MS)
  let scheduledAt = new Date(
    Date.UTC(
      klNow.getUTCFullYear(),
      klNow.getUTCMonth(),
      klNow.getUTCDate(),
      hours - 8,
      minutes,
      0,
      0,
    ),
  )

  if (scheduledAt.getTime() <= now.getTime()) {
    scheduledAt = new Date(scheduledAt.getTime() + 24 * 60 * 60 * 1000)
  }

  return scheduledAt
}

export function normalizeReminder(reminderSnapshot) {
  const data = reminderSnapshot.data()
  const scheduledAt = toIsoString(data.scheduledAt)
  const timezone = data.timezone || REMINDER_TIMEZONE
  const timeValue = data.timeValue || toTimeValueFromIso(scheduledAt, timezone)
  const status = data.status || 'pending'

  return {
    id: reminderSnapshot.id,
    title: data.title || '',
    message: data.message || '',
    note: data.message || '',
    timeValue,
    time: formatReminderTimeForTimezone(scheduledAt, timezone) || formatReminderTime(timeValue),
    scheduledAt,
    timezone,
    active: status !== 'cancelled',
    status,
    priority: data.priority || 'medium',
    repeat: data.repeat || { enabled: true, frequency: 'daily', interval: 1, daysOfWeek: [] },
    assignedTo: data.assignedTo || JAPU_UID,
    createdBy: data.createdBy || '',
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
    takenAt: toIsoString(data.completedAt),
    completedAt: toIsoString(data.completedAt),
  }
}

export function subscribeToRealtimeReminders(onData, onError) {
  const remindersRef = query(remindersCollectionRef(), orderBy('scheduledAt', 'asc'))

  return onSnapshot(
    remindersRef,
    (snapshot) => {
      onData(snapshot.docs.map(normalizeReminder))
    },
    onError,
  )
}

export async function createReminder(reminder, actor) {
  if (actor?.role !== 'pinky') {
    throw new Error('Only Pinky can create private reminders.')
  }

  const title = String(reminder.title || '').trim()
  const message = String(reminder.note || reminder.message || '').trim()
  const timeValue = String(reminder.timeValue || '').trim()

  if (!title || !timeValue) {
    throw new Error('Please add both a reminder title and time.')
  }

  await addDoc(remindersCollectionRef(), {
    title,
    message,
    scheduledAt: buildNextReminderDate(timeValue),
    timeValue,
    timezone: REMINDER_TIMEZONE,
    status: reminder.active === false ? 'cancelled' : 'pending',
    priority: reminder.priority || 'medium',
    repeat: reminder.repeat || { enabled: true, frequency: 'daily', interval: 1, daysOfWeek: [] },
    createdBy: actor.uid,
    assignedTo: JAPU_UID,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: null,
  })
}

export async function updateReminderRecord(reminderId, patch, actor) {
  if (actor?.role !== 'pinky') {
    throw new Error('Only Pinky can edit reminder details.')
  }

  const payload = {
    updatedAt: serverTimestamp(),
  }

  if ('title' in patch) {
    payload.title = String(patch.title || '').trim()
  }

  if ('note' in patch || 'message' in patch) {
    payload.message = String(patch.note || patch.message || '').trim()
  }

  if ('timeValue' in patch) {
    payload.timeValue = String(patch.timeValue || '').trim()
    payload.scheduledAt = buildNextReminderDate(payload.timeValue)
    payload.timezone = REMINDER_TIMEZONE
  }

  if ('active' in patch) {
    payload.status = patch.active ? 'pending' : 'cancelled'

    if (!patch.active) {
      payload.completedAt = null
    }
  }

  if ('status' in patch) {
    payload.status = patch.status
  }

  await updateDoc(reminderDocRef(reminderId), payload)
}

export async function deleteReminderRecord(reminderId, actor) {
  if (actor?.role !== 'pinky') {
    throw new Error('Only Pinky can delete reminders.')
  }

  await deleteDoc(reminderDocRef(reminderId))
}

export async function updateReminderCompletion(reminderId, isCompleted, actor) {
  if (actor?.role !== 'japu') {
    throw new Error('Only Japu can update reminder completion.')
  }

  await updateDoc(reminderDocRef(reminderId), {
    status: isCompleted ? 'completed' : 'pending',
    completedAt: isCompleted ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  })
}
