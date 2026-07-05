import { useEffect, useRef } from 'react'
import { showAppNotification } from '../utils/notifications'
import { toReminderTimeValue } from '../utils/app'
import { useCurrentUser, useReminders, useSettings, useWhiteboardData } from '../utils/storage'

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
  const reminderNoticeRef = useRef(new Set())
  const boardNoticeRef = useRef('')

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'japu' || !settings.notifications) {
      return
    }

    function checkReminderTimes() {
      const now = new Date()
      const todayKey = now.toISOString().slice(0, 10)
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      reminders
        .filter((reminder) => reminder.active)
        .forEach((reminder) => {
          const reminderTimeValue = toReminderTimeValue(reminder)

          if (!reminderTimeValue || reminderTimeValue !== currentTime) {
            return
          }

          const fingerprint = `${reminder.id}:${todayKey}:${reminderTimeValue}`

          if (reminderNoticeRef.current.has(fingerprint)) {
            return
          }

          reminderNoticeRef.current.add(fingerprint)

          void showAppNotification({
            title: `Reminder: ${reminder.title}`,
            body: `${reminder.time} is ready for you.`,
            tag: `reminder-${reminder.id}-${todayKey}`,
            url: '/japu/reminders',
          })
        })
    }

    checkReminderTimes()
    const intervalId = window.setInterval(checkReminderTimes, 30000)
    return () => window.clearInterval(intervalId)
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
