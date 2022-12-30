import { MutableRefObject, useCallback, useEffect } from 'react'
import { Sound } from './types'

interface Params {
  audioCtx: AudioContext
  gatedNode: GainNode
  harmonics: number[]
  harmonicsMixerNode: GainNode
  mixerNode: GainNode
  outputNode: GainNode
  sounds: MutableRefObject<Sound[]>
}

export default function useSound({
  audioCtx,
  gatedNode,
  harmonics,
  harmonicsMixerNode,
  mixerNode,
  outputNode,
  sounds,
}: Params) {
  const startSound = useCallback(() => {
    sounds.current = harmonics.map((harmonicGain, i) => {
      const oscillator = new OscillatorNode(audioCtx)

      oscillator.start()

      const gain = new GainNode(audioCtx, { gain: harmonicGain })

      oscillator.connect(gain)
      gain.connect(harmonicsMixerNode)

      return { oscillator, gain }
    })
  }, [audioCtx, harmonics, harmonicsMixerNode, sounds])

  const stopSound = useCallback(() => {
    sounds.current.forEach(({ oscillator, gain }) => {
      oscillator.disconnect(gain)
      gain.disconnect(harmonicsMixerNode)
    })

    sounds.current = []
  }, [harmonicsMixerNode, sounds])

  useEffect(() => {
    startSound()
    mixerNode.connect(gatedNode)
    gatedNode.connect(outputNode)

    return () => {
      gatedNode.disconnect(outputNode)
      mixerNode.disconnect(gatedNode)
      stopSound()
    }
  }, [gatedNode, mixerNode, outputNode, startSound, stopSound])
}
