import { NavLink, useNavigate } from 'react-router-dom'
import { receiverNavItems, senderNavItems } from '../utils/app'
import { logoutUser, useCurrentUser } from '../utils/storage'

export default function MenuDrawer({ isOpen, onClose, theme = 'receiver' }) {
  const navigate = useNavigate()
  const user = useCurrentUser()
  const isSender = theme === 'sender'
  const homePath = isSender ? '/pinky' : '/japu'
  const chatPath = isSender ? '/pinky/chat' : '/japu/chat'
  const profilePath = isSender ? '/pinky/profile' : '/japu/profile'
  const navigationItems = (isSender ? senderNavItems : receiverNavItems).filter(
    (item) => item.path !== homePath && item.path !== profilePath,
  )
  const drawerItems = [
    ...navigationItems,
    { label: 'Chat', path: chatPath, icon: '✉' },
    { label: 'Profile', path: profilePath, icon: '☺' },
  ]
  const avatarLabel = String(user?.name || 'ForJapu')
    .trim()
    .charAt(0)
    .toUpperCase()

  async function handleLogout() {
    await logoutUser()
    onClose()
    navigate('/login', { replace: true })
  }

  return (
    <div className={`menu-drawer ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
      <button className="menu-drawer-backdrop" onClick={onClose} aria-label="Close menu" />

      <div className="menu-drawer-shell">
        <aside className={`menu-drawer-panel menu-drawer-panel-${theme}`} role="dialog" aria-modal="true">
          <div className="menu-drawer-top">
            <div className="menu-drawer-head">
              <strong>Menu</strong>
              <button className="menu-close-button" onClick={onClose} aria-label="Close menu">
                ×
              </button>
            </div>

            <section className="menu-profile-card">
              <div className="menu-avatar">{avatarLabel || 'F'}</div>
              <div className="menu-profile-copy">
                <strong>{user?.name || 'ForJapu'}</strong>
                <span>{user?.email || 'Your cozy profile'}</span>
              </div>
            </section>

            <nav className="menu-drawer-nav">
              {drawerItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `menu-drawer-link ${isActive ? 'active' : ''}`}
                >
                  <span className="menu-drawer-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <button className="menu-logout-button" onClick={() => void handleLogout()}>
              Log out
            </button>
          </div>

          <p className="menu-version">ForJapu Version 1.0</p>
        </aside>
      </div>
    </div>
  )
}
