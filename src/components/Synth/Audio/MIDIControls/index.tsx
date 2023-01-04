import { useContext, useEffect, useMemo, useState } from 'react'
import css from './index.module.css'
import GateNode from '../../../../utils/GateNode'
import JackPlug from '../../Utils/JackPlug'
import { CustomMIDIEvent, MIDIContext } from '../../Utils/MIDI'
import Panel from '../../Utils/Panel'
import Preset from '../../Utils/Preset'

interface Props {
  audioCtx: AudioContext
  id: string
}

export default function MIDIControls({ audioCtx, id }: Props) {
  const midi = useContext(MIDIContext)

  const [volume, setVolume] = useState(0)
  const [modulation, setModulation] = useState(0)
  const [breath, setBreath] = useState(0)
  const [pan, setPan] = useState(0)
  const [expression, setExpression] = useState(0)
  const [resonance, setResonance] = useState(0)
  const [frequencyCutoff, setFrequencyCutoff] = useState(0)
  const [portamento, setPortamento] = useState(0)

  const volumeNode = useMemo(() => new GateNode(audioCtx, setVolume), [audioCtx])
  const modulationNode = useMemo(() => new GateNode(audioCtx, setModulation), [audioCtx])
  const breathNode = useMemo(() => new GateNode(audioCtx, setBreath), [audioCtx])
  const panNode = useMemo(() => new GateNode(audioCtx, setPan), [audioCtx])
  const expressionNode = useMemo(() => new GateNode(audioCtx, setExpression), [audioCtx])
  const resonanceNode = useMemo(() => new GateNode(audioCtx, setResonance), [audioCtx])
  const frequencyCutoffNode = useMemo(() => new GateNode(audioCtx, setFrequencyCutoff), [audioCtx])
  const portamentoNode = useMemo(() => new GateNode(audioCtx, setPortamento), [audioCtx])

  useEffect(() => {
    function onCCValueChange(event: CustomMIDIEvent<'cc'>) {
      switch (event.detail.controller) {
        case 1: {
          modulationNode.setValue(event.detail.value / 127, audioCtx.currentTime, true)
          return
        }
        case 2: {
          breathNode.setValue(event.detail.value / 127, audioCtx.currentTime, true)
          return
        }
        case 5: {
          portamentoNode.setValue(event.detail.value / 127, audioCtx.currentTime, true)
          return
        }
        case 7: {
          volumeNode.setValue(event.detail.value / 127, audioCtx.currentTime, true)
          return
        }
        case 10: {
          const minValue = -((0.5 / 127) * 2 - 1)
          const maxValue = (127.5 / 127) * 2 - 1
          const value = ((event.detail.value + 0.5) / 127) * 2 - 1
          const centeredValue = value > 0 ? value / maxValue : value / minValue

          panNode.setValue(centeredValue, audioCtx.currentTime, true)
          return
        }
        case 11: {
          expressionNode.setValue(event.detail.value / 127, audioCtx.currentTime, true)
          return
        }
        case 71: {
          resonanceNode.setValue(event.detail.value / 127, audioCtx.currentTime, true)
          return
        }
        case 74: {
          frequencyCutoffNode.setValue(event.detail.value / 127, audioCtx.currentTime, true)
          return
        }
      }
    }

    midi.addEventListener('cc', onCCValueChange)

    return () => {
      midi.removeEventListener('cc', onCCValueChange)
    }
  }, [
    audioCtx,
    breathNode,
    expressionNode,
    frequencyCutoffNode,
    midi,
    modulationNode,
    panNode,
    portamentoNode,
    resonanceNode,
    volumeNode,
  ])

  return (
    <Preset id={id}>
      <Panel height={1} width={6}>
        <div className={css.controls}>
          <Preset id="CC">
            <JackPlug indicator={volume} indicatorType="absolute" input={volumeNode} label="Volume" />

            <JackPlug indicator={modulation} indicatorType="absolute" input={modulationNode} label="Modulation" />

            <JackPlug indicator={breath} indicatorType="absolute" input={breathNode} label="Breath" />

            <JackPlug indicator={pan} indicatorType="relative" input={panNode} label="Pan" />

            <JackPlug indicator={expression} indicatorType="absolute" input={expressionNode} label="Expression" />

            <JackPlug indicator={resonance} indicatorType="absolute" input={resonanceNode} label="Resonance" />

            <JackPlug
              indicator={frequencyCutoff}
              indicatorType="absolute"
              input={frequencyCutoffNode}
              label="FreqCutoff"
            />

            <JackPlug indicator={portamento} indicatorType="absolute" input={portamentoNode} label="Portamento" />
          </Preset>
        </div>
      </Panel>
    </Preset>
  )
}
