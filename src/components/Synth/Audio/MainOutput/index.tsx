import { useEffect, useMemo, useRef, useState } from 'react'
import css from './index.module.css'
import JackPlug from '../../Utils/JackPlug'
import Oscilloscope from '../../Utils/Oscilloscope'
import Panel from '../../Utils/Panel'
import Preset from '../../Utils/Preset'
import Slider from '../../Utils/Slider'
import Spectroscope from '../../Utils/Spectroscope'

interface Props {
  audioCtx: AudioContext
  deregisterAnimations: () => void
  id: string
  registerAnimation: (cb: () => void) => void
}

export default function MainOutput({
  audioCtx,
  deregisterAnimations: deregisterAnimationsInitial,
  id,
  registerAnimation,
}: Props) {
  const deregisterAnimations = useRef(deregisterAnimationsInitial)

  const [mute, setMute] = useState(true)
  const [volume, setVolume] = useState(80)

  const inputNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const outputNode = useMemo(() => new GainNode(audioCtx, { gain: 1 }), [audioCtx])
  const mainVolumeNode = useMemo(() => new GainNode(audioCtx, { gain: 0 }), [audioCtx])

  useEffect(() => {
    inputNode.connect(mainVolumeNode)
    outputNode.connect(audioCtx.destination)

    setMute(false)

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      deregisterAnimations.current()

      outputNode.disconnect(audioCtx.destination)
      inputNode.disconnect(mainVolumeNode)
    }
  }, [audioCtx, inputNode, mainVolumeNode, outputNode])

  useEffect(() => {
    try {
      if (!mute) {
        mainVolumeNode.connect(outputNode)
      } else {
        mainVolumeNode.disconnect(outputNode)
      }
    } catch {}
  }, [mainVolumeNode, mute, outputNode])

  useEffect(() => {
    mainVolumeNode.gain.setValueAtTime(volume / 100, audioCtx.currentTime)
  }, [audioCtx, mainVolumeNode, volume])

  return (
    <Preset id={id}>
      <Panel height={2} width={4}>
        <div className={css.scopes}>
          <Oscilloscope
            audioCtx={audioCtx}
            deregisterAnimations={deregisterAnimations.current}
            height={200}
            input={outputNode}
            registerAnimation={registerAnimation}
            width={300}
          />

          <Spectroscope
            audioCtx={audioCtx}
            deregisterAnimations={deregisterAnimations.current}
            height={200}
            input={outputNode}
            registerAnimation={registerAnimation}
            width={300}
          />
        </div>

        <div className={css.mute}>
          <button onClick={() => setMute(!mute)}>{!mute ? 'Mute' : 'Unmute'}</button>
        </div>

        <Slider defaultValue={0} label="Volume" onChange={setVolume} unit="%" value={volume} />

        <Preset id="IO">
          <JackPlug output={inputNode} label="In" />
        </Preset>
      </Panel>
    </Preset>
  )
}
