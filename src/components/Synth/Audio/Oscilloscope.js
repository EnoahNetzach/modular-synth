import React from 'react'

export default class Oscilloscope extends React.PureComponent {
  static defaultProps = {
    height: 100,
    scale: 1,
    width: 100,
  }

  constructor(props) {
    super(props)

    this.canvasRef = React.createRef()

    this.analyser = this.props.audioCtx.createAnalyser()
    this.analyser.fftSize = 2048

    this.drawOscilloscope = this.drawOscilloscope.bind(this)
  }

  componentDidMount() {
    this.props.input.connect(this.analyser)

    this.props.registerAnimation(this.drawOscilloscope)
  }

  componentWillUnmount() {
    this.props.deregisterAnimations()

    this.props.input.disconnect(this.analyser)
  }

  drawOscilloscope() {
    const canvas = this.canvasRef.current

    const canvasCtx = canvas.getContext('2d')
    const { height, width } = this.props

    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteTimeDomainData(dataArray)

    canvasCtx.fillStyle = 'rgb(200, 200, 200)'
    canvasCtx.fillRect(0, 0, width, height)

    canvasCtx.lineWidth = 1
    canvasCtx.strokeStyle = 'rgb(103, 20, 10)'
    canvasCtx.beginPath()

    const sliceWidth = (width * 1.0) / bufferLength
    for (var i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0
      const x = i * sliceWidth
      const y = (v * height) / 2 / this.props.scale

      if (i === 0) {
        canvasCtx.moveTo(x, y)
      } else {
        canvasCtx.lineTo(x, y)
      }
    }

    canvasCtx.stroke()
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
