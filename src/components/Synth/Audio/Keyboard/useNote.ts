import { MutableRefObject, useCallback } from 'react'
import GateNode from '../../../../utils/GateNode'
import getFrequencyFromSemitone from '../../../../utils/getFrequencyFromSemitone'
import { types } from './constants'

interface Params {
  gateNode: GateNode
  pressedSemitones: MutableRefObject<{ [key: string]: number }>
  startFrequency: (frequency: number) => void
  stopFrequency: (frequency: number) => void
  type: number
}

export default function useNote({ gateNode, pressedSemitones, startFrequency, stopFrequency, type }: Params) {
  const startNote = useCallback(
    (semitone: number) => {
      pressedSemitones.current[semitone] = new Date().getTime()

      startFrequency(getFrequencyFromSemitone(440, semitone))

      // if (gateNode.getValue() !== 1) {
      gateNode.setValue(1, undefined, true)
      // }
    },
    [gateNode, pressedSemitones, startFrequency],
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
    [gateNode, pressedSemitones, startFrequency, stopFrequency, type],
  )

  const onRelease = useCallback(() => {
    Object.keys(pressedSemitones.current).forEach((semitone) => stopNote(Number.parseInt(semitone)))
  }, [pressedSemitones, stopNote])

  return {
    onRelease,
    startNote,
    stopNote,
  }
}
