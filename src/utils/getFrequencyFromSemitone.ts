export default function getFrequencyFromSemitone(base = 440, semitones = 0) {
  return base * 2 ** (semitones / 12)
}
