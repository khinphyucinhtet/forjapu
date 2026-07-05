import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRoleHome, useCurrentUser } from '../utils/storage'

export default function SplashScreen() {
  const navigate = useNavigate()
  const currentUser = useCurrentUser()

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      navigate(currentUser ? getRoleHome(currentUser.role) : '/login', { replace: true })
    }, 4000)

    return () => window.clearTimeout(timeoutId)
  }, [currentUser, navigate])

  return (
    <div className="auth-shell splash-shell">
      <div className="sky-orb orb-one" />
      <div className="sky-orb orb-two" />
      <div className="phone-preview-card splash-card">
        <div className="splash-copy">
          <h1 className="splash-wordmark">ForJapu</h1>
          <div className="splash-love-note">
            <h2>For Japu</h2>
            <p>Japu yay d nae lal sayy tout pr</p>
            <p>S pyinn m htuu nah</p>
            <p>lain mr ml nor</p>
          </div>
        </div>
        <div className="cloud-row">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}
