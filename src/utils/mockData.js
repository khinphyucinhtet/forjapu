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
  { id: 'rem-1', title: 'Medicine', time: '09:00 AM', active: true },
  { id: 'rem-2', title: 'Vitamin', time: '01:00 PM', active: true },
  { id: 'rem-3', title: 'Medicine', time: '08:00 PM', active: true },
  { id: 'rem-4', title: 'Good night', time: '11:00 PM', active: true },
]

export const defaultMessages = [
  {
    id: 'msg-1',
    from: 'pinky',
    to: 'japu',
    type: 'chat',
    text: "Don't forget to drink water!",
    createdAt: today,
  },
  {
    id: 'msg-2',
    from: 'japu',
    to: 'pinky',
    type: 'chat',
    text: 'Thank youu! 💗',
    createdAt: today,
  },
  {
    id: 'msg-3',
    from: 'japu',
    to: 'pinky',
    type: 'chat',
    text: "I'll take my medicine now!",
    createdAt: today,
  },
  {
    id: 'msg-4',
    from: 'pinky',
    to: 'japu',
    type: 'note',
    text: "You worked hard every day. I'm proud of you! Rest well tonight 🌙💜",
    createdAt: today,
  },
]

export const defaultWhiteboard = {
  drawing: '',
  updatedAt: today,
  lastSentAt: '',
  lastSentBy: '',
  lastSentByName: '',
  sendCount: 0,
}

export const defaultHistory = [
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
