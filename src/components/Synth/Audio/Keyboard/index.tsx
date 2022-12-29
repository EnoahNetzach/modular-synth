import { useCallback, useMemo, useRef, useState } from 'react'
import css from './index.module.css'
import GateNode from '../../../../utils/GateNode'
import getFrequencyFromSemitone from '../../../../utils/getFrequencyFromSemitone'
import getNoteFromSemitone from '../../../../utils/getNoteFromSemitone'
import JackPlug from '../../Utils/JackPlug'
import Panel from '../../Utils/Panel'
import Preset from '../../Utils/Preset'
import Slider from '../../Utils/Slider'
import { types } from './constants'
import { Oscillator } from './types'
import useFrequency from './useFrequency'
import useKeyListeners from './useKeyListeners'
import useMIDIKeyboard from './useMIDIKeyboard'
import useNote from './useNote'

interface Props {
  audioCtx: AudioContext
  id: string
  oscillators: Oscillator[]
  setOscillators: (cb: (oscillators: Oscillator[]) => Oscillator[]) => void
}

export default function Keyboard({ audioCtx, id, oscillators, setOscillators }: Props) {
  const [type, setTypeRaw] = useState(0)

  const pressedSemitones = useRef<{ [key: string]: number }>({})
  const gateNode = useMemo(() => new GateNode(audioCtx), [audioCtx])

  const { startFrequency, stopFrequency } = useFrequency({ setOscillators, type })
  const { onRelease, startNote, stopNote } = useNote({
    gateNode,
    pressedSemitones,
    startFrequency,
    stopFrequency,
    type,
  })

  const setType = useCallback(
    (newType: typeof type) => {
      onRelease()
      setTypeRaw(newType)
    },
    [onRelease],
  )

  useKeyListeners({
    onRelease,
    startNote,
    stopNote,
  })

  const { midi, selectedMIDIInput, setSelectedMIDIInput } = useMIDIKeyboard({ startNote, stopNote })

  return (
    <Preset id={id}>
      <Panel height={1} width={4}>
        <div className={css.controls}>
          <Slider
            label="Type"
            max={types.length - 1}
            onChange={setType}
            step={1}
            transformer={(value) => types[value]}
            value={type}
          />

          {(midi?.inputs.size ?? 0) > 0 ? (
            <div className={css.midi}>
              <div className={css.label}>MIDI input</div>

              <select onChange={(event) => setSelectedMIDIInput(event.target.value)} value={selectedMIDIInput}>
                <option>-</option>
                {[...(midi?.inputs.values() ?? [])].map((input) => (
                  <option key={input.id} value={input.id}>
                    {input.manufacturer} - {input.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <Preset id="IO">
            <JackPlug input={gateNode} label="GOut" />
          </Preset>
        </div>

        <div className={css.keyboard}>
          {Array.from({ length: 25 }).map((v, i) => {
            const semitone = i - 12
            const note = getNoteFromSemitone(semitone)
            const frequency = getFrequencyFromSemitone(440, semitone)
            const inUse = oscillators.find((oscillator) => oscillator.active && oscillator.frequency === frequency)

            return (
              <div key={frequency}>
                <button
                  className={css.key}
                  onClick={() => (inUse ? stopNote(semitone) : startNote(semitone))}
                  style={{ color: inUse ? 'red' : undefined }}
                >
                  {note}
                </button>
              </div>
            )
          })}
        </div>

        <div>
          <button className={css.key} onClick={onRelease}>
            Release
          </button>
        </div>
      </Panel>
    </Preset>
  )
}
