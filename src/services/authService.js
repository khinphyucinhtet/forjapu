import {
  auth,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from '../firebase'
import {
  buildAuthorizedSession,
  hasAuthorizedUserConfig,
  listMissingAuthorizedUserEnv,
  resolveLoginEmail,
} from '../config/authorizedUsers'

let persistencePromise = null

function getFriendlyAuthMessage(error) {
  if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password') {
    return 'That username or password does not match the approved Firebase account.'
  }

  if (error?.code === 'auth/user-not-found') {
    return 'That Firebase user was not found.'
  }

  if (error?.code === 'auth/too-many-requests') {
    return 'Too many sign-in attempts. Please wait a little and try again.'
  }

  if (error?.code === 'auth/network-request-failed') {
    return 'The internet connection dropped while signing in.'
  }

  return error?.message || 'Authentication failed.'
}

async function ensurePersistence() {
  if (!persistencePromise) {
    persistencePromise = setPersistence(auth, browserLocalPersistence).catch(() => undefined)
  }

  return persistencePromise
}

export function subscribeToAuthSession(listener) {
  return onAuthStateChanged(
    auth,
    async (firebaseUser) => {
      if (!firebaseUser) {
        listener({ session: null, error: '' })
        return
      }

      const session = buildAuthorizedSession(firebaseUser)

      if (!session) {
        await signOut(auth).catch(() => undefined)
        listener({
          session: null,
          error: 'This Firebase account is not one of the two approved users for ForJapu.',
        })
        return
      }

      listener({ session, error: '' })
    },
    (error) => {
      listener({ session: null, error: getFriendlyAuthMessage(error) })
    },
  )
}

export async function loginWithFixedUser({ username, password }) {
  if (!hasAuthorizedUserConfig()) {
    throw new Error(
      `Add ${listMissingAuthorizedUserEnv().join(', ')} to your local env file before signing in.`,
    )
  }

  const resolvedEmail = resolveLoginEmail(username)

  if (!resolvedEmail) {
    throw new Error(
      'Username login needs VITE_PINKY_LOGIN_EMAIL and VITE_JAPU_LOGIN_EMAIL. You can also type the real Firebase email directly.',
    )
  }

  if (!String(password || '').trim()) {
    throw new Error('Please enter the Firebase password for this approved account.')
  }

  await ensurePersistence()

  try {
    const credential = await signInWithEmailAndPassword(auth, resolvedEmail, String(password))
    const session = buildAuthorizedSession(credential.user)

    if (!session) {
      await signOut(auth).catch(() => undefined)
      throw new Error('This Firebase account is not one of the two approved users for ForJapu.')
    }

    return session
  } catch (error) {
    throw new Error(getFriendlyAuthMessage(error))
  }
}

export async function logoutAuthUser() {
  await signOut(auth)
}

export async function updateAuthorizedDisplayName(displayName) {
  if (!auth.currentUser) {
    throw new Error('Please log in first.')
  }

  const nextDisplayName = String(displayName || '').trim()

  if (!nextDisplayName) {
    throw new Error('Please enter your full name.')
  }

  await updateProfile(auth.currentUser, { displayName: nextDisplayName })
  return nextDisplayName
}
