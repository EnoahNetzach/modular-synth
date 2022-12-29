import { useState } from 'react'
import PitchReadout from './PitchReadout'
import { setupAudio } from './setupAudio'

export default function AudioRecorderControl() {
  // Ensure the latest state of the audio module is reflected in the UI
  // by defining some variables (and a setter function for updating them)
  // that are managed by React, passing their initial values to useState.

  // 1. audio is the object returned from the initial audio setup that
  //    will be used to start/stop the audio based on user input. While
  //    this is initialized once in our simple application, it is good
  //    practice to let React know about any state that _could_ change
  //    again.
  const [audio, setAudio] = useState<{ context: AudioContext; node: AudioNode }>()

  // 2. running holds whether the application is currently recording and
  //    processing audio and is used to provide button text (Start vs Stop).
  const [running, setRunning] = useState(false)

  // 3. latestPitch holds the latest detected pitch to be displayed in
  //    the UI.
  const [latestPitch, setLatestPitch] = useState<number>(0)

  // Initial state. Initialize the web audio once a user gesture on the page
  // has been registered.
  if (!audio) {
    return (
      <button
        onClick={async () => {
          setAudio(await setupAudio(setLatestPitch))
          setRunning(true)
        }}
      >
        Start listening
      </button>
    )
  }

  // Audio already initialized. Suspend / resume based on its current state.
  const { context } = audio
  return (
    <div>
      <button
        onClick={async () => {
          if (running) {
            await context.suspend()
            setRunning(context.state === 'running')
          } else {
            await context.resume()
            setRunning(context.state === 'running')
          }
        }}
        disabled={context.state !== 'running' && context.state !== 'suspended'}
      >
        {running ? 'Pause' : 'Resume'}
      </button>

      <PitchReadout running={running} latestPitch={latestPitch} />
    </div>
  )
}
