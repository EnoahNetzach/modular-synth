import { useEffect, useMemo, useState } from 'react'
import css from './index.module.css'
import JackPlug from '../../Utils/JackPlug'
import Oscilloscope from '../../Utils/Oscilloscope'
import Panel from '../../Utils/Panel'
import Preset from '../../Utils/Preset'
import Slider from '../../Utils/Slider'
import LowpassCombFilterNode from './LowpassCombFilterNode'

const combFilterTunings = [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116]
const allPassFrequencies = [225, 556, 441, 341]

interface Props {
  audioCtx: AudioContext
  deregisterAnimations: () => void
  id: string
  registerAnimation: (cb: () => void) => void
}

export default function Reverb({ audioCtx, deregisterAnimations, id, registerAnimation }: Props) {
  const [balance, setBalance] = useState(50)
  const [delay, setDelay] = useState(100)
  const [resonance, setResonance] = useState(20)

  const inputNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const outputNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])

  const splitterNode = useMemo(() => new ChannelSplitterNode(audioCtx), [audioCtx])
  const combFilterNodes = useMemo(
    () => ({
      left: combFilterTunings.slice(0, 4).map(
        (delayPerSecond, i) =>
          new LowpassCombFilterNode(audioCtx, {
            delayTime: delayPerSecond / audioCtx.sampleRate,
          }),
      ),
      right: combFilterTunings.slice(4).map(
        (delayPerSecond, i) =>
          new LowpassCombFilterNode(audioCtx, {
            delayTime: delayPerSecond / audioCtx.sampleRate,
          }),
      ),
    }),
    [audioCtx],
  )
  const mergerNode = useMemo(() => new ChannelMergerNode(audioCtx), [audioCtx])
  const allPassFilterNodes = useMemo(
    () => allPassFrequencies.map((frequency) => new BiquadFilterNode(audioCtx, { type: 'allpass', frequency })),
    [audioCtx],
  )

  const gainNode = useMemo(() => new GainNode(audioCtx, { gain: 0 }), [audioCtx])
  const passThoughNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const mixerNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const balanceInNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const negBalanceInNode = useMemo(() => new GainNode(audioCtx, { gain: -1 }), [audioCtx])

  useEffect(() => {
    inputNode.connect(passThoughNode).connect(mixerNode)

    inputNode.connect(splitterNode)
    combFilterNodes.left.map((combFilterNode) => combFilterNode.connectInput(splitterNode, 0).connect(mergerNode, 0, 0))
    combFilterNodes.right.map((combFilterNode) =>
      combFilterNode.connectInput(splitterNode, 1).connect(mergerNode, 0, 1),
    )
    allPassFilterNodes
      .reduce((node, allPassFilterNode) => node.connect(allPassFilterNode), mergerNode)
      .connect(gainNode)
      .connect(mixerNode)

    mixerNode.connect(outputNode)

    balanceInNode.connect(negBalanceInNode)
    balanceInNode.connect(gainNode.gain)
    negBalanceInNode.connect(passThoughNode.gain)

    return () => {
      inputNode.disconnect(passThoughNode)
      passThoughNode.disconnect(mixerNode)

      inputNode.disconnect(splitterNode)
      combFilterNodes.left.forEach((combFilterNode) => {
        combFilterNode.disconnectInput()
        combFilterNode.disconnect(splitterNode, 0, 0)
      })
      combFilterNodes.right.forEach((combFilterNode) => {
        combFilterNode.disconnectInput()
        combFilterNode.disconnect(splitterNode, 0, 1)
      })
      allPassFilterNodes
        .reduce((node, allPassFilterNode) => {
          node.disconnect(allPassFilterNode)
          return allPassFilterNode
        }, mergerNode)
        .disconnect(gainNode)
      gainNode.disconnect(mixerNode)

      mixerNode.disconnect(outputNode)

      balanceInNode.disconnect(negBalanceInNode)
      balanceInNode.disconnect(gainNode.gain)
      negBalanceInNode.disconnect(passThoughNode.gain)
    }
  }, [
    allPassFilterNodes,
    balanceInNode,
    combFilterNodes,
    gainNode,
    inputNode,
    mergerNode,
    mixerNode,
    negBalanceInNode,
    outputNode,
    passThoughNode,
    splitterNode,
  ])

  useEffect(() => {
    gainNode.gain.setValueAtTime(balance / 100, audioCtx.currentTime)
    passThoughNode.gain.setValueAtTime(1 - balance / 100, audioCtx.currentTime)
  }, [audioCtx, balance, gainNode, passThoughNode])

  useEffect(() => {
    combFilterNodes.left.map((combFilterNode) =>
      combFilterNode.delayTime.setValueAtTime(delay / 1000, audioCtx.currentTime),
    )
    combFilterNodes.right.map((combFilterNode) =>
      combFilterNode.delayTime.setValueAtTime(delay / 1000, audioCtx.currentTime),
    )
  }, [audioCtx, combFilterNodes, delay])

  useEffect(() => {
    combFilterNodes.left.map((combFilterNode) =>
      combFilterNode.resonance.setValueAtTime(resonance / 550, audioCtx.currentTime),
    )
    combFilterNodes.right.map((combFilterNode) =>
      combFilterNode.resonance.setValueAtTime(resonance / 550, audioCtx.currentTime),
    )
  }, [audioCtx, combFilterNodes, resonance])

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

        <div className={css.name}>Reverb</div>

        <Slider label="Delay" max={500} onChange={setDelay} step={1} unit="ms" value={delay} />

        <Slider label="Resonance" max={100} min={0} onChange={setResonance} unit="%" value={resonance} />

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
