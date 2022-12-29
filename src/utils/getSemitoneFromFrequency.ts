export default function getSemitoneFromFrequency(base = 440, frequency = 440) {
  return Math.log2(frequency / base) * 12
}
