import { css } from 'glamor'
import React from 'react'
import JackPlug from './JackPlug'
import Oscilloscope from './Oscilloscope'
import Panel from './Panel'
import Slider from './Slider'

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

export default class Mixer extends React.PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      volume: 0.8,
    }

    this.inputNode = this.props.audioCtx.createGain()
    this.inputNode.gain.setValueAtTime(1, this.props.audioCtx.currentTime)

    this.gainNode = this.props.audioCtx.createGain()
    this.gainNode.gain.setValueAtTime(this.state.volume, this.props.audioCtx.currentTime)

    this.outputNode = this.props.audioCtx.createGain()
    this.outputNode.gain.setValueAtTime(1, this.props.audioCtx.currentTime)

    this.setVolume = this.setVolume.bind(this)
  }

  componentDidMount() {
    this.inputNode.connect(this.gainNode)
    this.gainNode.connect(this.outputNode)
  }

  componentWillUnmount() {
    this.inputNode.disconnect(this.gainNode)
    this.gainNode.disconnect(this.outputNode)
  }

  setVolume(volume) {
    this.setState({ volume: volume / 100 }, () => {
      this.gainNode.gain.setValueAtTime(this.state.volume, this.props.audioCtx.currentTime)
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

        <div {...name}>Mixer</div>

        <Slider
          control={this.gainNode.gain}
          defaultValue={0}
          label="Volume"
          onChange={this.setVolume}
          unit="%"
          value={this.state.volume * 100}
        />

        <div {...plugs}>
          <JackPlug output={this.inputNode} label="In" />

          <JackPlug input={this.outputNode} label="Out" />
        </div>
      </Panel>
    )
  }
}
