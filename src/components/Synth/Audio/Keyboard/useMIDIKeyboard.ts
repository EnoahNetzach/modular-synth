import { useContext, useEffect } from 'react'
import { CustomMIDIEvent, MIDIContext } from '../../Utils/MIDI'

type noteCb = (semitone: number) => void

interface Params {
  startNote: noteCb
  stopNote: noteCb
}

export default function useMIDIKeyboard({ startNote, stopNote }: Params) {
  const midi = useContext(MIDIContext)

  useEffect(() => {
    function onNoteOn(event: CustomMIDIEvent<'noteon'>) {
      const semitone = event.detail.note - 69
      startNote(semitone)
    }
    function onNoteOff(event: CustomMIDIEvent<'noteoff'>) {
      const semitone = event.detail.note - 69
      stopNote(semitone)
    }

    midi.addEventListener('noteon', onNoteOn)
    midi.addEventListener('noteoff', onNoteOff)

    return () => {
      midi.removeEventListener('noteon', onNoteOn)
      midi.removeEventListener('noteoff', onNoteOff)
    }
  }, [midi, startNote, stopNote])

  return {
    midi,
    selectedMIDIInput: midi.selectedMIDIInput,
    setSelectedMIDIInput: midi.setSelectedMIDIInput,
  }
}
