import { useEffect, useMemo, useState } from 'react'
import css from './index.module.css'
import JackPlug from '../../Utils/JackPlug'
import Oscilloscope from '../../Utils/Oscilloscope'
import Panel from '../../Utils/Panel'
import Preset from '../../Utils/Preset'
import Slider from '../../Utils/Slider'

interface Props {
  audioCtx: AudioContext
  deregisterAnimations: () => void
  id: string
  registerAnimation: (cb: () => void) => void
}

export default function Mixer({ audioCtx, deregisterAnimations, id, registerAnimation }: Props) {
  const [volume, setVolume] = useState(80)

  const inputNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const outputNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const gainNode = useMemo(() => new GainNode(audioCtx, { gain: 0 }), [audioCtx])

  useEffect(() => {
    inputNode.connect(gainNode).connect(outputNode)

    return () => {
      inputNode.disconnect(gainNode)
      gainNode.disconnect(outputNode)
    }
  }, [gainNode, inputNode, outputNode])

  useEffect(() => {
    gainNode.gain.setValueAtTime(volume / 100, audioCtx.currentTime)
  }, [audioCtx, gainNode, volume])

  return (
    <Preset id={id}>
      <Panel>
        <div className={css.scope}>
          <Oscilloscope
            audioCtx={audioCtx}
            deregisterAnimations={deregisterAnimations}
            height={130}
            input={outputNode}
            registerAnimation={registerAnimation}
            width={130}
          />
        </div>

        <div className={css.name}>Mixer</div>

        <Preset id="Volume">
          <Slider
            control={gainNode.gain}
            defaultValue={0}
            label="Volume"
            onChange={setVolume}
            unit="%"
            value={volume}
          />
        </Preset>

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
