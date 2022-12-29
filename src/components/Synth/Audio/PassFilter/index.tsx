import { useEffect, useMemo, useState } from 'react'
import css from './index.module.css'
import JackPlug from '../../Utils/JackPlug'
import Oscilloscope from '../../Utils/Oscilloscope'
import Panel from '../../Utils/Panel'
import Preset from '../../Utils/Preset'
import Slider from '../../Utils/Slider'

const types: BiquadFilterType[] = ['lowpass', 'highpass', 'bandpass']

interface Props {
  audioCtx: AudioContext
  deregisterAnimations: () => void
  id: string
  registerAnimation: (cb: () => void) => void
}

export default function PassFilter({ audioCtx, deregisterAnimations, id, registerAnimation }: Props) {
  const [balance, setBalance] = useState(50)
  const [frequency, setFrequency] = useState(1000)
  const [q, setQ] = useState(20)
  const [type, setType] = useState(0)

  const inputNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const outputNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const filterNode = useMemo(() => new BiquadFilterNode(audioCtx), [audioCtx])
  const gainNode = useMemo(() => new GainNode(audioCtx, { gain: 0 }), [audioCtx])
  const passThoughNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const mixerNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const balanceInNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const negBalanceInNode = useMemo(() => new GainNode(audioCtx, { gain: -1 }), [audioCtx])

  useEffect(() => {
    inputNode.connect(filterNode)
    inputNode.connect(passThoughNode)
    filterNode.connect(gainNode)
    gainNode.connect(mixerNode)
    passThoughNode.connect(mixerNode)
    mixerNode.connect(outputNode)

    balanceInNode.connect(negBalanceInNode)
    balanceInNode.connect(gainNode.gain)
    negBalanceInNode.connect(passThoughNode.gain)

    return () => {
      inputNode.disconnect(filterNode)
      inputNode.disconnect(passThoughNode)
      filterNode.disconnect(gainNode)
      gainNode.disconnect(mixerNode)
      passThoughNode.disconnect(mixerNode)
      mixerNode.disconnect(outputNode)

      balanceInNode.disconnect(negBalanceInNode)
      balanceInNode.disconnect(gainNode.gain)
      negBalanceInNode.disconnect(passThoughNode.gain)
    }
  }, [balanceInNode, filterNode, gainNode, inputNode, mixerNode, negBalanceInNode, outputNode, passThoughNode])

  useEffect(() => {
    gainNode.gain.setValueAtTime(balance / 100, audioCtx.currentTime)
    passThoughNode.gain.setValueAtTime(1 - balance / 100, audioCtx.currentTime)
  }, [audioCtx, balance, gainNode, passThoughNode])

  useEffect(() => {
    filterNode.frequency.setValueAtTime(frequency, audioCtx.currentTime)
  }, [audioCtx, filterNode, frequency])

  useEffect(() => {
    filterNode.Q.setValueAtTime(q / 100, audioCtx.currentTime)
  }, [audioCtx, filterNode, q])

  useEffect(() => {
    filterNode.type = types[type]
  }, [filterNode, type])

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

        <div className={css.name}>Pass Filter</div>

        <Slider
          label="Type"
          max={types.length - 1}
          onChange={setType}
          step={1}
          transformer={(value) => types[value]}
          value={type}
        />

        <Slider
          control={filterNode.frequency}
          defaultValue={0}
          label="Frequency"
          max={10000}
          min={20}
          onChange={setFrequency}
          step={0.1}
          unit="Hz"
          value={frequency}
        />

        <Slider label="Q" onChange={setQ} value={q} />

        <Slider
          control={balanceInNode}
          defaultValue={50}
          label="Balance"
          onChange={setBalance}
          unit="%"
          value={balance}
        />

        <Preset id="IO">
          <div className={css.plugs}>
            <JackPlug output={inputNode} label="In" />

            <JackPlug input={outputNode} label="Out" />
          </div>
        </Preset>
      </Panel>
    </Preset>
  )
}
