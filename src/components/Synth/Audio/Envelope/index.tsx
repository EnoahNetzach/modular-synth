import { useEffect, useMemo, useRef, useState } from 'react'
import css from './index.module.css'
import GateNode from '../../../../utils/GateNode'
import JackPlug from '../../Utils/JackPlug'
import Panel from '../../Utils/Panel'
import Preset from '../../Utils/Preset'
import Slider from '../../Utils/Slider'

interface Props {
  audioCtx: AudioContext
  deregisterAnimations: () => void
  id: string
  registerAnimation: (cb: () => void) => void
}

export default function Envelope({ audioCtx, deregisterAnimations, id, registerAnimation }: Props) {
  const [attack, setAttack] = useState(0)
  const [decay, setDecay] = useState(0)
  const [release, setRelease] = useState(0)
  const [sustain, setSustain] = useState(100)

  const sustainTimeout = useRef(0)

  const outputGateNode = useMemo(() => new GateNode(audioCtx), [audioCtx])
  const inputGateNode = useMemo(() => new GateNode(audioCtx), [audioCtx])

  useEffect(() => {
    window.clearTimeout(sustainTimeout.current)
  }, [])

  useEffect(() => {
    inputGateNode.setCb((value, time, cancelScheduled) => {
      window.clearTimeout(sustainTimeout.current)

      const timeInMs = time * 1000

      if (value >= 0.5) {
        if (cancelScheduled) {
          outputGateNode.setValue(0, undefined, true)
        }

        outputGateNode.setValue(1, (timeInMs + attack) / 1000, !cancelScheduled)

        sustainTimeout.current = window.setTimeout(() => {
          outputGateNode.setValue(sustain / 100, (timeInMs + attack + decay) / 1000, false)
        }, attack)
      } else {
        outputGateNode.setValue(0, (timeInMs + release) / 1000, true)
      }
    })
  }, [attack, decay, inputGateNode, outputGateNode, release, sustain])

  return (
    <Preset id={id}>
      <Panel>
        <div className={css.indicators}>
          <div>
            <span className={`${css.light} ${inputGateNode.getValue() >= 0.5 ? css.on : ''}`} />
          </div>

          <div className={css.name}>Envelope</div>
        </div>

        <Slider
          defaultValue={0}
          label="Attack"
          max={10000}
          min={0}
          onChange={setAttack}
          step={0.1}
          unit="ms"
          value={attack}
        />

        <Slider
          defaultValue={0}
          label="Decay"
          max={10000}
          min={0}
          onChange={setDecay}
          step={0.1}
          unit="ms"
          value={decay}
        />

        <Slider defaultValue={100} label="Sustain" onChange={setSustain} unit="%" value={sustain} />

        <Slider
          defaultValue={0}
          label="Release"
          max={10000}
          min={0}
          onChange={setRelease}
          step={0.1}
          unit="ms"
          value={release}
        />

        <Preset id="IO">
          <div className={css.plugs}>
            <JackPlug output={inputGateNode} label="GIn" />

            <JackPlug input={outputGateNode} label="GOut" />
          </div>
        </Preset>
      </Panel>
    </Preset>
  )
}
