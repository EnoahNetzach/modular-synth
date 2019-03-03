import { css } from 'glamor'
import React from 'react'
import JackPlug from './JackPlug'
import Oscilloscope from './Oscilloscope'
import Panel from './Panel'
import Spectroscope from './Spectroscope'
import Slider from './Slider'

const scopes = css({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-around',
  width: '100%',
})

const muteButton = css({
  marginTop: '10px',
})

export default class MainOutput extends React.PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      mute: true,
      volume: 0.8,
    }

    this.inputNode = this.props.audioCtx.createGain()
    this.inputNode.gain.setValueAtTime(1, this.props.audioCtx.currentTime)

    this.outputNode = this.props.audioCtx.createGain()
    this.outputNode.gain.setValueAtTime(1, this.props.audioCtx.currentTime)

    this.mainVolumeNode = this.props.audioCtx.createGain()
    this.mainVolumeNode.gain.setValueAtTime(this.state.volume, this.props.audioCtx.currentTime)

    this.setMute = this.setMute.bind(this)
    this.setVolume = this.setVolume.bind(this)
  }

  componentDidMount() {
    this.inputNode.connect(this.mainVolumeNode)
    this.outputNode.connect(this.props.audioCtx.destination)

    this.setMute()
  }

  componentWillUnmount() {
    this.props.deregisterAnimations()

    this.inputNode.disconnect(this.mainVolumeNode)
    this.outputNode.disconnect(this.props.audioCtx.destination)

    if (this.state.mute) {
      this.outputNode.disconnect(this.props.audioCtx.destination)
    }
  }

  setMute() {
    this.setState(
      ({ mute }) => ({ mute: !mute }),
      () => {
        try {
          if (!this.state.mute) {
            this.mainVolumeNode.connect(this.outputNode)
          } else if (this.state.mute) {
            this.mainVolumeNode.disconnect(this.outputNode)
          }
        } catch (err) {
          // ignore
        }
      },
    )
  }

  setVolume(volume) {
    this.setState({ volume: volume / 100 }, () =>
      this.mainVolumeNode.gain.setValueAtTime(this.state.volume, this.props.audioCtx.currentTime),
    )
  }

  render() {
    return (
      <Panel height={2} width={4}>
        <div {...scopes}>
          <Oscilloscope
            audioCtx={this.props.audioCtx}
            deregisterAnimations={this.props.deregisterAnimations}
            height={200}
            input={this.outputNode}
            registerAnimation={this.props.registerAnimation}
            width={300}
          />

          <Spectroscope
            audioCtx={this.props.audioCtx}
            deregisterAnimations={this.props.deregisterAnimations}
            height={200}
            input={this.outputNode}
            registerAnimation={this.props.registerAnimation}
            width={300}
          />
        </div>

        <div {...muteButton}>
          <button onClick={this.setMute}>{!this.state.mute ? 'Mute' : 'Unmute'}</button>
        </div>

        <Slider defaultValue={0} label="Volume" onChange={this.setVolume} unit="%" value={this.state.volume * 100} />

        <JackPlug output={this.inputNode} label="In" />
      </Panel>
    )
  }
}
