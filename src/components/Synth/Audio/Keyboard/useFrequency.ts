import { useCallback } from 'react'
import { types } from './constants'
import { Oscillator } from './types'

interface Params {
  setOscillators: (cb: (oscillators: Oscillator[]) => Oscillator[]) => void
  type: number
}

export default function useFrequency({ setOscillators, type }: Params) {
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

  return {
    startFrequency,
    stopFrequency,
  }
}
