import { useEffect, useRef } from 'react'
import { showAppNotification } from '../utils/notifications'
import { useCurrentUser, useReminders, useSettings, useWhiteboardData } from '../utils/storage'

function makeReminderFingerprint(reminder) {
  if (!reminder?.active) {
    return ''
  }

  return `${reminder.id}:${reminder.time}:${reminder.title}:${reminder.active}`
}

function makeBoardFingerprint(whiteboardData) {
  if (!whiteboardData?.lastSentAt) {
    return ''
  }

  return `${whiteboardData.lastSentAt}:${whiteboardData.lastSentBy}:${whiteboardData.sendCount || 0}`
}

export default function AppNotificationBridge() {
  const currentUser = useCurrentUser()
  const reminders = useReminders()
  const settings = useSettings()
  const whiteboardData = useWhiteboardData()
  const reminderNoticeRef = useRef('')
  const boardNoticeRef = useRef('')

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'japu' || !settings.notifications) {
      return
    }

    const activeReminder = reminders.find((reminder) => reminder.active)
    const fingerprint = makeReminderFingerprint(activeReminder)

    if (!fingerprint || reminderNoticeRef.current === fingerprint) {
      return
    }

    reminderNoticeRef.current = fingerprint

    void showAppNotification({
      title: `Reminder: ${activeReminder.title}`,
      body: `${activeReminder.time} is ready for you.`,
      tag: `reminder-${activeReminder.id}`,
      url: '/japu/reminders',
    })
  }, [currentUser, reminders, settings.notifications])

  useEffect(() => {
    if (!currentUser || !settings.notifications) {
      return
    }

    const fingerprint = makeBoardFingerprint(whiteboardData)

    if (!fingerprint || boardNoticeRef.current === fingerprint) {
      return
    }

    boardNoticeRef.current = fingerprint

    if (whiteboardData.lastSentBy === currentUser.role) {
      return
    }

    const senderName = whiteboardData.lastSentByName || 'Your partner'

    void showAppNotification({
      title: `${senderName} sent a whiteboard surprise`,
      body: 'Open the board to see the new drawing and stickers.',
      tag: `board-${whiteboardData.lastSentAt}`,
      url: currentUser.role === 'japu' ? '/japu/board' : '/pinky/board',
    })
  }, [currentUser, settings.notifications, whiteboardData])

  return null
}
