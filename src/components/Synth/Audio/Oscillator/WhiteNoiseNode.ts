// eslint-disable-next-line import/no-webpack-loader-syntax
import processorUrl from 'worklet-loader!~/audioWorklets/WhiteNoiseProcessor'

export default class WhiteNoiseNode extends AudioWorkletNode {
  constructor(context: BaseAudioContext) {
    super(context, 'WhiteNoiseProcessor')
  }

  private static registrations: WeakMap<BaseAudioContext, Promise<void>> = new WeakMap()

  static async registerWorklet(context: BaseAudioContext) {
    if (WhiteNoiseNode.registrations.has(context)) {
      return WhiteNoiseNode.registrations.get(context)
    }

    try {
      const registration = context.audioWorklet.addModule(processorUrl)
      WhiteNoiseNode.registrations.set(context, registration)

      await registration
    } catch (error: any) {
      throw new Error(`Failed to load worklet at url: ${processorUrl}.\n${error?.message ?? error}`)
    }
  }
}
