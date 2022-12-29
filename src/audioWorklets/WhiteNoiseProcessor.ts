export class WhiteNoiseProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    for (const output of outputs) {
      for (const channel of output) {
        for (let i = 0; i < channel.length; i++) {
          channel[i] = Math.random() * 2 - 1
        }
      }
    }

    return true
  }
}

registerProcessor('WhiteNoiseProcessor', WhiteNoiseProcessor)
