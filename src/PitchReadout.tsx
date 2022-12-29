interface Props {
  latestPitch: number
  running: boolean
}

export default function PitchReadout({ latestPitch, running }: Props) {
  return (
    <div className="Pitch-readout">
      {latestPitch ? `Latest pitch: ${latestPitch.toFixed(1)} Hz` : running ? 'Listening...' : 'Paused'}
    </div>
  )
}
