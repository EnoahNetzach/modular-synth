import { css } from 'glamor'
import React from 'react'
import JackPlug from './JackPlug'
import Oscilloscope from './Oscilloscope'
import Panel from './Panel'
import Slider from './Slider'

const waveforms = ['sine', 'triangle', 'square']

const scope = css({
  marginBottom: '5px',
})

const name = css({
  margin: '20px 0',
})

export default class LFO extends React.PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      frequency: 3,
      range: 1,
      waveform: 0,
    }

    this.oscillator = this.props.audioCtx.createOscillator()
    this.oscillator.type = waveforms[this.state.waveform]
    this.oscillator.frequency.setValueAtTime(this.state.frequency, this.props.audioCtx.currentTime)
    this.oscillator.start()

    this.gainNode = this.props.audioCtx.createGain()
    this.gainNode.gain.setValueAtTime(this.state.range, this.props.audioCtx.currentTime)

    this.outputNode = this.props.audioCtx.createGain()
    this.outputNode.gain.setValueAtTime(1, this.props.audioCtx.currentTime)

    this.setFrequency = this.setFrequency.bind(this)
    this.setRange = this.setRange.bind(this)
    this.setWaveform = this.setWaveform.bind(this)
  }

  componentDidMount() {
    this.oscillator.connect(this.gainNode)
    this.gainNode.connect(this.outputNode)
  }

  componentWillUnmount() {
    this.oscillator.disconnect(this.gainNode)
    this.gainNode.disconnect(this.outputNode)
  }

  setFrequency(frequency) {
    this.setState({ frequency: frequency / 100 }, () =>
      this.oscillator.frequency.setValueAtTime(this.state.frequency, this.props.audioCtx.currentTime),
    )
  }

  setRange(range) {
    this.setState({ range }, () => this.gainNode.gain.setValueAtTime(this.state.range, this.props.audioCtx.currentTime))
  }

  setWaveform(waveform) {
    this.setState({ waveform }, () => {
      this.oscillator.type = waveforms[this.state.waveform]
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
            input={this.gainNode}
            registerAnimation={this.props.registerAnimation}
            scale={this.state.range}
            width={130}
          />
        </div>

        <div {...name}>LFO</div>

        <Slider
          label="Waveform"
          max={waveforms.length - 1}
          onChange={this.setWaveform}
          step={1}
          transformer={value => waveforms[value]}
          value={this.state.waveform}
        />

        <Slider
          defaultValue={0}
          label="Frequency"
          max={2000}
          min={1}
          onChange={this.setFrequency}
          unit="Hz"
          transformer={value => (value / 100).toFixed(2)}
          value={this.state.frequency * 100}
        />

        <Slider
          defaultValue={0}
          editable
          label="Range"
          max={10000}
          min={0}
          onChange={this.setRange}
          precision={2}
          unit="±"
          value={this.state.range}
        />

        <JackPlug input={this.outputNode} label="Out" />
      </Panel>
    )
  }
}
