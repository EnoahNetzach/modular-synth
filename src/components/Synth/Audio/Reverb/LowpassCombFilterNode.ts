export interface LowpassCombFilterNodeOptions {
  dampening?: number
  delayTime?: number
  resonance?: number
}

export default class LowpassCombFilterNode {
  readonly context: BaseAudioContext
  private input?: AudioNode
  private output?: number
  private readonly lowPassNode: BiquadFilterNode
  private readonly delayNode: DelayNode
  private readonly gainNode: GainNode

  constructor(context: BaseAudioContext, options: LowpassCombFilterNodeOptions = {}) {
    const { delayTime, resonance: gainValue, dampening: frequency } = options

    this.context = context

    this.delayNode = new DelayNode(this.context, { delayTime })
    this.lowPassNode = new BiquadFilterNode(this.context, { type: 'lowpass', frequency })
    this.gainNode = new GainNode(this.context, { gain: gainValue })
  }

  connectInput(inputNode: AudioNode, output: number): this {
    this.disconnectInput()

    this.input = inputNode
    this.output = output
    this.input.connect(this.delayNode, this.output).connect(this.lowPassNode).connect(this.gainNode).connect(this.input)

    return this
  }

  disconnectInput(): void {
    this.input?.disconnect(this.delayNode, this.output ?? 0)
    this.input = undefined
  }

  get resonance() {
    return this.gainNode.gain
  }

  get delayTime() {
    return this.delayNode.delayTime
  }

  connect(destinationNode: AudioNode, output: number, input: number): AudioNode {
    this.input?.connect(destinationNode, output, input)

    return destinationNode
  }

  disconnect(destinationNode: AudioNode, output: number, input: number): void {
    this.input?.disconnect(destinationNode, output, input)
  }
}
