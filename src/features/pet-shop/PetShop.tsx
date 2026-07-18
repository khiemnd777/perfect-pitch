import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react'
import { getDinoEvolution } from '../game/dinoProgress'
import {
  PET_CATALOG,
  type PetCollectionState,
} from '../game/petCollection'
import { getPetAnimation } from '../game/petAnimation'
import type { PetId } from '../../shared/gameTypes'
import {
  getAppCopy,
  getPetIdentityCopy,
  getPetStageCopy,
  type Language,
} from '../../shared/localization'

const PET_SHOP_PREVIEW_STAGE = 'adult'

export function PetShop({
  language,
  collection,
  notice,
  onBuy,
  onClose,
  onSelect,
}: {
  language: Language
  collection: PetCollectionState
  notice: string | null
  onBuy: (petId: PetId) => void
  onClose: () => void
  onSelect: (petId: PetId) => void
}) {
  const copy = getAppCopy(language)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const cancelPurchaseButtonRef = useRef<HTMLButtonElement | null>(null)
  const purchaseTriggerRef = useRef<HTMLButtonElement | null>(null)
  const pendingPetIdRef = useRef<PetId | null>(null)
  const [pendingPetId, setPendingPetId] = useState<PetId | null>(null)

  const pendingPet = pendingPetId
    ? PET_CATALOG.find((pet) => pet.id === pendingPetId)
    : null

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (pendingPetIdRef.current) {
          pendingPetIdRef.current = null
          setPendingPetId(null)
          purchaseTriggerRef.current?.focus()
        } else {
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
    }
  }, [onClose])

  useEffect(() => {
    if (pendingPetId) {
      cancelPurchaseButtonRef.current?.focus()
    }
  }, [pendingPetId])

  const requestPurchase = (
    event: MouseEvent<HTMLButtonElement>,
    petId: PetId,
  ) => {
    purchaseTriggerRef.current = event.currentTarget
    pendingPetIdRef.current = petId
    setPendingPetId(petId)
  }

  const cancelPurchase = () => {
    pendingPetIdRef.current = null
    setPendingPetId(null)
    purchaseTriggerRef.current?.focus()
  }

  const confirmPurchase = () => {
    if (!pendingPet) {
      return
    }

    onBuy(pendingPet.id)
    pendingPetIdRef.current = null
    setPendingPetId(null)
  }

  return (
    <div className="pet-shop-backdrop">
      <section
        aria-label={copy.petShopTitle}
        aria-modal="true"
        className="pet-shop-dialog"
        role="dialog"
      >
        <header className="pet-shop-dialog__header">
          <div>
            <p className="question-kicker">{copy.petShopCollectionLabel}</p>
            <h2>{copy.petShopTitle}</h2>
            <p>{copy.petShopSubtitle}</p>
          </div>
          <div className="pet-shop-dialog__actions">
            <span
              aria-label={`${copy.petShopWalletLabel}: ${collection.wallet}`}
              className="pet-shop-wallet"
            >
              <span aria-hidden="true">♫</span>
              <strong>{collection.wallet}</strong>
              <span>{copy.petShopWalletLabel}</span>
            </span>
            <button
              ref={closeButtonRef}
              aria-label={copy.petShopClose}
              className="pet-shop-close"
              onClick={onClose}
              type="button"
            >
              ×
            </button>
          </div>
        </header>

        {notice && (
          <p className="pet-shop-notice" role="status">
            {notice}
          </p>
        )}

        <div className="pet-shop-grid">
          {PET_CATALOG.map((pet) => {
            const owned = collection.ownedPetIds.includes(pet.id)
            const isCurrent = collection.selectedPetId === pet.id
            const points = collection.petPoints[pet.id]
            const stage = owned ? getDinoEvolution(points).stage.id : 'egg'
            const identityCopy = getPetIdentityCopy(language, pet.id)
            const stageCopy = getPetStageCopy(language, pet.id, stage)
            const missingNotes = Math.max(0, pet.price - collection.wallet)
            const canBuy = !owned && missingNotes === 0
            const buttonLabel = isCurrent
              ? copy.petShopCurrent
              : owned
                ? copy.petShopChoose
                : canBuy
                  ? `${copy.petShopBuy} · ♫ ${pet.price}`
                  : `${copy.petShopNeedMore} ♫ ${missingNotes}`

            return (
              <article
                key={pet.id}
                className={`pet-shop-card ${
                  isCurrent ? 'pet-shop-card--current' : ''
                }`}
                style={
                  {
                    '--pet-accent': pet.accent,
                    '--pet-accent-soft': pet.accentSoft,
                  } as CSSProperties
                }
              >
                <div className="pet-shop-card__topline">
                  <div className="pet-shop-card__badges">
                    <span className="pet-shop-card__badge">
                      {owned ? copy.petShopOwned : `♫ ${pet.price}`}
                    </span>
                    {pet.rarity === 'legendary' && (
                      <span className="pet-shop-card__legendary">
                        ✦ {copy.petShopLegendary}
                      </span>
                    )}
                    {pet.rarity === 'monster' && (
                      <span className="pet-shop-card__monster">
                        ◆ {copy.petShopMonster}
                      </span>
                    )}
                  </div>
                  {isCurrent && (
                    <span className="pet-shop-card__current">✓ {copy.petShopCurrent}</span>
                  )}
                </div>

                <div className="pet-shop-card__preview" aria-hidden="true">
                  <img
                    alt=""
                    className="pet-shop-card__preview-image"
                    draggable="false"
                    src={
                      getPetAnimation(pet.id, PET_SHOP_PREVIEW_STAGE).frames[0]
                        .src
                    }
                  />
                </div>

                <div className="pet-shop-card__copy">
                  <h3>{identityCopy.name}</h3>
                  <p>{identityCopy.description}</p>
                  {owned && <small>{stageCopy.name} · {points} {copy.petPointsLabel}</small>}
                </div>

                <button
                  className="pet-shop-card__button"
                  disabled={isCurrent || (!owned && !canBuy)}
                  onClick={(event) =>
                    owned
                      ? onSelect(pet.id)
                      : requestPurchase(event, pet.id)
                  }
                  type="button"
                >
                  {buttonLabel}
                </button>
              </article>
            )
          })}
        </div>

        {pendingPet && (
          <div className="pet-purchase-backdrop">
            <section
              aria-describedby="pet-purchase-description pet-purchase-balance"
              aria-labelledby="pet-purchase-title"
              aria-modal="true"
              className="pet-purchase-dialog"
              role="alertdialog"
              style={
                {
                  '--pet-accent': pendingPet.accent,
                  '--pet-accent-soft': pendingPet.accentSoft,
                } as CSSProperties
              }
            >
              <div className="pet-purchase-dialog__pet" aria-hidden="true">
                <img
                  alt=""
                  draggable="false"
                  src={
                    getPetAnimation(pendingPet.id, PET_SHOP_PREVIEW_STAGE)
                      .frames[0].src
                  }
                />
              </div>
              <div className="pet-purchase-dialog__copy">
                <p className="question-kicker">{copy.petShopCollectionLabel}</p>
                <h2 id="pet-purchase-title">{copy.petShopConfirmTitle}</h2>
                <p id="pet-purchase-description">
                  {copy.petShopConfirmPrompt(
                    getPetIdentityCopy(language, pendingPet.id).name,
                    pendingPet.price,
                  )}
                </p>
                <p id="pet-purchase-balance">
                  {copy.petShopBalanceAfter(collection.wallet - pendingPet.price)}
                </p>
              </div>
              <div className="pet-purchase-dialog__actions">
                <button
                  ref={cancelPurchaseButtonRef}
                  className="pet-purchase-dialog__cancel"
                  onClick={cancelPurchase}
                  type="button"
                >
                  {copy.petShopCancel}
                </button>
                <button
                  className="pet-purchase-dialog__confirm"
                  onClick={confirmPurchase}
                  type="button"
                >
                  {copy.petShopConfirmBuy}
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  )
}
