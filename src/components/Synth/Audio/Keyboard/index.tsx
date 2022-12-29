import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import css from './index.module.css'
import GateNode from '../../../../utils/GateNode'
import getFrequencyFromSemitone from '../../../../utils/getFrequencyFromSemitone'
import getNoteFromSemitone from '../../../../utils/getNoteFromSemitone'
import JackPlug from '../../Utils/JackPlug'
import Panel from '../../Utils/Panel'
import Preset from '../../Utils/Preset'
import Slider from '../../Utils/Slider'

const keymap = {
  a: -9,
  w: -8,
  s: -7,
  e: -6,
  d: -5,
  f: -4,
  t: -3,
  g: -2,
  y: -1,
  h: 0,
  u: 1,
  j: 2,
  k: 3,
  o: 4,
  l: 5,
  p: 6,
  ';': 7,
  "'": 8,
}

function isMappedKey(key: string): key is keyof typeof keymap {
  return Object.keys(keymap).includes(key)
}

const types = ['mono', 'chord', 'poly']

export interface Oscillator {
  frequency: number
  id: string
  started: number
  active: boolean
}

interface Props {
  audioCtx: AudioContext
  id: string
  oscillators: Oscillator[]
  setOscillators: (cb: (oscillators: Oscillator[]) => Oscillator[]) => void
}

export default function Keyboard({ audioCtx, id, oscillators, setOscillators }: Props) {
  const [type, setTypeRaw] = useState(0)

  const pressedSemitones = useRef<{ [key: string]: number }>({})

  const gateNode = useMemo(() => new GateNode(audioCtx), [audioCtx])

  const startFrequency = useCallback(
    (frequency: number) =>
      setOscillators((oscillators) => {
        if (oscillators.find((oscillator) => oscillator.active && oscillator.frequency === frequency)) {
          return oscillators
        }

        switch (types[type]) {
          default:
          case 'mono':
            return [
              {
                ...oscillators[0],
                active: true,
                frequency,
                started: new Date().getTime(),
              },
              ...oscillators.slice(1),
            ]
          case 'poly': {
            let freeOscillatorIndex = oscillators.findIndex((oscillator) => !oscillator.active)
            if (freeOscillatorIndex === -1) {
              let started = Infinity
              oscillators.forEach((oscillator, i) => {
                if (oscillator.started < started) {
                  started = oscillator.started
                  freeOscillatorIndex = i
                }
              })
            }

            const newOscillator = {
              ...oscillators[freeOscillatorIndex],
              active: true,
              frequency,
              started: new Date().getTime(),
            }

            return [
              ...oscillators.slice(0, freeOscillatorIndex),
              newOscillator,
              ...oscillators.slice(freeOscillatorIndex + 1),
            ]
          }
          case 'chord': {
            return oscillators.map((oscillator) => ({
              ...oscillator,
              active: true,
              frequency,
              started: new Date().getTime(),
            }))
          }
        }
      }),
    [setOscillators, type],
  )

  const stopFrequency = useCallback(
    (frequency: number) =>
      setOscillators((oscillators) => {
        const oscillatorIndex = oscillators.findIndex((oscillator) => oscillator.frequency === frequency)
        if (oscillatorIndex === -1) {
          return oscillators
        }

        switch (types[type]) {
          default:
          case 'mono':
            return [
              {
                ...oscillators[0],
                active: false,
              },
              ...oscillators.slice(1),
            ]
          case 'poly':
            return [
              ...oscillators.slice(0, oscillatorIndex),
              {
                ...oscillators[oscillatorIndex],
                active: false,
                frequency,
                started: 0,
              },
              ...oscillators.slice(oscillatorIndex + 1),
            ]

          case 'chord': {
            return oscillators.map((oscillator) => ({
              ...oscillator,
              active: false,
            }))
          }
        }
      }),
    [setOscillators, type],
  )

  const startNote = useCallback(
    (semitone: number) => {
      pressedSemitones.current[semitone] = new Date().getTime()

      startFrequency(getFrequencyFromSemitone(440, semitone))

      // if (gateNode.getValue() !== 1) {
      gateNode.setValue(1, undefined, true)
      // }
    },
    [gateNode, startFrequency],
  )

  const stopNote = useCallback(
    (semitone: number) => {
      delete pressedSemitones.current[semitone]

      if (Object.keys(pressedSemitones.current).length === 0) {
        gateNode.setValue(0, undefined, true)
      }

      if (['mono', 'chord'].includes(types[type]) && Object.keys(pressedSemitones.current).length > 0) {
        const newestSemitone = Object.keys(pressedSemitones.current).sort((k1, k2) => {
          const d1 = pressedSemitones.current[k1] ?? ''
          const d2 = pressedSemitones.current[k2] ?? ''

          if (d1 > d2) {
            return -1
          }
          if (d1 < d2) {
            return 1
          }

          return 0
        })[0]
        startFrequency(getFrequencyFromSemitone(440, Number.parseInt(newestSemitone)))
      } else {
        stopFrequency(getFrequencyFromSemitone(440, semitone))
      }
    },
    [gateNode, startFrequency, stopFrequency, type],
  )

  const onRelease = useCallback(() => {
    Object.keys(pressedSemitones.current).forEach((semitone) => stopNote(Number.parseInt(semitone)))
  }, [stopNote])

  const setType = useCallback(
    (newType: typeof type) => {
      onRelease()
      setTypeRaw(newType)
    },
    [onRelease],
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.repeat) {
        return
      }

      const key = event.key.toLowerCase()

      if (key === ' ') {
        event.preventDefault()
        onRelease()

        return
      }

      if (!isMappedKey(key)) {
        return
      }

      event.preventDefault()
      const semitone = keymap[key]
      startNote(semitone)
    },
    [onRelease, startNote],
  )

  const onKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (event.repeat) {
        return
      }

      const key = event.key.toLowerCase()

      if (!isMappedKey(key)) {
        return
      }

      event.preventDefault()
      const semitone = keymap[key]
      stopNote(semitone)
    },
    [stopNote],
  )

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [onKeyDown, onKeyUp])

  return (
    <Preset id={id}>
      <Panel height={1} width={4}>
        <div className={css.controls}>
          <Slider
            label="Type"
            max={types.length - 1}
            onChange={setType}
            step={1}
            transformer={(value) => types[value]}
            value={type}
          />

          <Preset id="IO">
            <JackPlug input={gateNode} label="GOut" />
          </Preset>
        </div>

        <div className={css.keyboard}>
          {Array.from({ length: 25 }).map((v, i) => {
            const semitone = i - 12
            const note = getNoteFromSemitone(semitone)
            const frequency = getFrequencyFromSemitone(440, semitone)
            const inUse = oscillators.find((oscillator) => oscillator.active && oscillator.frequency === frequency)

            return (
              <div key={frequency}>
                <button
                  className={css.key}
                  onClick={() => (inUse ? stopNote(semitone) : startNote(semitone))}
                  style={{ color: inUse ? 'red' : undefined }}
                >
                  {note}
                </button>
              </div>
            )
          })}
        </div>

        <div>
          <button className={css.key} onClick={onRelease}>
            Release
          </button>
        </div>
      </Panel>
    </Preset>
  )
}
