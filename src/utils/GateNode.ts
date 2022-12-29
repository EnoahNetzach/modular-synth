export default class GateNode implements AudioNode {
  readonly context: AudioContext
  private cb: (value: number, time: number, cancelScheduled: boolean) => void
  private connections: AudioNode[]
  private value: number

  channelCount: number = 0
  channelCountMode: ChannelCountMode = 'max'
  channelInterpretation: ChannelInterpretation = 'discrete'
  readonly numberOfInputs: number = 0
  readonly numberOfOutputs: number = 0

  constructor(audioCtx: AudioContext, cb = (value: number, time: number, cancelScheduled: boolean) => {}) {
    this.connections = []
    this.value = 0
    this.cb = cb
    this.context = audioCtx
  }

  connect(destinationNode: AudioNode, output?: number, input?: number): AudioNode
  connect(destinationParam: AudioParam, output?: number): void

  connect(destinationNode: AudioNode | AudioParam) {
    if (destinationNode instanceof AudioParam) {
      return
    }

    if (!this.connections.includes(destinationNode)) {
      this.connections.push(destinationNode)
    }

    return destinationNode
  }

  disconnect(destinationNode?: AudioNode | number | AudioParam) {
    if (!destinationNode || typeof destinationNode === 'number' || destinationNode instanceof AudioParam) {
      return
    }

    if (this.connections.includes(destinationNode)) {
      this.connections.splice(this.connections.indexOf(destinationNode), 1)
    }
  }

  setCb(cb: typeof this.cb) {
    this.cb = cb
  }

  setValue(value = 1, time = this.context.currentTime, cancelScheduled = false) {
    this.value = value
    this.cb(this.value, time, cancelScheduled)
    this.connections
      .filter((connection): connection is GateNode => connection instanceof GateNode)
      .forEach((connection) => connection.setValue(this.value, time, cancelScheduled))
  }

  getValue() {
    return this.value
  }

  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ): void {}

  dispatchEvent(event: Event): boolean {
    return false
  }

  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void {}
}
