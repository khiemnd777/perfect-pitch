import { beforeEach, describe, expect, it } from 'vitest'
import { DINO_PROGRESS_STORAGE_KEY } from './dinoProgress'
import {
  PET_CATALOG,
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
      petPoints: {
        dino: 230,
        cat: 0,
        bunny: 0,
        fox: 0,
        dog: 0,
        hamster: 0,
        panda: 0,
        penguin: 0,
        unicorn: 0,
        dragon: 0,
        phoenix: 0,
        griffin: 0,
        bella: 0,
        'little-bella': 0,
        andy: 0,
      },
    })
  })

  it('buys an egg without reducing any pet evolution progress', () => {
    const collection = createDefaultPetCollection(240)
    const next = purchasePet(collection, 'cat')

    expect(next).toMatchObject({
      wallet: 140,
      selectedPetId: 'cat',
      ownedPetIds: ['dino', 'cat'],
      petPoints: {
        dino: 240,
        cat: 0,
        bunny: 0,
        fox: 0,
        dog: 0,
        hamster: 0,
        panda: 0,
        penguin: 0,
        unicorn: 0,
        dragon: 0,
        phoenix: 0,
        griffin: 0,
        bella: 0,
        'little-bella': 0,
        andy: 0,
      },
    })
  })

  it('does not buy an egg twice or when the balance is too low', () => {
    const collection = createDefaultPetCollection(50)

    expect(purchasePet(collection, 'cat')).toBe(collection)
    expect(purchasePet(collection, 'dino')).toBe(collection)
  })

  it('keeps legendary eggs expensive and starts them with zero growth', () => {
    const tooPoor = createDefaultPetCollection(1_999)

    expect(purchasePet(tooPoor, 'unicorn')).toBe(tooPoor)

    expect(purchasePet(createDefaultPetCollection(2_000), 'unicorn')).toMatchObject({
      wallet: 0,
      selectedPetId: 'unicorn',
      ownedPetIds: ['dino', 'unicorn'],
      petPoints: { dino: 2_000, unicorn: 0 },
    })
  })

  it('prices Monster pets above every legendary pet and starts them as eggs', () => {
    const bella = PET_CATALOG.find((pet) => pet.id === 'bella')
    const littleBella = PET_CATALOG.find((pet) => pet.id === 'little-bella')
    const andy = PET_CATALOG.find((pet) => pet.id === 'andy')
    const legendaryPrices = PET_CATALOG.filter(
      (pet) => pet.rarity === 'legendary',
    ).map((pet) => pet.price)

    expect(bella).toMatchObject({ price: 10_000, rarity: 'monster' })
    expect(bella?.price).toBeGreaterThan(Math.max(...legendaryPrices))
    expect(littleBella).toMatchObject({ price: 12_500, rarity: 'monster' })
    expect(littleBella?.price).toBeGreaterThan(bella?.price ?? 0)
    expect(andy).toMatchObject({ price: 15_000, rarity: 'monster' })
    expect(andy?.price).toBeGreaterThan(littleBella?.price ?? 0)
    expect(purchasePet(createDefaultPetCollection(10_000), 'bella')).toMatchObject({
      wallet: 0,
      selectedPetId: 'bella',
      ownedPetIds: ['dino', 'bella'],
      petPoints: { dino: 10_000, bella: 0 },
    })
    expect(
      purchasePet(createDefaultPetCollection(12_500), 'little-bella'),
    ).toMatchObject({
      wallet: 0,
      selectedPetId: 'little-bella',
      ownedPetIds: ['dino', 'little-bella'],
      petPoints: { dino: 12_500, 'little-bella': 0 },
    })
    expect(purchasePet(createDefaultPetCollection(15_000), 'andy')).toMatchObject({
      wallet: 0,
      selectedPetId: 'andy',
      ownedPetIds: ['dino', 'andy'],
      petPoints: { dino: 15_000, andy: 0 },
    })
  })

  it('rewards both the wallet and the selected pet', () => {
    const collection = {
      ...createDefaultPetCollection(120),
      selectedPetId: 'cat' as const,
      ownedPetIds: ['dino', 'cat'] as const as ('dino' | 'cat')[],
    }

    expect(rewardSelectedPet(collection, 10)).toMatchObject({
      wallet: 130,
      petPoints: {
        dino: 120,
        cat: 10,
        bunny: 0,
        fox: 0,
        dog: 0,
        hamster: 0,
        panda: 0,
        penguin: 0,
        unicorn: 0,
        dragon: 0,
        phoenix: 0,
        griffin: 0,
        bella: 0,
        'little-bella': 0,
        andy: 0,
      },
    })
  })

  it('adds new pet progress slots when loading an older collection save', () => {
    window.localStorage.setItem(
      PET_COLLECTION_STORAGE_KEY,
      JSON.stringify({
        wallet: 420,
        selectedPetId: 'fox',
        ownedPetIds: ['dino', 'fox'],
        petPoints: { dino: 100, cat: 0, bunny: 0, fox: 70 },
      }),
    )

    expect(loadPetCollection(window.localStorage).petPoints).toEqual({
      dino: 100,
      cat: 0,
      bunny: 0,
      fox: 70,
      dog: 0,
      hamster: 0,
      panda: 0,
      penguin: 0,
      unicorn: 0,
      dragon: 0,
      phoenix: 0,
      griffin: 0,
      bella: 0,
      'little-bella': 0,
      andy: 0,
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
