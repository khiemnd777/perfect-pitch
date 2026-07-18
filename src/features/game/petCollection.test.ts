import { beforeEach, describe, expect, it } from 'vitest'
import { DINO_PROGRESS_STORAGE_KEY } from './dinoProgress'
import {
  PET_COLLECTION_STORAGE_KEY,
  createDefaultPetCollection,
  loadPetCollection,
  purchasePet,
  rewardSelectedPet,
  savePetCollection,
  selectPet,
} from './petCollection'

describe('petCollection', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('migrates existing dinosaur progress into growth points and shop balance', () => {
    window.localStorage.setItem(
      DINO_PROGRESS_STORAGE_KEY,
      JSON.stringify({ points: 230 }),
    )

    expect(loadPetCollection(window.localStorage)).toEqual({
      wallet: 230,
      selectedPetId: 'dino',
      ownedPetIds: ['dino'],
      petPoints: { dino: 230, cat: 0, bunny: 0, fox: 0 },
    })
  })

  it('buys an egg without reducing any pet evolution progress', () => {
    const collection = createDefaultPetCollection(240)
    const next = purchasePet(collection, 'cat')

    expect(next).toMatchObject({
      wallet: 140,
      selectedPetId: 'cat',
      ownedPetIds: ['dino', 'cat'],
      petPoints: { dino: 240, cat: 0, bunny: 0, fox: 0 },
    })
  })

  it('does not buy an egg twice or when the balance is too low', () => {
    const collection = createDefaultPetCollection(50)

    expect(purchasePet(collection, 'cat')).toBe(collection)
    expect(purchasePet(collection, 'dino')).toBe(collection)
  })

  it('rewards both the wallet and the selected pet', () => {
    const collection = {
      ...createDefaultPetCollection(120),
      selectedPetId: 'cat' as const,
      ownedPetIds: ['dino', 'cat'] as const as ('dino' | 'cat')[],
    }

    expect(rewardSelectedPet(collection, 10)).toMatchObject({
      wallet: 130,
      petPoints: { dino: 120, cat: 10, bunny: 0, fox: 0 },
    })
  })

  it('only selects pets that are already owned', () => {
    const collection = createDefaultPetCollection()

    expect(selectPet(collection, 'cat')).toBe(collection)
    expect(selectPet(collection, 'dino')).toBe(collection)
  })

  it('persists and safely restores the collection', () => {
    const collection = purchasePet(createDefaultPetCollection(200), 'cat')
    savePetCollection(collection, window.localStorage)

    expect(loadPetCollection(window.localStorage)).toEqual(collection)
    expect(window.localStorage.getItem(PET_COLLECTION_STORAGE_KEY)).not.toBeNull()
  })
})
