import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import { senderNavItems } from '../utils/app'
import { logoutUser, saveSettings, useSettings } from '../utils/storage'

export default function PinkySettings() {
  const navigate = useNavigate()
  const settings = useSettings()
  const [permissionState, setPermissionState] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  )

  function updateSettings(patch) {
    saveSettings(patch)
  }

  async function requestNotifications() {
    if (typeof Notification === 'undefined') {
      setPermissionState('unsupported')
      updateSettings({ notifications: false })
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
    <div className="page-shell theme-sender">
      <div className="phone-shell">
        <AppHeader
          title="Settings"
          subtitle="Adjust notifications, theme, and your account."
          theme="sender"
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
              <span>Vibration</span>
              <button
                className={`toggle-pill ${settings.vibration ? 'on' : ''}`}
                onClick={() => updateSettings({ vibration: !settings.vibration })}
              >
                <span />
              </button>
            </div>
            <div className="settings-row">
              <span>Theme</span>
              <strong>{settings.theme}</strong>
            </div>
            <div className="settings-row">
              <span>Notification permission</span>
              <strong>{permissionState}</strong>
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
            <button className="secondary-button full-width" onClick={requestNotifications}>
              Request notification permission
            </button>
            <p className="helper-text">
              Turn on notifications, then install the app to your home screen for the quickest reminder access.
            </p>
            <button className="ghost-button danger full-width" onClick={() => void handleLogout()}>
              Log out
            </button>
          </section>
        </main>

        <BottomNav items={senderNavItems} />
      </div>
    </div>
  )
}
