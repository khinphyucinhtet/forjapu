import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isFirebaseConfigured } from '../utils/firebase'
import { getRoleHome, registerUser, useCurrentUser } from '../utils/storage'

export default function Register() {
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'japu',
  })
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

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      const user = await registerUser(form)
      navigate(getRoleHome(user.role), { replace: true })
    } catch (registerError) {
      setError(registerError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="sky-orb orb-one" />
      <div className="sky-orb orb-two" />

      <section className="auth-card register-card">
        <div className="auth-brand">
          <div className="mini-heart-card">♥</div>
          <h1>ForJapu</h1>
          <p>Create your cozy space.</p>
        </div>

        {!isFirebaseConfigured() ? (
          <p className="form-info">
            Firebase is not connected yet. Add your `VITE_FIREBASE_*` values in `.env.local` to
            save new accounts into Firebase instead of demo mode.
          </p>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
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
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="email"
              inputMode="email"
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
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>

          <label>
            Confirm Password
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>

          <label>
            Role
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="pinky">Pinky (Sender)</option>
              <option value="japu">Japu (Receiver)</option>
            </select>
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="auth-inline-note">
          Already registered?{' '}
          <Link className="auth-muted-link" to="/login">
            Log in here
          </Link>
        </p>
      </section>
    </div>
  )
}
