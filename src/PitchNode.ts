interface LoadedEvent {
  type: 'wasm-module-loaded'
}

interface PitchEvent {
  pitch: number
  type: 'pitch'
}

type PitchNodeEvent = LoadedEvent | PitchEvent | never

export default class PitchNode extends AudioWorkletNode {
  private numAudioSamplesPerAnalysis: number
  private onPitchDetectedCallback: (pitch: number) => void

  constructor(...args: ConstructorParameters<typeof AudioWorkletNode>) {
    super(...args)

    this.numAudioSamplesPerAnalysis = 0

    this.onPitchDetectedCallback = () => undefined
  }

  /**
   * Initialize the Audio processor by sending the fetched WebAssembly module to
   * the processor worklet.
   */
  init(wasmBytes: BufferSource, onPitchDetectedCallback: (pitch: number) => void, numAudioSamplesPerAnalysis: number) {
    this.onPitchDetectedCallback = onPitchDetectedCallback
    this.numAudioSamplesPerAnalysis = numAudioSamplesPerAnalysis

    // Listen to messages sent from the audio processor.
    this.port.addEventListener('message', (event: MessageEvent<PitchNodeEvent>) => this.onmessage(event.data))

    this.port.postMessage({
      type: 'send-wasm-module',
      wasmBytes,
    })
  }

  // Handle an uncaught exception thrown in the PitchProcessor.
  // @ts-ignore
  onprocessorerror(err: string) {
    console.log(`An error from AudioWorkletProcessor.process() occurred: ${err}`)
  }

  onmessage(event: PitchNodeEvent) {
    switch (event.type) {
      case 'wasm-module-loaded':
        // The Wasm module was successfully sent to the PitchProcessor running on the
        // AudioWorklet thread and compiled. This is our cue to configure the pitch
        // detector.
        this.port.postMessage({
          type: 'init-detector',
          sampleRate: this.context.sampleRate,
          numAudioSamplesPerAnalysis: this.numAudioSamplesPerAnalysis,
        })
        return
      case 'pitch':
        // A pitch was detected. Invoke our callback which will result in the UI updating.
        this.onPitchDetectedCallback(event.pitch)
        return
    }
  }
}
