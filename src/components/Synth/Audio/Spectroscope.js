import React from 'react'

export default class Spectroscope extends React.PureComponent {
  static defaultProps = {
    height: 100,
    width: 100,
  }

  constructor(props) {
    super(props)

    this.canvasRef = React.createRef()

    this.analyser = this.props.audioCtx.createAnalyser()
    this.analyser.fftSize = 2048

    this.drawSpectrum = this.drawSpectrum.bind(this)
  }

  componentDidMount() {
    this.props.input.connect(this.analyser)

    const canvasCtx = this.canvasRef.current.getContext('2d')
    const { height, width } = this.props
    canvasCtx.fillStyle = 'rgb(0, 0, 0)'
    canvasCtx.fillRect(0, 0, width, height)

    this.props.registerAnimation(this.drawSpectrum)
  }

  componentWillUnmount() {
    this.props.deregisterAnimations()

    this.props.input.disconnect(this.analyser)
  }

  drawSpectrum() {
    const canvas = this.canvasRef.current

    const canvasCtx = canvas.getContext('2d')
    const { height, width } = this.props

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

  render() {
    const { height, width } = this.props

    return (
      <canvas
        height={height}
        ref={this.canvasRef}
        style={{ height: `${height}px`, width: `${width}px` }}
        width={width}
      />
    )
  }
}
