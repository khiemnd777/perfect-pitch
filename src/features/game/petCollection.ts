import type { PetId } from '../../shared/gameTypes'
import { loadDinoProgress } from './dinoProgress'

export const PET_COLLECTION_STORAGE_KEY = 'perfect-pitch-pet-collection'

export interface PetCatalogItem {
  id: PetId
  price: number
  emoji: string
  accent: string
  accentSoft: string
}

export const PET_CATALOG: readonly PetCatalogItem[] = [
  {
    id: 'dino',
    price: 0,
    emoji: '🦕',
    accent: '#55b98d',
    accentSoft: '#dff6e9',
  },
  {
    id: 'cat',
    price: 100,
    emoji: '🐱',
    accent: '#ee9f5b',
    accentSoft: '#fff0dc',
  },
  {
    id: 'bunny',
    price: 200,
    emoji: '🐰',
    accent: '#a786e8',
    accentSoft: '#eee6ff',
  },
  {
    id: 'fox',
    price: 350,
    emoji: '🦊',
    accent: '#e9785a',
    accentSoft: '#ffe4dc',
  },
]

export const PET_IDS = PET_CATALOG.map((pet) => pet.id) as readonly PetId[]

export type PetPoints = Record<PetId, number>

export interface PetCollectionState {
  wallet: number
  selectedPetId: PetId
  ownedPetIds: PetId[]
  petPoints: PetPoints
}

function sanitizePoints(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0
}

function isPetId(value: unknown): value is PetId {
  return typeof value === 'string' && PET_IDS.includes(value as PetId)
}

export function createDefaultPetCollection(
  legacyDinoPoints = 0,
): PetCollectionState {
  const points = sanitizePoints(legacyDinoPoints)

  return {
    wallet: points,
    selectedPetId: 'dino',
    ownedPetIds: ['dino'],
    petPoints: {
      dino: points,
      cat: 0,
      bunny: 0,
      fox: 0,
    },
  }
}

function sanitizeCollection(
  value: unknown,
  legacyDinoPoints: number,
): PetCollectionState {
  const fallback = createDefaultPetCollection(legacyDinoPoints)
  if (!value || typeof value !== 'object') {
    return fallback
  }

  const candidate = value as Partial<PetCollectionState>
  const ownedPetIds = Array.from(
    new Set([
      'dino' as PetId,
      ...((Array.isArray(candidate.ownedPetIds)
        ? candidate.ownedPetIds.filter(isPetId)
        : []) as PetId[]),
    ]),
  )
  const selectedPetId =
    isPetId(candidate.selectedPetId) && ownedPetIds.includes(candidate.selectedPetId)
      ? candidate.selectedPetId
      : 'dino'
  const storedPoints =
    candidate.petPoints && typeof candidate.petPoints === 'object'
      ? candidate.petPoints
      : {}

  return {
    wallet: sanitizePoints(candidate.wallet),
    selectedPetId,
    ownedPetIds,
    petPoints: {
      dino: sanitizePoints((storedPoints as Partial<PetPoints>).dino),
      cat: sanitizePoints((storedPoints as Partial<PetPoints>).cat),
      bunny: sanitizePoints((storedPoints as Partial<PetPoints>).bunny),
      fox: sanitizePoints((storedPoints as Partial<PetPoints>).fox),
    },
  }
}

export function loadPetCollection(storage?: Storage | null): PetCollectionState {
  const legacyDinoPoints = loadDinoProgress(storage).points
  if (!storage) {
    return createDefaultPetCollection(legacyDinoPoints)
  }

  try {
    const raw = storage.getItem(PET_COLLECTION_STORAGE_KEY)
    return raw
      ? sanitizeCollection(JSON.parse(raw), legacyDinoPoints)
      : createDefaultPetCollection(legacyDinoPoints)
  } catch {
    return createDefaultPetCollection(legacyDinoPoints)
  }
}

export function savePetCollection(
  collection: PetCollectionState,
  storage?: Storage | null,
) {
  if (!storage) {
    return
  }

  try {
    storage.setItem(
      PET_COLLECTION_STORAGE_KEY,
      JSON.stringify(sanitizeCollection(collection, 0)),
    )
  } catch {
    // Keep the in-memory collection alive when storage is unavailable.
  }
}

export function getPetCatalogItem(petId: PetId) {
  return PET_CATALOG.find((pet) => pet.id === petId) ?? PET_CATALOG[0]
}

export function rewardSelectedPet(
  collection: PetCollectionState,
  amount: number,
): PetCollectionState {
  const reward = sanitizePoints(amount)
  if (reward === 0) {
    return collection
  }

  return {
    ...collection,
    wallet: collection.wallet + reward,
    petPoints: {
      ...collection.petPoints,
      [collection.selectedPetId]:
        collection.petPoints[collection.selectedPetId] + reward,
    },
  }
}

export function purchasePet(
  collection: PetCollectionState,
  petId: PetId,
): PetCollectionState {
  const pet = getPetCatalogItem(petId)
  if (
    collection.ownedPetIds.includes(petId) ||
    collection.wallet < pet.price
  ) {
    return collection
  }

  return {
    ...collection,
    wallet: collection.wallet - pet.price,
    selectedPetId: petId,
    ownedPetIds: [...collection.ownedPetIds, petId],
  }
}

export function selectPet(
  collection: PetCollectionState,
  petId: PetId,
): PetCollectionState {
  if (
    collection.selectedPetId === petId ||
    !collection.ownedPetIds.includes(petId)
  ) {
    return collection
  }

  return {
    ...collection,
    selectedPetId: petId,
  }
}
