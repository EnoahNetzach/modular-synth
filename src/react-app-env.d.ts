/// <reference types="react-scripts" />
/// <reference types="@types/webmidi" />

declare module 'worklet-loader!~/audioWorklets/PitchProcessor' {
  const url: string

  export default url
}

declare module 'worklet-loader!~/audioWorklets/WhiteNoiseProcessor' {
  const url: string

  export default url
}
