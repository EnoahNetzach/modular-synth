import notes from './notes'

export default semitones => [notes[semitones > 0 ? semitones % 12 : (12 + (semitones % 12)) % 12]]
