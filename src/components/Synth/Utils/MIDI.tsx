import { createContext, Dispatch, PropsWithChildren, SetStateAction, useEffect, useMemo, useState } from 'react'
import MIDIInputParser, { MIDIEvent } from '../../../utils/MIDIInputParser'

export type CustomMIDIEvent<N extends MIDIEvent['name']> = {
  [T in MIDIEvent['name']]: CustomEvent<Omit<Extract<MIDIEvent, { name: T }>, 'name'>>
}[N]

interface MIDIEventTarget extends EventTarget {
  addEventListener<T extends MIDIEvent['name']>(type: T, callback: ((event: CustomMIDIEvent<T>) => void) | null): void
  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void

  dispatchEvent(event: CustomEvent<Omit<MIDIEvent, 'name'>>): boolean

  removeEventListener<T extends MIDIEvent['name']>(
    type: T,
    callback: ((event: CustomMIDIEvent<T>) => void) | null,
  ): void
  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void
}

export const MIDIContext = createContext<
  Omit<MIDIEventTarget, 'dispatchEvent'> &
    Pick<WebMidi.MIDIAccess, 'inputs' | 'outputs'> & {
      selectedMIDIInput: string
      setSelectedMIDIInput: Dispatch<SetStateAction<string>>
    }
>({
  addEventListener: () => {},
  inputs: new Map(),
  outputs: new Map(),
  removeEventListener: () => {},
  selectedMIDIInput: '',
  setSelectedMIDIInput: () => {},
})

export default function MIDI({ children }: PropsWithChildren) {
  const [midi, setMidi] = useState<WebMidi.MIDIAccess>()
  const [initialized, setInitialized] = useState(false)
  const [selectedMIDIInput, setSelectedMIDIInput] = useState<string>('')
  const midiInputParser = useMemo(() => new MIDIInputParser(), [])
  const midiEventTarget = useMemo(
    () => new (EventTarget as { new (): MIDIEventTarget; prototype: MIDIEventTarget })(),
    [],
  )

  useEffect(() => {
    if ('requestMIDIAccess' in navigator) {
      navigator.requestMIDIAccess().then(setMidi, (error) => console.error(`Failed to get MIDI access.\n${error}`))
    }
  }, [])

  useEffect(() => {
    if (midi && !initialized) {
      setInitialized(true)

      if (midi.inputs.size > 0) {
        setSelectedMIDIInput([...midi.inputs.keys()][0])
      }
    }
  }, [initialized, midi, selectedMIDIInput])

  useEffect(() => {
    if (midi) {
      function onMIDIStateChange(event: WebMidi.MIDIConnectionEvent) {
        setSelectedMIDIInput((prevState) => {
          if (midi && midi.inputs.size > 0 && !midi.inputs.has(prevState)) {
            return [...midi.inputs.keys()][0]
          }

          if ((!midi || midi.inputs.size === 0) && prevState !== '') {
            return ''
          }

          return prevState
        })
      }

      midi.addEventListener('statechange', onMIDIStateChange)

      return () => {
        midi.removeEventListener('statechange', onMIDIStateChange as EventListener)
      }
    }
  }, [midi])

  useEffect(() => {
    if (!midi || midi.inputs.size === 0 || !midi.inputs.has(selectedMIDIInput)) {
      return
    }

    function onMIDIMessage(event: WebMidi.MIDIMessageEvent) {
      midiInputParser
        .parse(event.data)
        .forEach(({ name, ...detail }) => midiEventTarget.dispatchEvent(new CustomEvent(name, { detail })))
    }

    const input = midi.inputs.get(selectedMIDIInput)
    input?.addEventListener('midimessage', onMIDIMessage)

    return () => {
      input?.removeEventListener('midimessage', onMIDIMessage as EventListener)
    }
  }, [midi, midiEventTarget, midiInputParser, selectedMIDIInput])

  const context = useMemo(() => {
    const { inputs = new Map(), outputs = new Map() } = midi ?? {}

    return {
      addEventListener: midiEventTarget.addEventListener.bind(midiEventTarget),
      inputs,
      outputs,
      removeEventListener: midiEventTarget.removeEventListener.bind(midiEventTarget),
      selectedMIDIInput,
      setSelectedMIDIInput,
    }
  }, [midi, midiEventTarget, selectedMIDIInput])

  return <MIDIContext.Provider value={context}>{children}</MIDIContext.Provider>
}
