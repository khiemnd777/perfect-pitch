import {
  useEffect,
  useRef,
  type CSSProperties,
} from 'react'
import { getDinoEvolution } from '../game/dinoProgress'
import {
  PET_CATALOG,
  type PetCollectionState,
} from '../game/petCollection'
import type { PetId } from '../../shared/gameTypes'
import {
  getAppCopy,
  getPetIdentityCopy,
  getPetStageCopy,
  type Language,
} from '../../shared/localization'

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

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
    }
  }, [onClose])

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
                  <span className="pet-shop-card__badge">
                    {owned ? copy.petShopOwned : `♫ ${pet.price}`}
                  </span>
                  {isCurrent && (
                    <span className="pet-shop-card__current">✓ {copy.petShopCurrent}</span>
                  )}
                </div>

                <div className="pet-shop-card__preview" aria-hidden="true">
                  {stage === 'egg' ? (
                    <span className="pet-shop-card__egg">
                      <span />
                    </span>
                  ) : (
                    <span className="pet-shop-card__emoji">{pet.emoji}</span>
                  )}
                </div>

                <div className="pet-shop-card__copy">
                  <h3>{identityCopy.name}</h3>
                  <p>{identityCopy.description}</p>
                  {owned && <small>{stageCopy.name} · {points} {copy.petPointsLabel}</small>}
                </div>

                <button
                  className="pet-shop-card__button"
                  disabled={isCurrent || (!owned && !canBuy)}
                  onClick={() => (owned ? onSelect(pet.id) : onBuy(pet.id))}
                  type="button"
                >
                  {buttonLabel}
                </button>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
