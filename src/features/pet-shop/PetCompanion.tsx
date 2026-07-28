import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { getPetAnimation } from '../game/petAnimation'
import {
  DINO_STAGES,
  getDinoEvolution,
} from '../game/dinoProgress'
import type { DinoStageId, PetId } from '../../shared/gameTypes'
import {
  getAppCopy,
  getPetIdentityCopy,
  getPetReactions,
  getPetStageCopy,
  type DinoReactionCopy,
  type Language,
} from '../../shared/localization'

const PET_REACTION_DURATION_MS = 2_400

interface PetReactionState extends DinoReactionCopy {
  id: number
}

function AnimatedPetVisual({
  petId,
  stageId,
  label,
  hungry,
}: {
  petId: PetId
  stageId: DinoStageId
  label: string
  hungry: boolean
}) {
  const animation = getPetAnimation(petId, stageId)
  const [activeFrame, setActiveFrame] = useState(
    animation.timeline[0].frameIndex,
  )

  useEffect(() => {
    const reduceMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    let stepIndex = 0
    let timeoutId: number | null = null

    const stopAnimation = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
        timeoutId = null
      }
    }

    const scheduleNextStep = () => {
      if (reduceMotion || document.hidden || timeoutId !== null) {
        return
      }

      timeoutId = window.setTimeout(() => {
        timeoutId = null
        stepIndex = (stepIndex + 1) % animation.timeline.length
        setActiveFrame(animation.timeline[stepIndex].frameIndex)
        scheduleNextStep()
      }, animation.timeline[stepIndex].holdMs)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAnimation()
        return
      }
      scheduleNextStep()
    }

    scheduleNextStep()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopAnimation()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [animation])

  return (
    <span
      aria-label={label}
      className={`dino-sprite dino-sprite--${stageId} pet-sprite--${petId} ${
        hungry ? 'dino-sprite--hungry' : ''
      }`}
      data-testid="pet-stage"
      role="img"
    >
      {animation.frames.map((frame, index) => (
        <img
          key={frame.src}
          alt=""
          aria-hidden="true"
          className={`dino-sprite__frame ${
            index === activeFrame ? 'dino-sprite__frame--active' : ''
          }`}
          data-active={index === activeFrame}
          decoding="async"
          draggable="false"
          fetchPriority={index === 0 ? 'high' : 'low'}
          height="512"
          loading={index === 0 ? 'eager' : 'lazy'}
          src={frame.src}
          style={
            {
              '--dino-frame-normalize-scale': frame.normalizeScale,
              '--dino-frame-offset-x': `${frame.offsetX}%`,
              '--dino-frame-offset-y': `${frame.offsetY}%`,
            } as CSSProperties
          }
          width="512"
        />
      ))}
    </span>
  )
}

function PetVisual({
  petId,
  stageId,
  label,
  hungry,
}: {
  petId: PetId
  stageId: DinoStageId
  label: string
  hungry: boolean
}) {
  return (
    <AnimatedPetVisual
      hungry={hungry}
      label={label}
      petId={petId}
      stageId={stageId}
    />
  )
}

export function PetCompanion({
  language,
  petId,
  points,
  wallet,
  compact = false,
  celebrate = false,
  hungry = false,
  soundError = null,
  onInteract,
  onOpenShop,
}: {
  language: Language
  petId: PetId
  points: number
  wallet: number
  compact?: boolean
  celebrate?: boolean
  hungry?: boolean
  soundError?: string | null
  onInteract?: () => void
  onOpenShop: () => void
}) {
  const copy = getAppCopy(language)
  const evolution = getDinoEvolution(points)
  const petCopy = getPetIdentityCopy(language, petId)
  const stageCopy = getPetStageCopy(language, petId, evolution.stage.id)
  const reactions = getPetReactions(
    language,
    petId,
    evolution.stage.id,
    hungry,
  )
  const [reaction, setReaction] = useState<PetReactionState | null>(null)
  const reactionIndexRef = useRef(-1)
  const reactionIdRef = useRef(0)
  const reactionTimeoutRef = useRef<number | null>(null)
  const progressLabel = evolution.nextStage
    ? `${copy.petNextPrefix} ${evolution.pointsToNextStage} ${copy.petPointsLabel}`
    : copy.petMaxStage

  useEffect(
    () => () => {
      if (reactionTimeoutRef.current !== null) {
        window.clearTimeout(reactionTimeoutRef.current)
      }
    },
    [],
  )

  const handlePetTap = () => {
    reactionIndexRef.current = (reactionIndexRef.current + 1) % reactions.length
    reactionIdRef.current += 1
    setReaction({
      ...reactions[reactionIndexRef.current],
      id: reactionIdRef.current,
    })

    if (reactionTimeoutRef.current !== null) {
      window.clearTimeout(reactionTimeoutRef.current)
    }
    reactionTimeoutRef.current = window.setTimeout(() => {
      setReaction(null)
      reactionTimeoutRef.current = null
    }, PET_REACTION_DURATION_MS)

    onInteract?.()
  }

  return (
    <section
      aria-label={`${copy.petTitle}: ${petCopy.name}`}
      className={`dino-card ${compact ? 'dino-card--compact' : ''} ${
        celebrate ? 'dino-card--celebrate' : ''
      } ${hungry ? 'dino-card--hungry' : ''}`}
    >
      <header className="dino-card__header">
        <div className="dino-card__intro">
          <p className="dino-card__kicker">{copy.petTitle}</p>
          {!compact && (
            <p className="dino-card__subtitle">
              {hungry ? copy.petHungryMessage : copy.petSubtitle}
            </p>
          )}
        </div>
        <div className="dino-card__status">
          {hungry && (
            <span className="dino-hunger-badge">🍎 {copy.petHungryLabel}</span>
          )}
        </div>
      </header>

      <div className="dino-card__actions">
        <span
          className="dino-points"
          aria-label={`${copy.petShopWalletLabel}: ${wallet}`}
        >
          <span className="dino-points__label">
            {compact
              ? copy.petShopWalletCompactLabel
              : copy.petShopWalletLabel}
          </span>
          <strong className="dino-points__value">
            <span aria-hidden="true">♫</span> {wallet}
          </strong>
        </span>
        <button className="pet-shop-open" onClick={onOpenShop} type="button">
          <span aria-hidden="true" className="pet-shop-open__icon">🛍️</span>
          <span className="pet-shop-open__label">{copy.petShopOpen}</span>
          <span aria-hidden="true" className="pet-shop-open__arrow">→</span>
        </button>
      </div>

      <div className="dino-card__body">
        {reaction && (
          <p
            key={reaction.id}
            aria-live="polite"
            className="dino-feeling"
            role="status"
          >
            <span aria-hidden="true" className="dino-feeling__emoji">
              {reaction.emoji}
            </span>
            <span>{reaction.message}</span>
          </p>
        )}
        <button
          aria-label={copy.petTapLabel}
          className={`dino-sprite-button ${
            reaction ? 'dino-sprite-button--reacting' : ''
          }`}
          data-testid="pet-stage-button"
          onClick={handlePetTap}
          type="button"
        >
          <PetVisual
            hungry={hungry}
            label={stageCopy.name}
            petId={petId}
            stageId={evolution.stage.id}
          />
        </button>
        <div className="dino-card__copy">
          <span className="dino-stage-chip">
            {language === 'en' ? 'Stage' : 'Cấp'} {evolution.stageIndex + 1}/
            {DINO_STAGES.length}
          </span>
          <strong className="dino-stage-name">{stageCopy.name}</strong>
          <p>{stageCopy.description}</p>
        </div>
      </div>

      <div className="dino-growth-panel">
        <div className="dino-progress">
          <div className="dino-progress__label">
            <span>{progressLabel}</span>
            <strong>{evolution.progressPercent}%</strong>
          </div>
          <div
            aria-label={progressLabel}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={evolution.progressPercent}
            className="dino-progress__track"
            role="progressbar"
          >
            <span style={{ width: `${evolution.progressPercent}%` }} />
          </div>
        </div>

        <div className="evolution-track" aria-label={copy.petEvolutionLabel}>
          {DINO_STAGES.map((stage, index) => {
            const isCurrent = index === evolution.stageIndex
            const isComplete = index < evolution.stageIndex
            const label = getPetStageCopy(language, petId, stage.id).name

            return (
              <span
                key={stage.id}
                aria-label={label}
                className={`evolution-track__step ${
                  isCurrent ? 'evolution-track__step--current' : ''
                } ${isComplete ? 'evolution-track__step--complete' : ''}`}
                title={label}
              >
                {isComplete ? '✓' : index + 1}
              </span>
            )
          })}
        </div>
      </div>

      <footer className="dino-card__footer">
        <p className="dino-card__tap-hint">👆 {copy.petTapHint}</p>
        {soundError && (
          <p className="dino-card__sound-error" role="alert">
            {soundError}
          </p>
        )}
        {!compact && <p className="dino-card__hint">💡 {copy.petHint}</p>}
      </footer>
    </section>
  )
}
