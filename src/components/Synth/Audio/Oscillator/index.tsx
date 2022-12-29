import { useCallback, useMemo, useRef, useState } from 'react'
import css from './index.module.css'
import GateNode from '../../../../utils/GateNode'
import JackPlug from '../../Utils/JackPlug'
import Oscilloscope from '../../Utils/Oscilloscope'
import Panel from '../../Utils/Panel'
import Preset from '../../Utils/Preset'
import Slider from '../../Utils/Slider'
import WhiteNoiseNode from '../../Utils/WhiteNoiseNode'
import { waveforms } from './constants'
import type { Sound } from './types'
import useControls from './useControls'
import useMIDIPitchBend from './useMIDIPitchBend'
import useSound from './useSound'

function calcHarmonics(count: number) {
  return Array.from({ length: count }).map((_, i) => 1 / (i + 2) ** 2)
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
  const [harmonics, setHarmonicsRaw] = useState(() => calcHarmonics(1))
  const [transpose, setTranspose] = useState(0)
  const [volume, setVolume] = useState(60)
  const [waveform, setWaveform] = useState(0)

  const setHarmonics = useCallback((count: number) => setHarmonicsRaw(calcHarmonics(count)), [])

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

  useSound({
    audioCtx,
    gatedNode,
    harmonics,
    harmonicsMixerNode,
    mixerNode,
    outputNode,
    sounds,
  })

  useControls({
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
  })

  useMIDIPitchBend({ audioCtx, detune, range: 200, sounds })

  return (
    <Preset id={id}>
      <Panel>
        <div className={css.scope}>
          <Oscilloscope
            audioCtx={audioCtx}
            deregisterAnimations={deregisterAnimations}
            height={130}
            input={gatedNode}
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

        <Slider label="Harmonics" max={16} min={1} onChange={setHarmonics} step={1} value={harmonics.length} />

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
