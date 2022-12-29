/* eslint-disable import/no-webpack-loader-syntax */
import wasmSrc from 'wasm-audio/wasm_audio_bg.wasm'
import processorUrl from 'worklet-loader!~/audioWorklets/PitchProcessor'
import PitchNode from './PitchNode'
import type { PitchProcessorCb } from './audioWorklets/PitchProcessor/callbackType'

async function getWebAudioMediaStream() {
  if (!window.navigator.mediaDevices) {
    throw new Error('This browser does not support web audio or it is not enabled.')
  }

  try {
    return await window.navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    })
  } catch (error: any) {
    switch (error.name) {
      case 'NotAllowedError':
        throw new Error(
          'A recording device was found but has been disallowed for this application. Enable the device in the browser settings.',
        )

      case 'NotFoundError':
        throw new Error('No recording device was found. Please attach a microphone and click Retry.')

      default:
        throw error
    }
  }
}

export async function setupAudio(onPitchDetectedCallback: PitchProcessorCb) {
  // Get the browser audio. Awaits user "allowing" it for the current tab.
  const mediaStream = await getWebAudioMediaStream()

  const context = new window.AudioContext()
  const audioSource = context.createMediaStreamSource(mediaStream)

  try {
    // Fetch the WebAssembly module that performs pitch detection.
    const response = await window.fetch(wasmSrc as any as string)
    const wasmBytes = await response.arrayBuffer()

    // Add our audio processor worklet to the context.
    try {
      await context.audioWorklet.addModule(processorUrl)
    } catch (error: any) {
      throw new Error(
        `Failed to load audio analyzer worklet at url: ${processorUrl}. Further info: ${error?.message ?? error}`,
      )
    }

    // Create the AudioWorkletNode which enables the main JavaScript thread to
    // communicate with the audio processor (which runs in a Worklet).
    const node = new PitchNode(context, 'PitchProcessor')

    // numAudioSamplesPerAnalysis specifies the number of consecutive audio samples that
    // the pitch detection algorithm calculates for each unit of work. Larger values tend
    // to produce slightly more accurate results but are more expensive to compute and
    // can lead to notes being missed in faster passages i.e. where the music note is
    // changing rapidly. 1024 is usually a good balance between efficiency and accuracy
    // for music analysis.
    const numAudioSamplesPerAnalysis = 1024

    // Send the Wasm module to the audio node which in turn passes it to the
    // processor running in the Worklet thread. Also, pass any configuration
    // parameters for the Wasm detection algorithm.
    node.init(wasmBytes, onPitchDetectedCallback, numAudioSamplesPerAnalysis)

    // Connect the audio source (microphone output) to our analysis node.
    audioSource.connect(node)

    // Connect our analysis node to the output. Required even though we do not
    // output any audio. Allows further downstream audio processing or output to
    // occur.
    node.connect(context.destination)

    return { context, node }
  } catch (error: any) {
    throw new Error(`Failed to load audio analyzer WASM module. Further info: ${error?.message ?? error}`)
  }
}
