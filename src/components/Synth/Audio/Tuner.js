import { css } from 'glamor'
import React from 'react'
import JackPlug from './JackPlug'
import Panel from './Panel'

const scope = css({
  marginBottom: '5px',
})

const name = css({
  margin: '20px 0',
})

const plugs = css({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'row',
})

export default class Tuner extends React.PureComponent {
  static scopeSize = {
    height: 130,
    width: 130,
  }

  constructor(props) {
    super(props)

    this.state = {
      frequency: 0,
    }

    this.canvasRef = React.createRef()

    this.inputNode = this.props.audioCtx.createGain()
    this.inputNode.gain.setValueAtTime(1, this.props.audioCtx.currentTime)

    this.analyser = this.props.audioCtx.createAnalyser()
    this.analyser.fftSize = 2048

    this.drawTuner = this.drawTuner.bind(this)
    this.extractFrequency = this.extractFrequency.bind(this)
  }

  componentDidMount() {
    this.inputNode.connect(this.analyser)

    const canvasCtx = this.canvasRef.current.getContext('2d')
    const { height, width } = this.props
    canvasCtx.fillStyle = 'rgb(0, 0, 0)'
    canvasCtx.fillRect(0, 0, width, height)

    this.props.registerAnimation(this.drawTuner)
    this.props.registerAnimation(this.extractFrequency)
  }

  componentWillUnmount() {
    this.props.deregisterAnimations()

    this.inputNode.disconnect(this.analyser)
  }

  drawTuner() {
    const canvas = this.canvasRef.current

    const canvasCtx = canvas.getContext('2d')
    const { height, width } = Tuner.scopeSize

    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteFrequencyData(dataArray)

    var imageData = canvasCtx.getImageData(1, 0, width - 1, height)
    canvasCtx.putImageData(imageData, 0, 0)
    canvasCtx.clearRect(width - 1, 0, 1, height)

    const barHeight = (height * 2.5) / bufferLength
    for (var i = 0; i < bufferLength; i++) {
      const value = dataArray[i]
      const v = 3 * value
      const y = i * barHeight

      const r = v - 255
      const g = v - 510
      const b = value < 85 ? v : 510 - v

      canvasCtx.fillStyle = `rgb(${r}, ${g}, ${b})`
      canvasCtx.fillRect(width - 1, height - y, width, barHeight * 2.5)

      y += barHeight
    }
  }

  extractFrequency() {
    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Float32Array(bufferLength)
    this.analyser.getFloatFrequencyData(dataArray)

    const { sampleRate } = this.props.audioCtx

    let highestGain = -Infinity
    let lowest = Infinity
    for (var i = 0; i < bufferLength; i++) {
      const value = dataArray[i]
      if (value > -Infinity && value > highestGain) {
        highestGain = value
        lowest = i
      }
    }
    if (lowest === Infinity) {
      lowest = 0
    }

    const nearest = Array.from({ length: 3 })
      .map((v, i) => Math.max(0, Math.min(bufferLength, lowest + i - 1)))
      .map(i => (i * sampleRate) / (bufferLength * 2))

    this.setState({ frequency: nearest.map(v => v.toFixed(2)).join(' ') })
  }

  render() {
    const { height, width } = Tuner.scopeSize
    const { frequency } = this.state

    return (
      <Panel height={2}>
        <div {...scope}>
          <canvas
            height={height}
            ref={this.canvasRef}
            style={{ height: `${height}px`, width: `${width}px` }}
            width={width}
          />
        </div>

        <div {...name}>Tuner</div>

        <div {...name}>{frequency} Hz</div>

        <div {...plugs}>
          <JackPlug output={this.inputNode} label="In" />
        </div>
      </Panel>
    )
  }
}
