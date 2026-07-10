import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let testEnv

async function loadRules() {
  const rulesPath = path.resolve(__dirname, '../../firestore.rules')
  const rawRules = await fs.readFile(rulesPath, 'utf8')

  return rawRules
    .replaceAll('REPLACE_WITH_PINKY_FIREBASE_UID', 'pinky-test-uid')
    .replaceAll('REPLACE_WITH_JAPU_FIREBASE_UID', 'japu-test-uid')
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'forjapu-rules-test',
    firestore: {
      rules: await loadRules(),
      host: '127.0.0.1',
      port: 8080,
    },
  })

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()

    await setDoc(doc(db, 'sharedSpaces', 'pinky-japu', 'reminders', 'base-reminder'), {
      title: 'Drink water',
      message: 'Please drink water',
      scheduledAt: new Date('2026-07-10T01:00:00.000Z'),
      timeValue: '09:00',
      timezone: 'Asia/Kuala_Lumpur',
      status: 'pending',
      priority: 'medium',
      repeat: {
        enabled: true,
        frequency: 'daily',
        interval: 1,
        daysOfWeek: [],
      },
      createdBy: 'pinky-test-uid',
      assignedTo: 'japu-test-uid',
      createdAt: new Date('2026-07-10T00:30:00.000Z'),
      updatedAt: new Date('2026-07-10T00:30:00.000Z'),
      completedAt: null,
    })

    await setDoc(doc(db, 'sharedSpaces', 'pinky-japu', 'whiteboards', 'main'), {
      boardId: 'main',
      updatedAt: new Date('2026-07-10T00:45:00.000Z'),
      updatedBy: 'pinky-test-uid',
      updatedByName: 'Pinky',
      updatedByRole: 'sender',
      updatedByDashboardRole: 'pinky',
      version: 1,
    })

    await setDoc(doc(db, 'sharedSpaces', 'pinky-japu', 'whiteboards', 'main', 'objects', 'seed-object'), {
      id: 'seed-object',
      type: 'path',
      data: { points: [{ x: 10, y: 10 }, { x: 20, y: 20 }], color: '#241B3A', size: 6, mode: 'draw' },
      createdBy: 'pinky-test-uid',
      createdByName: 'Pinky',
      createdByRole: 'sender',
      createdByDashboardRole: 'pinky',
      createdAt: new Date('2026-07-10T00:45:00.000Z'),
      updatedAt: new Date('2026-07-10T00:45:00.000Z'),
      clientCreatedAtMs: 1,
      isDeleted: false,
      version: 1,
    })
  })
})

afterAll(async () => {
  await testEnv?.cleanup()
})

describe('firestore security rules', () => {
  it('allows Pinky and Japu to read the shared space', async () => {
    const pinkyDb = testEnv.authenticatedContext('pinky-test-uid').firestore()
    const japuDb = testEnv.authenticatedContext('japu-test-uid').firestore()

    await assertSucceeds(getDoc(doc(pinkyDb, 'sharedSpaces', 'pinky-japu', 'reminders', 'base-reminder')))
    await assertSucceeds(getDoc(doc(japuDb, 'sharedSpaces', 'pinky-japu', 'reminders', 'base-reminder')))
  })

  it('denies demo users and signed-out users from private data', async () => {
    const demoDb = testEnv.authenticatedContext('demo-user').firestore()
    const guestDb = testEnv.unauthenticatedContext().firestore()

    await assertFails(getDoc(doc(demoDb, 'sharedSpaces', 'pinky-japu', 'reminders', 'base-reminder')))
    await assertFails(getDoc(doc(guestDb, 'sharedSpaces', 'pinky-japu', 'reminders', 'base-reminder')))
  })

  it('allows Pinky to create reminders and blocks Japu from pretending to be Pinky', async () => {
    const pinkyDb = testEnv.authenticatedContext('pinky-test-uid').firestore()
    const japuDb = testEnv.authenticatedContext('japu-test-uid').firestore()

    await assertSucceeds(
      setDoc(doc(pinkyDb, 'sharedSpaces', 'pinky-japu', 'reminders', 'new-reminder'), {
        title: 'Vitamin C',
        message: 'Morning dose',
        scheduledAt: new Date('2026-07-11T01:00:00.000Z'),
        timeValue: '09:00',
        timezone: 'Asia/Kuala_Lumpur',
        status: 'pending',
        priority: 'medium',
        repeat: {
          enabled: true,
          frequency: 'daily',
          interval: 1,
          daysOfWeek: [],
        },
        createdBy: 'pinky-test-uid',
        assignedTo: 'japu-test-uid',
        createdAt: new Date('2026-07-10T01:00:00.000Z'),
        updatedAt: new Date('2026-07-10T01:00:00.000Z'),
        completedAt: null,
      }),
    )

    await assertFails(
      setDoc(doc(japuDb, 'sharedSpaces', 'pinky-japu', 'reminders', 'fake-reminder'), {
        title: 'Fake',
        message: 'Nope',
        scheduledAt: new Date('2026-07-11T01:00:00.000Z'),
        timeValue: '09:00',
        timezone: 'Asia/Kuala_Lumpur',
        status: 'pending',
        priority: 'medium',
        repeat: {
          enabled: true,
          frequency: 'daily',
          interval: 1,
          daysOfWeek: [],
        },
        createdBy: 'pinky-test-uid',
        assignedTo: 'japu-test-uid',
        createdAt: new Date('2026-07-10T01:00:00.000Z'),
        updatedAt: new Date('2026-07-10T01:00:00.000Z'),
        completedAt: null,
      }),
    )
  })

  it('allows Japu to complete his reminder but not change ownership', async () => {
    const japuDb = testEnv.authenticatedContext('japu-test-uid').firestore()

    await assertSucceeds(
      updateDoc(doc(japuDb, 'sharedSpaces', 'pinky-japu', 'reminders', 'base-reminder'), {
        status: 'completed',
        completedAt: new Date('2026-07-10T02:00:00.000Z'),
        updatedAt: new Date('2026-07-10T02:00:00.000Z'),
      }),
    )

    await assertFails(
      updateDoc(doc(japuDb, 'sharedSpaces', 'pinky-japu', 'reminders', 'base-reminder'), {
        assignedTo: 'someone-else',
        updatedAt: new Date('2026-07-10T02:00:00.000Z'),
      }),
    )
  })

  it('denies demo users from whiteboard objects', async () => {
    const demoDb = testEnv.authenticatedContext('demo-user').firestore()

    await assertFails(getDoc(doc(demoDb, 'sharedSpaces', 'pinky-japu', 'whiteboards', 'main', 'objects', 'seed-object')))
  })

  it('keeps reminders readable after the successful completion update', async () => {
    const pinkyDb = testEnv.authenticatedContext('pinky-test-uid').firestore()
    const reminderDoc = await assertSucceeds(
      getDoc(doc(pinkyDb, 'sharedSpaces', 'pinky-japu', 'reminders', 'base-reminder')),
    )

    expect(reminderDoc.exists()).toBe(true)
  })
})
