import { css } from 'glamor'
import React from 'react'
import getFrequencyFromSemitone from '../../../utils/getFrequencyFromSemitone'
import JackPlug from './JackPlug'
import Oscilloscope from './Oscilloscope'
import Panel from './Panel'
import Slider from './Slider'

const waveforms = ['sine', 'triangle', 'square']

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

export default class Oscillator extends React.PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      detune: 0,
      harmonics: Array.from({ length: 1 }).map((_, i) => 1 / (i + 2) ** 2),
      transpose: 0,
      volume: 0.6,
      waveform: 0,
    }

    this.sounds = []

    this.mixerNode = this.props.audioCtx.createGain()
    this.mixerNode.gain.setValueAtTime(this.state.volume, this.props.audioCtx.currentTime)

    this.outputNode = this.props.audioCtx.createGain()
    this.outputNode.gain.setValueAtTime(1, this.props.audioCtx.currentTime)

    this.setDetune = this.setDetune.bind(this)
    this.setTranspose = this.setTranspose.bind(this)
    this.setVolume = this.setVolume.bind(this)
    this.setWaveform = this.setWaveform.bind(this)
  }

  componentDidMount() {
    this.startSound()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.active !== this.props.active) {
      if (this.props.active) {
        this.mixerNode.connect(this.outputNode)
      } else {
        this.mixerNode.disconnect(this.outputNode)
      }
    }

    if (prevProps.frequency !== this.props.frequency) {
      this.onFrequencyChanged()
    }
  }

  componentWillUnmount() {
    this.stopSound()

    if (this.props.active) {
      this.mixerNode.disconnect(this.outputNode)
    }
  }

  setDetune(detune) {
    this.setState({ detune }, () =>
      this.sounds.forEach(([oscillator], i) =>
        oscillator.detune.setValueAtTime(this.state.detune, this.props.audioCtx.currentTime),
      ),
    )
  }

  setHarmonic(n, gain) {
    this.setState(
      ({ harmonics }) => ({
        harmonics: [...harmonics.slice(0, n), gain, ...harmonics.slice(n + 1)],
      }),
      () =>
        this.sounds.forEach(([oscillator, gain], i) =>
          gain.gain.setValueAtTime(this.state.harmonics[i], this.props.audioCtx.currentTime),
        ),
    )
  }

  setTranspose(semitones) {
    this.setState({ transpose: semitones }, () => this.onFrequencyChanged())
  }

  setVolume(volume) {
    this.setState({ volume: volume / 100 }, () =>
      this.mixerNode.gain.setValueAtTime(this.state.volume, this.props.audioCtx.currentTime),
    )
  }

  setWaveform(waveform) {
    this.setState({ waveform }, () =>
      this.sounds.forEach(([oscillator], i) => {
        oscillator.type = waveforms[this.state.waveform]
      }),
    )
  }

  startSound() {
    this.sounds = this.state.harmonics.map((harmonicGain, i) => {
      const oscillator = this.props.audioCtx.createOscillator()
      oscillator.type = waveforms[this.state.waveform]
      oscillator.frequency.setValueAtTime(this.props.frequency * (i + 1), this.props.audioCtx.currentTime)
      oscillator.start()

      const gain = this.props.audioCtx.createGain()
      gain.gain.setValueAtTime(harmonicGain, this.props.audioCtx.currentTime)

      oscillator.connect(gain)
      gain.connect(this.mixerNode)

      return [oscillator, gain]
    })
  }

  stopSound() {
    this.sounds.forEach(([oscillator, gain]) => {
      oscillator.disconnect(gain)
      gain.disconnect(this.mixerNode)
    })

    delete this.sounds
  }

  onFrequencyChanged() {
    this.sounds.forEach(([oscillator], i) =>
      oscillator.frequency.setValueAtTime(
        getFrequencyFromSemitone(this.props.frequency, this.state.transpose) * (i + 1),
        this.props.audioCtx.currentTime,
      ),
    )
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
            input={this.mixerNode}
            registerAnimation={this.props.registerAnimation}
            width={130}
          />
        </div>

        <div {...indicators}>
          <div>
            <span className={`${light} ${this.props.active ? lightOn : ''}`} />
          </div>

          <div>{this.props.frequency.toFixed(2)} Hz</div>
        </div>

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
          label="Transpose"
          max={12}
          min={-12}
          onChange={this.setTranspose}
          step={1}
          unit="semi"
          value={this.state.transpose}
        />

        <Slider label="Detune" onChange={this.setDetune} unit="cents" value={this.state.detune} />

        <Slider defaultValue={0} label="Volume" onChange={this.setVolume} unit="%" value={this.state.volume * 100} />

        <JackPlug input={this.outputNode} label="Out" />
      </Panel>
    )
  }
}
