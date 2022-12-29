import notes from './notes'

export default function getNoteFromSemitone(semitones: number) {
  return [notes[semitones > 0 ? semitones % 12 : (12 + (semitones % 12)) % 12]]
}
