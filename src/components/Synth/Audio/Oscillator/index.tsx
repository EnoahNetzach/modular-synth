import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import css from './index.module.css'
import GateNode from '../../../../utils/GateNode'
import getFrequencyFromSemitone from '../../../../utils/getFrequencyFromSemitone'
import JackPlug from '../../Utils/JackPlug'
import Oscilloscope from '../../Utils/Oscilloscope'
import Panel from '../../Utils/Panel'
import Preset from '../../Utils/Preset'
import Slider from '../../Utils/Slider'
import WhiteNoiseNode from './WhiteNoiseNode'

const waveforms: (OscillatorType | 'noise')[] = ['sine', 'triangle', 'square', 'sawtooth', 'noise']

interface Sound {
  gain: GainNode
  oscillator: OscillatorNode
}

interface Props {
  audioCtx: AudioContext
  deregisterAnimations: () => void
  frequency: number
  id: string
  registerAnimation: (cb: () => void) => void
}

export default function Oscillator({ audioCtx, deregisterAnimations, frequency, id, registerAnimation }: Props) {
  const [detune, setDetune] = useState(0)
  const [harmonics] = useState(Array.from({ length: 1 }).map((_, i) => 1 / (i + 2) ** 2))
  const [transpose, setTranspose] = useState(0)
  const [volume, setVolume] = useState(60)
  const [waveform, setWaveform] = useState(0)

  const sounds = useRef<Sound[]>([])

  const whiteNoiseNode = useMemo(() => new WhiteNoiseNode(audioCtx), [audioCtx])
  const harmonicsMixerNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const mixerNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const gatedNode = useMemo(() => new GainNode(audioCtx, { gain: 0 }), [audioCtx])
  const outputNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const inputGateNode = useMemo(
    () =>
      new GateNode(audioCtx, (value, time, cancelScheduled) => {
        if (cancelScheduled) {
          gatedNode.gain.cancelScheduledValues(0)
        }
        gatedNode.gain.linearRampToValueAtTime(value, time + 0.01)
      }),
    [audioCtx, gatedNode],
  )

  const startSound = useCallback(() => {
    sounds.current = harmonics.map((harmonicGain, i) => {
      const oscillator = new OscillatorNode(audioCtx)

      oscillator.start()

      const gain = new GainNode(audioCtx, { gain: harmonicGain })

      oscillator.connect(gain)
      gain.connect(harmonicsMixerNode)

      return { oscillator, gain }
    })

    harmonicsMixerNode.connect(mixerNode)
  }, [audioCtx, harmonics, harmonicsMixerNode, mixerNode])

  const stopSound = useCallback(() => {
    sounds.current.forEach(({ oscillator, gain }) => {
      oscillator.disconnect(gain)
      gain.disconnect(harmonicsMixerNode)
    })

    sounds.current = []

    try {
      harmonicsMixerNode.disconnect(mixerNode)
    } catch {}
    try {
      whiteNoiseNode.disconnect(mixerNode)
    } catch {}
  }, [harmonicsMixerNode, mixerNode, whiteNoiseNode])

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

  useEffect(() => {
    const type = waveforms[waveform]
    if (type === 'noise') {
      harmonicsMixerNode.disconnect(mixerNode)
      whiteNoiseNode.connect(mixerNode)

      return () => {
        whiteNoiseNode.disconnect(mixerNode)
        harmonicsMixerNode.connect(mixerNode)
      }
    }

    sounds.current.forEach(({ oscillator }) => {
      oscillator.type = type
    })
  }, [harmonicsMixerNode, mixerNode, waveform, whiteNoiseNode])

  useEffect(() => {
    sounds.current.forEach(({ oscillator }) => {
      oscillator.detune.setValueAtTime(detune, audioCtx.currentTime)
    })
  }, [audioCtx, detune])

  useEffect(() => {
    mixerNode.gain.setValueAtTime(volume / 100, audioCtx.currentTime)
  }, [audioCtx, mixerNode, volume])

  useEffect(() => {
    sounds.current.forEach(({ oscillator }, i) =>
      oscillator.frequency.setValueAtTime(
        getFrequencyFromSemitone(frequency, transpose) * (i + 1),
        audioCtx.currentTime,
      ),
    )
  }, [audioCtx, frequency, transpose])

  return (
    <Preset id={id}>
      <Panel>
        <div className={css.scope}>
          <Oscilloscope
            audioCtx={audioCtx}
            deregisterAnimations={deregisterAnimations}
            height={130}
            input={mixerNode}
            registerAnimation={registerAnimation}
            width={130}
          />
        </div>

        <div className={css.indicators}>
          <div>
            <span className={`${css.light} ${inputGateNode.getValue() > 0 ? css.on : ''}`} />
          </div>

          <div>{frequency.toFixed(2)} Hz</div>
        </div>

        <Slider
          label="Waveform"
          max={waveforms.length - 1}
          onChange={setWaveform}
          step={1}
          transformer={(value) => waveforms[value]}
          value={waveform}
        />

        <Slider
          defaultValue={0}
          label="Transpose"
          max={12}
          min={-12}
          onChange={setTranspose}
          step={1}
          unit="semi"
          value={transpose}
        />

        <Slider label="Detune" onChange={setDetune} unit="cents" value={detune} />

        <Slider defaultValue={0} label="Volume" onChange={setVolume} unit="%" value={volume} />

        <Preset id="IO">
          <div className={css.plugs}>
            <JackPlug output={inputGateNode} label="GIn" />

            <JackPlug input={outputNode} label="Out" />
          </div>
        </Preset>
      </Panel>
    </Preset>
  )
}
