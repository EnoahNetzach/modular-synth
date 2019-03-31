import { css } from 'glamor'
import React from 'react'
import JackPlug from './JackPlug'
import Oscilloscope from './Oscilloscope'
import Panel from './Panel'
import Slider from './Slider'

const scope = css({
  marginBottom: '5px',
})

const indicators = css({
  alignItems: 'center',
  margin: '20px 0',
  display: 'flex',
  flexDirection: 'row',
})

const light = css({
  border: '2px solid #444',
  borderRadius: '50%',
  display: 'block',
  height: '14px',
  margin: '2px',
  position: 'relative',
  width: '14px',
  ':before': {
    background: '#aaa',
    border: '2px solid #aaa',
    content: '""',
    display: 'block',
    borderRadius: '50%',
    height: '6px',
    left: '0',
    position: 'absolute',
    top: '0',
    width: '6px',
  },
})

const lightOn = css({
  borderColor: '#444',
  ':before': {
    background: '#ea1919',
    borderColor: '#981a1a',
  },
})

const name = css({
  margin: '20px 0',
})

const plugs = css({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'row',
})

export default class Envelope extends React.PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      attack: 0.0,
      release: 0.0,
    }

    this.inputNode = this.props.audioCtx.createGain()
    this.inputNode.gain.setValueAtTime(1, this.props.audioCtx.currentTime)

    this.gainNode = this.props.audioCtx.createGain()
    this.gainNode.gain.setValueAtTime(this.state.volume, this.props.audioCtx.currentTime)

    this.outputNode = this.props.audioCtx.createGain()
    this.outputNode.gain.setValueAtTime(1, this.props.audioCtx.currentTime)

    this.analyser = this.props.audioCtx.createAnalyser()
    this.analyser.fftSize = 2048

    this.checkTrigger = this.checkTrigger.bind(this)
    this.setAttack = this.setAttack.bind(this)
  }

  componentDidMount() {
    this.inputNode.connect(this.gainNode)
    this.gainNode.connect(this.outputNode)
    this.inputNode.connect(this.analyser)

    this.props.registerAnimation(this.checkTrigger)
  }

  componentWillUnmount() {
    this.props.deregisterAnimations()

    this.inputNode.disconnect(this.gainNode)
    this.gainNode.disconnect(this.outputNode)
  }

  checkTrigger() {
    // const canvas = this.canvasRef.current
    // const canvasCtx = canvas.getContext('2d')
    // const { height, width } = this.props
    // const bufferLength = this.analyser.frequencyBinCount
    // const dataArray = new Uint8Array(bufferLength)
    // this.analyser.getByteFrequencyData(dataArray)
    // var imageData = canvasCtx.getImageData(1, 0, width - 1, height)
    // canvasCtx.putImageData(imageData, 0, 0)
    // canvasCtx.clearRect(width - 1, 0, 1, height)
    // const barHeight = (height * 2.5) / bufferLength
    // for (var i = 0; i < bufferLength; i++) {
    //   const value = dataArray[i]
    //   const v = 3 * value
    //   const y = i * barHeight
    //   const r = v - 255
    //   const g = v - 510
    //   const b = value < 85 ? v : 510 - v
    //   canvasCtx.fillStyle = `rgb(${r}, ${g}, ${b})`
    //   canvasCtx.fillRect(width - 1, height - y, width, barHeight * 2.5)
    //   y += barHeight
    // }
  }

  setAttack(attack) {
    this.setState({ attack: attack / 100 }, () => {
      this.gainNode.gain.setValueAtTime(this.state.attack, this.props.audioCtx.currentTime)
    })
  }

  render() {
    return (
      <Panel>
        <div {...scope}>
          <Oscilloscope
            {...scope}
            audioCtx={this.props.audioCtx}
            deregisterAnimations={this.props.deregisterAnimations}
            height={130}
            input={this.outputNode}
            registerAnimation={this.props.registerAnimation}
            width={130}
          />
        </div>

        <div {...indicators}>
          <div>
            <span className={`${light} ${this.props.active ? lightOn : ''}`} />
          </div>

          <div {...name}>Envelope</div>
        </div>

        <Slider defaultValue={0} label="Attack" onChange={this.setAttack} unit="ms" value={this.state.attack * 100} />

        <div {...plugs}>
          <JackPlug output={this.inputNode} label="In" />

          <JackPlug input={this.outputNode} label="Out" />
        </div>
      </Panel>
    )
  }
}
