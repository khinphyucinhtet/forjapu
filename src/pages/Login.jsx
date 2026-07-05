import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRoleHome, loginUser, useCurrentUser } from '../utils/storage'

export default function Login() {
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (currentUser) {
      navigate(getRoleHome(currentUser.role), { replace: true })
    }
  }, [currentUser, navigate])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const user = await loginUser(form)
      navigate(getRoleHome(user.role), { replace: true })
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="sky-orb orb-one" />
      <div className="sky-orb orb-two" />

      <section className="auth-card login-card">
        <div className="auth-brand">
          <div className="mini-heart-card">♥</div>
          <h1>ForJapu</h1>
          <p>A little reminder, every day.</p>
          <span className="auth-helper-copy">Only Pinky and Japu can access this space.</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username or Email
            <input
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              required
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="auth-inline-note">Demo hint: Pinky / 12345 or Japu / 12345</p>
      </section>
    </div>
  )
}
