import { MutableRefObject, useContext, useEffect } from 'react'
import { CustomMIDIEvent, MIDIContext } from '../../Utils/MIDI'
import type { Sound } from './types'

interface Params {
  audioCtx: AudioContext
  detune: number
  range: number
  sounds: MutableRefObject<Sound[]>
}

export default function useMIDIPitchBend({ audioCtx, detune, range, sounds }: Params) {
  const midi = useContext(MIDIContext)

  useEffect(() => {
    function onPitch(event: CustomMIDIEvent<'pitch'>) {
      const bend = Math.floor(((event.detail.value / 0x3fff) * 2 - 1) * 10000) / 10000

      sounds.current.forEach(({ oscillator }) => {
        oscillator.detune.setValueAtTime(detune + bend * range, audioCtx.currentTime)
      })
    }

    midi.addEventListener('pitch', onPitch)

    return () => {
      midi.removeEventListener('pitch', onPitch)
    }
  }, [audioCtx.currentTime, detune, midi, range, sounds])
}
