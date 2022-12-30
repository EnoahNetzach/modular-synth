import { MutableRefObject, useEffect } from 'react'
import getFrequencyFromSemitone from '../../../../utils/getFrequencyFromSemitone'
import WhiteNoiseNode from '../../Utils/WhiteNoiseNode'
import { waveforms } from './constants'
import { Sound } from './types'

interface Params {
  audioCtx: AudioContext
  detune: number
  frequency: number
  harmonics: number[]
  harmonicsMixerNode: GainNode
  mixerNode: GainNode
  sounds: MutableRefObject<Sound[]>
  transpose: number
  volume: number
  waveform: number
  whiteNoiseNode: WhiteNoiseNode
}

export default function useControls({
  audioCtx,
  detune,
  frequency,
  harmonics,
  harmonicsMixerNode,
  mixerNode,
  sounds,
  transpose,
  volume,
  waveform,
  whiteNoiseNode,
}: Params) {
  // In all these effects `harmonics` needs to be included in the deps, in order to update
  // eventual new sounds when the harmonics change.

  useEffect(() => {
    if (waveforms[waveform] === 'noise') {
      whiteNoiseNode.connect(mixerNode)
    } else {
      harmonicsMixerNode.connect(mixerNode)
    }

    return () => {
      if (waveforms[waveform] === 'noise') {
        whiteNoiseNode.disconnect(mixerNode)
      } else {
        harmonicsMixerNode.disconnect(mixerNode)
      }
    }
  }, [harmonicsMixerNode, mixerNode, waveform, whiteNoiseNode])

  useEffect(() => {
    const type = waveforms[waveform]
    if (type !== 'noise') {
      sounds.current.forEach(({ oscillator }) => {
        oscillator.type = type
      })
    }
  }, [harmonics, sounds, waveform])

  useEffect(() => {
    sounds.current.forEach(({ oscillator }) => {
      oscillator.detune.setValueAtTime(detune, audioCtx.currentTime)
    })
  }, [audioCtx, detune, harmonics, sounds])

  useEffect(() => {
    mixerNode.gain.setValueAtTime(volume / 100, audioCtx.currentTime)
  }, [audioCtx, mixerNode, harmonics, volume])

  useEffect(() => {
    sounds.current.forEach(({ oscillator }, i) =>
      oscillator.frequency.setValueAtTime(
        getFrequencyFromSemitone(frequency, transpose) * (i + 1),
        audioCtx.currentTime,
      ),
    )
  }, [audioCtx, frequency, harmonics, sounds, transpose])
}
