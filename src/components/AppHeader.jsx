import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import MenuDrawer from './MenuDrawer'
import { useSyncState } from '../utils/storage'

export default function AppHeader({ badge, title, subtitle, action, theme = 'receiver' }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const syncState = useSyncState()
  const syncMessage = syncState.messages || syncState.reminders || syncState.whiteboard

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isMenuOpen])

  return (
    <>
      <header className={`app-header app-header-${theme}`}>
        <div className="header-copy">
          {badge ? <span className="header-badge">{badge}</span> : null}
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
          {syncMessage ? <div className="sync-banner">{syncMessage}</div> : null}
        </div>

        <div className="header-controls">
          {action ? <div className="header-action">{action}</div> : null}
          <button
            className="menu-toggle-button"
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <MenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} theme={theme} />
    </>
  )
}
