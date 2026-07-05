import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import { receiverNavItems } from '../utils/app'
import { canRequestNotificationPermission, getNotificationSetupHint } from '../utils/notifications'
import { logoutUser, saveSettings, useSettings } from '../utils/storage'

export default function JapuSettings() {
  const navigate = useNavigate()
  const settings = useSettings()
  const [permissionState, setPermissionState] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  )
  const notificationHint = useMemo(() => getNotificationSetupHint(), [permissionState])

  function updateSettings(patch) {
    saveSettings(patch)
  }

  async function requestNotifications() {
    if (typeof Notification === 'undefined') {
      setPermissionState('unsupported')
      updateSettings({ notifications: false })
      return
    }

    if (!canRequestNotificationPermission()) {
      updateSettings({ notifications: false })
      setPermissionState(Notification.permission)
      return
    }

    const permission = await Notification.requestPermission()
    setPermissionState(permission)
    updateSettings({ notifications: permission === 'granted' })
  }

  async function handleLogout() {
    await logoutUser()
    navigate('/login', { replace: true })
  }

  return (
    <div className="page-shell theme-receiver">
      <div className="phone-shell">
        <AppHeader
          title="Settings"
          subtitle="Manage reminders, sounds, account, and notification access."
          theme="receiver"
        />

        <main className="page-content">
          <section className="settings-card">
            <div className="settings-row">
              <span>Allow notifications</span>
              <button
                className={`toggle-pill ${settings.notifications ? 'on' : ''}`}
                onClick={() =>
                  settings.notifications ? updateSettings({ notifications: false }) : void requestNotifications()
                }
              >
                <span />
              </button>
            </div>
            <div className="settings-row">
              <span>Reminder sound</span>
              <strong>{settings.reminderSound}</strong>
            </div>
            <div className="settings-row">
              <span>Vibration</span>
              <button
                className={`toggle-pill ${settings.vibration ? 'on' : ''}`}
                onClick={() => updateSettings({ vibration: !settings.vibration })}
              >
                <span />
              </button>
            </div>
            <div className="settings-row">
              <span>Background running</span>
              <button
                className={`toggle-pill ${settings.backgroundMode ? 'on' : ''}`}
                onClick={() => updateSettings({ backgroundMode: !settings.backgroundMode })}
              >
                <span />
              </button>
            </div>
            <div className="settings-row">
              <span>Reminder yes/no popup</span>
              <button
                className={`toggle-pill ${settings.reminderCheckIn ? 'on' : ''}`}
                onClick={() => updateSettings({ reminderCheckIn: !settings.reminderCheckIn })}
              >
                <span />
              </button>
            </div>
            <div className="settings-row">
              <span>Time zone</span>
              <strong>{settings.timezone}</strong>
            </div>
            <div className="settings-row">
              <span>Notification permission</span>
              <strong>{permissionState}</strong>
            </div>
            <button className="secondary-button full-width" onClick={requestNotifications}>
              {canRequestNotificationPermission() ? 'Enable notifications' : 'Add to Home Screen first'}
            </button>
            <p className="helper-text">{notificationHint}</p>
            <button className="ghost-button danger full-width" onClick={() => void handleLogout()}>
              Log out
            </button>
          </section>
        </main>

        <BottomNav items={receiverNavItems} />
      </div>
    </div>
  )
}
