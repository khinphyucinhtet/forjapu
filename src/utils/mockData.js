const today = new Date().toISOString()

export const defaultUsers = [
  {
    id: 'user-pinky',
    name: 'Pinky',
    username: 'pinky',
    email: 'pinky@forjapu.app',
    password: 'pinky123',
    role: 'pinky',
  },
  {
    id: 'user-japu',
    name: 'Japu',
    username: 'japu',
    email: 'japu@forjapu.app',
    password: 'japu123',
    role: 'japu',
  },
]

export const defaultReminders = [
]

export const legacySampleReminders = [
  { id: 'rem-1', title: 'Medicine', time: '09:00 AM', timeValue: '09:00', active: true },
  { id: 'rem-2', title: 'Vitamin', time: '01:00 PM', timeValue: '13:00', active: true },
  { id: 'rem-3', title: 'Medicine', time: '08:00 PM', timeValue: '20:00', active: true },
  { id: 'rem-4', title: 'Good night', time: '11:00 PM', timeValue: '23:00', active: true },
]

export const defaultMessages = []

export const defaultWhiteboard = {
  drawing: '',
  updatedAt: today,
  lastSentAt: '',
  lastSentBy: '',
  lastSentByName: '',
  sendCount: 0,
}

export const defaultHistory = []

export const legacySampleHistory = [
  { id: 'hist-1', title: 'Medicine', time: '09:00 AM', status: 'Taken', date: today },
  { id: 'hist-2', title: 'Vitamin', time: '01:00 PM', status: 'Taken', date: today },
  { id: 'hist-3', title: 'Medicine', time: '08:00 PM', status: 'Pending', date: today },
  { id: 'hist-4', title: 'Good night', time: '11:00 PM', status: 'Pending', date: today },
]

export const defaultSettings = {
  notifications: true,
  vibration: true,
  reminderSound: 'Cute chime',
  theme: 'Role based',
  timezone: 'GMT+8',
  backgroundMode: true,
  reminderCheckIn: true,
}
