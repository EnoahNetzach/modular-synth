import { useEffect, useMemo, useState } from 'react'
import css from './index.module.css'
import JackPlug from '../../Utils/JackPlug'
import Oscilloscope from '../../Utils/Oscilloscope'
import Panel from '../../Utils/Panel'
import Preset from '../../Utils/Preset'
import Slider from '../../Utils/Slider'

const waveforms: OscillatorType[] = ['sine', 'triangle', 'square']

interface Props {
  audioCtx: AudioContext
  deregisterAnimations: () => void
  id: string
  registerAnimation: (cb: () => void) => void
}

export default function LFO({ audioCtx, deregisterAnimations, id, registerAnimation }: Props) {
  const [frequency, setFrequency] = useState(3)
  const [range, setRange] = useState(1)
  const [waveform, setWaveform] = useState(0)

  const oscillator = useMemo(() => {
    const node = new OscillatorNode(audioCtx)
    node.start()
    return node
  }, [audioCtx])
  const gainNode = useMemo(() => new GainNode(audioCtx), [audioCtx])
  const outputNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])

  useEffect(() => {
    oscillator.connect(gainNode)
    gainNode.connect(outputNode)

    return () => {
      oscillator.disconnect(gainNode)
      gainNode.disconnect(outputNode)
    }
  }, [gainNode, oscillator, outputNode])

  useEffect(() => {
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime)
  }, [audioCtx, frequency, oscillator])

  useEffect(() => {
    gainNode.gain.setValueAtTime(range, audioCtx.currentTime)
  }, [audioCtx, gainNode, range])

  useEffect(() => {
    oscillator.type = waveforms[waveform]
  }, [oscillator, waveform])

  return (
    <Preset id={id}>
      <Panel>
        <div className={css.scope}>
          <Oscilloscope
            audioCtx={audioCtx}
            deregisterAnimations={deregisterAnimations}
            height={130}
            input={gainNode}
            registerAnimation={registerAnimation}
            scale={range}
            width={130}
          />
        </div>

        <div className={css.name}>LFO</div>

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
          label="Frequency"
          max={2000}
          min={1}
          onChange={(value) => setFrequency(value / 100)}
          unit="Hz"
          transformer={(value) => (value / 100).toFixed(2)}
          value={frequency * 100}
        />

        <Slider
          defaultValue={0}
          editable
          label="Range"
          max={10000}
          min={0}
          onChange={setRange}
          precision={2}
          unit="±"
          value={range}
        />

        <Preset id="IO">
          <JackPlug input={outputNode} label="Out" />
        </Preset>
      </Panel>
    </Preset>
  )
}
