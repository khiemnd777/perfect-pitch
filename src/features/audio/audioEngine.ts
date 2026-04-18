import * as Tone from 'tone'
import { PIANO_BASE_URL, SAMPLE_NOTE_URLS, VELOCITY_LAYERS } from './pianoSamples'
import type { Question } from '../../shared/gameTypes'

export interface AudioEngine {
  preload(): Promise<void>
  init(): Promise<void>
  playQuestion(question: Question): Promise<void>
  replay(): Promise<void>
  stop(): void
  dispose(): void
}

export function createAudioEngine(): AudioEngine {
  let initialized = false
  let currentQuestion: Question | null = null
  let samplers: Tone.Sampler[] = []
  let preloadPromise: Promise<void> | null = null

  const resetSamplers = () => {
    samplers.forEach((sampler) => sampler.dispose())
    samplers = []
    preloadPromise = null
  }

  const ensureSamplers = () => {
    if (samplers.length > 0) {
      return
    }

    samplers = VELOCITY_LAYERS.map((velocity) =>
      new Tone.Sampler({
        urls: Object.fromEntries(
          Object.entries(SAMPLE_NOTE_URLS).map(([note, layerMap]) => [
            note,
            layerMap[velocity],
          ]),
        ),
        baseUrl: PIANO_BASE_URL,
        attack: 0,
        release: 1.2,
      }).toDestination(),
    )
  }

  const preload = async () => {
    ensureSamplers()

    if (!preloadPromise) {
      preloadPromise = Tone.loaded().catch((error) => {
        resetSamplers()
        throw error
      })
    }

    await preloadPromise
  }

  const init = async () => {
    if (initialized) {
      return
    }

    await Tone.start()
    try {
      await preload()
    } catch {
      await preload()
    }
    initialized = true
  }

  const playSequence = async (question: Question) => {
    if (!initialized) {
      await init()
    }

    stop()
    currentQuestion = question
    const startAt = Tone.now() + 0.08

    question.playback.forEach((event) => {
      const velocityIndex = Math.min(
        samplers.length - 1,
        Math.max(0, Math.round(event.velocity * (samplers.length - 1))),
      )
      const sampler = samplers[velocityIndex]

      event.notes.forEach((note) => {
        sampler.triggerAttackRelease(note, event.durationMs / 1000, startAt + event.offsetMs / 1000)
      })
    })
  }

  return {
    preload,
    init,
    async playQuestion(question) {
      await playSequence(question)
    },
    async replay() {
      if (!currentQuestion) {
        return
      }

      await playSequence(currentQuestion)
    },
    stop() {
      samplers.forEach((sampler) => sampler.releaseAll())
      Tone.Transport.cancel()
    },
    dispose() {
      resetSamplers()
      currentQuestion = null
      initialized = false
    },
  }
}
