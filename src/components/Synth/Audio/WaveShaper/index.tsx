import { useEffect, useMemo, useState } from 'react'
import css from './index.module.css'
import JackPlug from '../../Utils/JackPlug'
import Oscilloscope from '../../Utils/Oscilloscope'
import Panel from '../../Utils/Panel'
import Preset from '../../Utils/Preset'
import Slider from '../../Utils/Slider'

const oversamples: OverSampleType[] = ['none', '2x', '4x']

const deg = Math.PI / 180
function makeDistortionCurve(amount?: number, samples = 44100) {
  const k = typeof amount === 'number' ? amount : 50
  return new Float32Array(
    Array.from({ length: samples }).map((_, i) => {
      const x = (i * 2) / samples - 1

      return ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x))
    }),
  )
}

interface Props {
  audioCtx: AudioContext
  deregisterAnimations: () => void
  id: string
  registerAnimation: (cb: () => void) => void
}

export default function WaveShaper({ audioCtx, deregisterAnimations, id, registerAnimation }: Props) {
  const [balance, setBalance] = useState(50)
  const [amount, setAmount] = useState(50)
  const [oversample, setOversample] = useState(0)
  const [volume, setVolume] = useState(20)

  const inputNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const outputNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const shaperNode = useMemo(() => new WaveShaperNode(audioCtx), [audioCtx])
  const volumeNode = useMemo(() => new GainNode(audioCtx, { gain: 0 }), [audioCtx])
  const gainNode = useMemo(() => new GainNode(audioCtx, { gain: 0 }), [audioCtx])
  const passThoughNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const mixerNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const balanceInNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const negBalanceInNode = useMemo(() => new GainNode(audioCtx, { gain: -1 }), [audioCtx])

  useEffect(() => {
    inputNode.connect(shaperNode)
    inputNode.connect(passThoughNode)
    shaperNode.connect(volumeNode)
    volumeNode.connect(gainNode)
    gainNode.connect(mixerNode)
    passThoughNode.connect(mixerNode)
    mixerNode.connect(outputNode)

    balanceInNode.connect(negBalanceInNode)
    balanceInNode.connect(gainNode.gain)
    negBalanceInNode.connect(passThoughNode.gain)

    return () => {
      inputNode.disconnect(shaperNode)
      inputNode.disconnect(passThoughNode)
      shaperNode.disconnect(volumeNode)
      volumeNode.disconnect(gainNode)
      gainNode.disconnect(mixerNode)
      passThoughNode.disconnect(mixerNode)
      mixerNode.disconnect(outputNode)

      balanceInNode.disconnect(negBalanceInNode)
      balanceInNode.disconnect(gainNode.gain)
      negBalanceInNode.disconnect(passThoughNode.gain)
    }
  }, [
    balanceInNode,
    gainNode,
    inputNode,
    mixerNode,
    negBalanceInNode,
    outputNode,
    passThoughNode,
    shaperNode,
    volumeNode,
  ])

  useEffect(() => {
    gainNode.gain.setValueAtTime(balance / 100, audioCtx.currentTime)
    passThoughNode.gain.setValueAtTime(1 - balance / 100, audioCtx.currentTime)
  }, [audioCtx, balance, gainNode, passThoughNode])

  useEffect(() => {
    shaperNode.curve = makeDistortionCurve(Number.parseFloat(amount.toString()), audioCtx.sampleRate)
  }, [amount, audioCtx.sampleRate, shaperNode])

  useEffect(() => {
    shaperNode.oversample = oversamples[oversample]
  }, [oversample, shaperNode])

  useEffect(() => {
    volumeNode.gain.setValueAtTime(volume / 100, audioCtx.currentTime)
  }, [audioCtx, oversample, shaperNode, volume, volumeNode])

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

        <div className={css.name}>Wave Shaper</div>

        <Slider
          label="Oversample"
          max={oversamples.length - 1}
          onChange={setOversample}
          step={1}
          transformer={(value) => oversamples[value]}
          value={oversample}
        />

        <Slider editable label="Amount" max={500} min={0} onChange={setAmount} value={amount} />

        <Slider defaultValue={0} label="Volume" onChange={setVolume} unit="%" value={volume} />

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
