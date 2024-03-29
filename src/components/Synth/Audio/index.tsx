import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import css from './index.module.css'
import Connector from '../Utils/Connector'
import MIDI from '../Utils/MIDI'
import Preset from '../Utils/Preset'
import Envelope from './Envelope'
import Keyboard from './Keyboard'
import { Oscillator as OscillatorDesc } from './Keyboard/types'
import LFO from './LFO'
import MIDIControls from './MIDIControls'
import MainOutput from './MainOutput'
import Mixer from './Mixer'
import Oscillator from './Oscillator'
import PassFilter from './PassFilter'
import Reverb from './Reverb'
import WaveShaper from './WaveShaper'
import useAudioWorkletsLoader from './useAudioWorkletsLoader'

export default function Audio() {
  const [envelopes] = useState(() =>
    Array.from({ length: 2 }).map((_, i) => ({
      id: `envelopes[${i}]`,
    })),
  )
  const [lfos] = useState(() =>
    Array.from({ length: 1 }).map((_, i) => ({
      id: `lfos[${i}]`,
    })),
  )
  const [mixers] = useState(() =>
    Array.from({ length: 2 }).map((_, i) => ({
      id: `mixers[${i}]`,
    })),
  )
  const [oscillators, setOscillators] = useState<OscillatorDesc[]>(() =>
    Array.from({ length: 6 }).map((_, i) => ({
      frequency: 440,
      id: `oscillators[${i}]`,
      started: 0,
      active: false,
    })),
  )
  const [reverbs] = useState(() =>
    Array.from({ length: 1 }).map((_, i) => ({
      id: `reverbs[${i}]`,
    })),
  )
  const [passFilters] = useState(() =>
    Array.from({ length: 1 }).map((_, i) => ({
      id: `passFilters[${i}]`,
    })),
  )
  const [waveShapers] = useState(() =>
    Array.from({ length: 1 }).map((_, i) => ({
      id: `waveShapers[${i}]`,
    })),
  )

  const animations = useRef<{ [id: string]: (() => void)[] }>({})
  const animation = useRef<number>(-1)

  const audioCtx = useMemo(() => new window.AudioContext(), [])

  const workletsLoaded = useAudioWorkletsLoader({ audioCtx })

  const registerAnimation = useCallback((id: string, animation: () => void) => {
    if (!animations.current[id]) {
      animations.current[id] = []
    }

    animations.current[id].push(animation)
  }, [])

  const deregisterAnimations = useCallback((id: string) => {
    delete animations.current[id]
  }, [])

  const draw = useCallback(() => {
    Object.values(animations.current).forEach((group) => group.forEach((animation) => animation()))

    animation.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    animation.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animation.current)
    }
  }, [draw])

  return (
    <div className={css.grid}>
      <div className={css.rack} />

      <MIDI>
        {!workletsLoaded ? null : (
          <Preset
            // defaultConnections={[
            //   ['keyboard.IO.GOut', 'oscillators[0].IO.GIn'],
            //   ['oscillators[0].IO.Out', 'mixers[0].IO.In'],
            //   ['mixers[0].IO.Out', 'mainOutput.IO.In'],
            // ]}
            // defaultParams={[]}
            defaultConnections={[
              ['keyboard.IO.GOut', 'envelopes[0].IO.GIn'],
              ['envelopes[0].IO.GOut', 'oscillators[0].IO.GIn'],
              ['keyboard.IO.GOut', 'oscillators[1].IO.GIn'],
              ['keyboard.IO.GOut', 'oscillators[2].IO.GIn'],
              ['keyboard.IO.GOut', 'oscillators[3].IO.GIn'],
              ['oscillators[0].IO.Out', 'mixers[0].IO.In'],
              ['oscillators[1].IO.Out', 'mixers[0].IO.In'],
              ['oscillators[2].IO.Out', 'mixers[0].IO.In'],
              ['oscillators[3].IO.Out', 'passFilters[0].IO.In'],
              ['lfos[0].IO.Out', 'passFilters[0].Frequency.In'],
              ['passFilters[0].IO.Out', 'mixers[0].IO.In'],
              ['mixers[0].IO.Out', 'reverbs[0].IO.In'],
              ['reverbs[0].IO.Out', 'mainOutput.IO.In'],
              ['midiControls.CC.Volume', 'mainOutput.Volume.GIn'],
              ['midiControls.CC.Pan', 'mainOutput.Pan.GIn'],
            ]}
            defaultParams={[
              ['keyboard.Type', [1]],
              ['oscillators[0].Waveform', [3]],
              ['oscillators[1].Waveform', [1]],
              ['oscillators[1].Harmonics', [16]],
              ['oscillators[1].Transpose', [-12]],
              ['oscillators[1].Volume', [40]],
              ['oscillators[2].Transpose', [12]],
              ['oscillators[2].Volume', [15]],
              ['oscillators[3].Waveform', [4]],
              ['oscillators[3].Volume', [10]],
              ['envelopes[0].Attack', [100]],
              ['envelopes[0].Decay', [150]],
              ['envelopes[0].Sustain', [0]],
              ['envelopes[0].Release', [0]],
              ['lfos[0].Waveform', [2]],
              ['lfos[0].Frequency', [2000]],
              ['lfos[0].Range', [60]],
              ['reverbs[0].Delay', [350]],
              ['reverbs[0].Resonance', [60]],
              ['reverbs[0].Balance', [100]],
              ['passFilters[0].Frequency', [350]],
              ['passFilters[0].Balance', [100]],
            ]}
            id=""
          >
            <Connector>
              {oscillators.map(({ frequency, id }) => (
                <Oscillator
                  audioCtx={audioCtx}
                  deregisterAnimations={() => deregisterAnimations(id)}
                  frequency={frequency}
                  id={id}
                  key={id}
                  registerAnimation={(animation) => registerAnimation(id, animation)}
                />
              ))}

              {lfos.map(({ id }) => (
                <LFO
                  audioCtx={audioCtx}
                  deregisterAnimations={() => deregisterAnimations(id)}
                  id={id}
                  key={id}
                  registerAnimation={(animation) => registerAnimation(id, animation)}
                />
              ))}

              {envelopes.map(({ id }) => (
                <Envelope
                  audioCtx={audioCtx}
                  deregisterAnimations={() => deregisterAnimations(id)}
                  id={id}
                  key={id}
                  registerAnimation={(animation) => registerAnimation(id, animation)}
                />
              ))}

              {reverbs.map(({ id }) => (
                <Reverb
                  audioCtx={audioCtx}
                  deregisterAnimations={() => deregisterAnimations(id)}
                  id={id}
                  key={id}
                  registerAnimation={(animation) => registerAnimation(id, animation)}
                />
              ))}

              {passFilters.map(({ id }) => (
                <PassFilter
                  audioCtx={audioCtx}
                  deregisterAnimations={() => deregisterAnimations(id)}
                  id={id}
                  key={id}
                  registerAnimation={(animation) => registerAnimation(id, animation)}
                />
              ))}

              {waveShapers.map(({ id }) => (
                <WaveShaper
                  audioCtx={audioCtx}
                  deregisterAnimations={() => deregisterAnimations(id)}
                  id={id}
                  key={id}
                  registerAnimation={(animation) => registerAnimation(id, animation)}
                />
              ))}

              {mixers.map(({ id }) => (
                <Mixer
                  audioCtx={audioCtx}
                  deregisterAnimations={() => deregisterAnimations(id)}
                  id={id}
                  key={id}
                  registerAnimation={(animation) => registerAnimation(id, animation)}
                />
              ))}

              <MainOutput
                audioCtx={audioCtx}
                deregisterAnimations={() => deregisterAnimations('mainOutput')}
                id="mainOutput"
                registerAnimation={(animation) => registerAnimation('mainOutput', animation)}
              />

              <Keyboard audioCtx={audioCtx} id="keyboard" oscillators={oscillators} setOscillators={setOscillators} />

              <MIDIControls audioCtx={audioCtx} id="midiControls" />
            </Connector>
          </Preset>
        )}
      </MIDI>
    </div>
  )
}
