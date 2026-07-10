import {
  collection,
  db,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from '../firebase'
import { REAL_SHARED_SPACE_ID } from '../config/authorizedUsers'

function boardMetadataRef() {
  return doc(db, 'sharedSpaces', REAL_SHARED_SPACE_ID, 'whiteboards', 'main')
}

function boardObjectsCollectionRef() {
  return collection(db, 'sharedSpaces', REAL_SHARED_SPACE_ID, 'whiteboards', 'main', 'objects')
}

function boardObjectRef(objectId) {
  return doc(db, 'sharedSpaces', REAL_SHARED_SPACE_ID, 'whiteboards', 'main', 'objects', objectId)
}

function toIsoString(value) {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  if (value?.toDate) {
    return value.toDate().toISOString()
  }

  return ''
}

export function normalizeWhiteboardMetadata(data = {}) {
  return {
    boardId: data.boardId || 'main',
    updatedAt: toIsoString(data.updatedAt),
    updatedBy: data.updatedBy || '',
    updatedByName: data.updatedByName || '',
    updatedByRole: data.updatedByRole || '',
    updatedByDashboardRole: data.updatedByDashboardRole || '',
    lastSentAt: toIsoString(data.lastSentAt),
    lastSentBy: data.lastSentBy || '',
    lastSentByName: data.lastSentByName || '',
    sendCount: Number(data.sendCount || 0),
    version: Number(data.version || 0),
  }
}

export function normalizeWhiteboardObject(objectSnapshot) {
  const data = objectSnapshot.data()

  return {
    id: objectSnapshot.id,
    type: data.type || 'path',
    data: data.data || {},
    createdBy: data.createdBy || '',
    createdByName: data.createdByName || '',
    createdByRole: data.createdByRole || '',
    createdByDashboardRole: data.createdByDashboardRole || '',
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
    clientCreatedAtMs: Number(data.clientCreatedAtMs || 0),
    isDeleted: Boolean(data.isDeleted),
    version: Number(data.version || 1),
  }
}

export function subscribeToRealtimeWhiteboard({ onMetadata, onObjects, onError }) {
  const unsubscribeMetadata = onSnapshot(
    boardMetadataRef(),
    (snapshot) => {
      onMetadata(normalizeWhiteboardMetadata(snapshot.data() || {}))
    },
    onError,
  )

  const unsubscribeObjects = onSnapshot(
    query(boardObjectsCollectionRef(), orderBy('clientCreatedAtMs', 'asc')),
    (snapshot) => {
      onObjects(snapshot.docs.map(normalizeWhiteboardObject))
    },
    onError,
  )

  return () => {
    unsubscribeMetadata()
    unsubscribeObjects()
  }
}

function buildBoardMetadataPatch(actor) {
  return {
    boardId: 'main',
    updatedAt: serverTimestamp(),
    updatedBy: actor.uid,
    updatedByName: actor.name,
    updatedByRole: actor.relationshipRole,
    updatedByDashboardRole: actor.role,
    version: increment(1),
  }
}

export async function createWhiteboardObject(object, actor) {
  const batch = writeBatch(db)
  const objectRef = boardObjectRef(object.id)

  batch.set(objectRef, {
    id: object.id,
    type: object.type,
    data: object.data,
    createdBy: actor.uid,
    createdByName: actor.name,
    createdByRole: actor.relationshipRole,
    createdByDashboardRole: actor.role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    clientCreatedAtMs: Number(object.clientCreatedAtMs || Date.now()),
    isDeleted: false,
    version: 1,
  })

  batch.set(boardMetadataRef(), buildBoardMetadataPatch(actor), { merge: true })
  await batch.commit()
}

export async function softDeleteWhiteboardObject(objectId, actor, version = 1) {
  const batch = writeBatch(db)

  batch.set(
    boardObjectRef(objectId),
    {
      isDeleted: true,
      updatedAt: serverTimestamp(),
      version: Number(version || 1) + 1,
    },
    { merge: true },
  )

  batch.set(boardMetadataRef(), buildBoardMetadataPatch(actor), { merge: true })
  await batch.commit()
}

export async function touchWhiteboard(actor) {
  await setDoc(boardMetadataRef(), buildBoardMetadataPatch(actor), { merge: true })
}

export async function sendWhiteboard(actor) {
  await setDoc(boardMetadataRef(), {
    ...buildBoardMetadataPatch(actor),
    lastSentAt: serverTimestamp(),
    lastSentBy: actor.role,
    lastSentByName: actor.name,
    sendCount: increment(1),
  }, { merge: true })
}
