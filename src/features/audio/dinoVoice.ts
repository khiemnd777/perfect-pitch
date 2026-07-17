/**
 * Plays a short, child-friendly dinosaur "rawr" without touching the sampled
 * piano engine. Tone is imported lazily so the home screen stays lightweight.
 */
export async function playDinoRoar() {
  const Tone = await import('tone')
  await Tone.start()

  const output = new Tone.Gain(0.16).toDestination()
  const filter = new Tone.Filter({
    frequency: 520,
    type: 'lowpass',
    rolloff: -24,
  }).connect(output)
  const rumble = new Tone.NoiseSynth({
    noise: { type: 'brown' },
    envelope: {
      attack: 0.03,
      decay: 0.36,
      sustain: 0.05,
      release: 0.42,
    },
  }).connect(filter)
  const voice = new Tone.MembraneSynth({
    pitchDecay: 0.2,
    octaves: 3,
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.02,
      decay: 0.32,
      sustain: 0.08,
      release: 0.48,
    },
  }).connect(output)
  const startAt = Tone.now() + 0.02

  rumble.triggerAttackRelease(0.42, startAt)
  voice.triggerAttackRelease('C2', 0.3, startAt)
  voice.triggerAttackRelease('G1', 0.4, startAt + 0.3)

  await new Promise<void>((resolve) => {
    globalThis.setTimeout(() => {
      rumble.dispose()
      voice.dispose()
      filter.dispose()
      output.dispose()
      resolve()
    }, 1_100)
  })
}
