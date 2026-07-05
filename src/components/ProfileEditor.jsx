import { useEffect, useState } from 'react'
import AppHeader from './AppHeader'
import BottomNav from './BottomNav'
import { updateUserProfile, useCurrentUser } from '../utils/storage'

export default function ProfileEditor({
  theme = 'sender',
  navItems = [],
  title = 'Profile',
  subtitle = 'Update your name, email, and password.',
}) {
  const user = useCurrentUser()
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setForm({
      name: user?.name || '',
      username: user?.username || '',
      email: user?.email || '',
      password: '',
      confirmPassword: '',
    })
  }, [user?.email, user?.name, user?.username])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleCancel() {
    setError('')
    setStatus('')
    setForm({
      name: user?.name || '',
      username: user?.username || '',
      email: user?.email || '',
      password: '',
      confirmPassword: '',
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setStatus('')
    setIsSubmitting(true)

    try {
      await updateUserProfile(form)
      setStatus('Profile saved. Your updated name is now used on the home page.')
      setForm((current) => ({ ...current, password: '', confirmPassword: '' }))
    } catch (profileError) {
      setError(profileError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`page-shell ${theme === 'sender' ? 'theme-sender' : 'theme-receiver'}`}>
      <div className="phone-shell">
        <AppHeader title={title} subtitle={subtitle} theme={theme} />

        <main className="page-content">
          <section className="settings-card">
            <form className="panel-form" onSubmit={handleSubmit}>
              <label className="panel-field">
                <span>Full name</span>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" />
              </label>

              <label className="panel-field">
                <span>Username</span>
                <input name="username" value={form.username} onChange={handleChange} autoCapitalize="none" />
              </label>

              <label className="panel-field">
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  autoCapitalize="none"
                  inputMode="email"
                />
              </label>

              <label className="panel-field">
                <span>New password</span>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current password"
                />
              </label>

              <label className="panel-field">
                <span>Confirm password</span>
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Type again"
                />
              </label>

              <p className="helper-text">
                If Firebase asks for a fresh login before changing email or password, log out and log in once, then save again.
              </p>

              {error ? <p className="form-error">{error}</p> : null}
              {status ? <p className="form-info">{status}</p> : null}

              <div className="panel-actions">
                <button className="primary-button" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
                <button className="secondary-button" type="button" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </main>

        <BottomNav items={navItems} />
      </div>
    </div>
  )
}
