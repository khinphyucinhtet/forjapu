import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('authorized user helpers', () => {
  it('maps the two fixed Firebase UIDs to Pinky and Japu roles', async () => {
    vi.stubEnv('VITE_PINKY_UID', 'pinky-uid')
    vi.stubEnv('VITE_JAPU_UID', 'japu-uid')
    vi.stubEnv('VITE_PINKY_LOGIN_EMAIL', 'pinky@example.com')
    vi.stubEnv('VITE_JAPU_LOGIN_EMAIL', 'japu@example.com')

    const config = await import('../config/authorizedUsers')

    expect(config.isRealUser('pinky-uid')).toBe(true)
    expect(config.isRealUser('japu-uid')).toBe(true)
    expect(config.isPinky('pinky-uid')).toBe(true)
    expect(config.isJapu('japu-uid')).toBe(true)
    expect(config.getUserRole('pinky-uid')).toBe('sender')
    expect(config.getUserRole('japu-uid')).toBe('receiver')
    expect(config.resolveLoginEmail('Pinky')).toBe('pinky@example.com')
    expect(config.resolveLoginEmail('Japu')).toBe('japu@example.com')
  })

  it('treats unknown users as demo users', async () => {
    vi.stubEnv('VITE_PINKY_UID', 'pinky-uid')
    vi.stubEnv('VITE_JAPU_UID', 'japu-uid')

    const config = await import('../config/authorizedUsers')

    expect(config.isDemoUser('someone-else')).toBe(true)
    expect(config.isRealUser('someone-else')).toBe(false)
  })
})
