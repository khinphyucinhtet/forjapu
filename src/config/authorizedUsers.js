export const REAL_SHARED_SPACE_ID = 'pinky-japu'
export const REMINDER_TIMEZONE = 'Asia/Kuala_Lumpur'

export const PINKY_UID = String(import.meta.env.VITE_PINKY_UID || '').trim()
export const JAPU_UID = String(import.meta.env.VITE_JAPU_UID || '').trim()

const PINKY_LOGIN_EMAIL = String(import.meta.env.VITE_PINKY_LOGIN_EMAIL || '')
  .trim()
  .toLowerCase()
const JAPU_LOGIN_EMAIL = String(import.meta.env.VITE_JAPU_LOGIN_EMAIL || '')
  .trim()
  .toLowerCase()

export const authorizedUsers = [
  {
    uid: PINKY_UID,
    name: 'Pinky',
    username: 'pinky',
    role: 'sender',
    dashboardRole: 'pinky',
    loginEmail: PINKY_LOGIN_EMAIL,
  },
  {
    uid: JAPU_UID,
    name: 'Japu',
    username: 'japu',
    role: 'receiver',
    dashboardRole: 'japu',
    loginEmail: JAPU_LOGIN_EMAIL,
  },
]

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

export function hasAuthorizedUserConfig() {
  return Boolean(PINKY_UID && JAPU_UID)
}

export function listMissingAuthorizedUserEnv() {
  const missing = []

  if (!PINKY_UID) {
    missing.push('VITE_PINKY_UID')
  }

  if (!JAPU_UID) {
    missing.push('VITE_JAPU_UID')
  }

  return missing
}

export function getAuthorizedUserByUid(uid) {
  return authorizedUsers.find((user) => user.uid && user.uid === uid) || null
}

export function getAuthorizedUserByIdentifier(identifier) {
  const normalizedIdentifier = normalizeText(identifier)

  return (
    authorizedUsers.find(
      (user) =>
        user.username === normalizedIdentifier ||
        normalizeText(user.loginEmail) === normalizedIdentifier,
    ) || null
  )
}

export function resolveLoginEmail(identifier) {
  const normalizedIdentifier = normalizeText(identifier)
  const fixedUser = getAuthorizedUserByIdentifier(normalizedIdentifier)

  if (fixedUser?.loginEmail) {
    return fixedUser.loginEmail
  }

  if (normalizedIdentifier.includes('@')) {
    return normalizedIdentifier
  }

  return ''
}

export function isRealUser(uid) {
  return Boolean(getAuthorizedUserByUid(uid))
}

export function isPinky(uid) {
  return uid === PINKY_UID
}

export function isJapu(uid) {
  return uid === JAPU_UID
}

export function getUserRole(uid) {
  return getAuthorizedUserByUid(uid)?.role || null
}

export function getDashboardRole(uid) {
  return getAuthorizedUserByUid(uid)?.dashboardRole || 'demo'
}

export function isDemoUser(uid) {
  return Boolean(uid) && !isRealUser(uid)
}

export function buildAuthorizedSession(firebaseUser) {
  const fixedUser = getAuthorizedUserByUid(firebaseUser?.uid)

  if (!firebaseUser || !fixedUser) {
    return null
  }

  return {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || fixedUser.name,
    username: fixedUser.username,
    email: firebaseUser.email || fixedUser.loginEmail || '',
    role: fixedUser.dashboardRole,
    relationshipRole: fixedUser.role,
    isAuthorized: true,
  }
}
