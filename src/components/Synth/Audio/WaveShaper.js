import { css } from 'glamor'
import React from 'react'
import JackPlug from './JackPlug'
import Oscilloscope from './Oscilloscope'
import Panel from './Panel'
import Slider from './Slider'

const oversamples = ['none', '2x', '4x']

const deg = Math.PI / 180
function makeDistortionCurve(amount, samples = 44100) {
  const k = typeof amount === 'number' ? amount : 50
  return new Float32Array(
    Array.from({ length: samples }).map((_, i) => {
      const x = (i * 2) / samples - 1

      return ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x))
    }),
  )
}

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

export default class PassFilter extends React.PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      balance: 0.5,
      amount: 50,
      oversample: 0,
      volume: 0.2,
    }

    this.inputNode = this.props.audioCtx.createGain()
    this.inputNode.gain.setValueAtTime(1, this.props.audioCtx.currentTime)

    this.outputNode = this.props.audioCtx.createGain()
    this.outputNode.gain.setValueAtTime(1, this.props.audioCtx.currentTime)

    this.shaperNode = this.props.audioCtx.createWaveShaper()
    this.shaperNode.curve = makeDistortionCurve(this.state.amount)
    this.shaperNode.oversample = oversamples[this.state.oversample]

    this.volumeNode = this.props.audioCtx.createGain()
    this.volumeNode.gain.setValueAtTime(this.state.volume, this.props.audioCtx.currentTime)

    this.gainNode = this.props.audioCtx.createGain()
    this.gainNode.gain.setValueAtTime(this.state.balance, this.props.audioCtx.currentTime)

    this.passthoughNode = this.props.audioCtx.createGain()
    this.passthoughNode.gain.setValueAtTime(1 - this.state.balance, this.props.audioCtx.currentTime)

    this.mixerNode = this.props.audioCtx.createGain()
    this.mixerNode.gain.setValueAtTime(this.state.balance, this.props.audioCtx.currentTime)

    this.balanceInNode = this.props.audioCtx.createGain()
    this.balanceInNode.gain.setValueAtTime(1, this.props.audioCtx.currentTime)

    this.negBalanceInNode = this.props.audioCtx.createGain()
    this.negBalanceInNode.gain.setValueAtTime(-1, this.props.audioCtx.currentTime)

    this.setBalance = this.setBalance.bind(this)
    this.setAmount = this.setAmount.bind(this)
    this.setOversample = this.setOversample.bind(this)
    this.setVolume = this.setVolume.bind(this)
  }

  componentDidMount() {
    this.inputNode.connect(this.shaperNode)
    this.inputNode.connect(this.passthoughNode)
    this.shaperNode.connect(this.volumeNode)
    this.volumeNode.connect(this.gainNode)
    this.gainNode.connect(this.mixerNode)
    this.passthoughNode.connect(this.mixerNode)
    this.mixerNode.connect(this.outputNode)

    this.balanceInNode.connect(this.negBalanceInNode)
    this.balanceInNode.connect(this.gainNode.gain)
    this.negBalanceInNode.connect(this.passthoughNode.gain)
  }

  componentWillUnmount() {
    this.inputNode.disconnect(this.shaperNode)
    this.inputNode.disconnect(this.passthoughNode)
    this.shaperNode.disconnect(this.volumeNode)
    this.volumeNode.disconnect(this.gainNode)
    this.gainNode.disconnect(this.mixerNode)
    this.passthoughNode.disconnect(this.mixerNode)
    this.mixerNode.disconnect(this.outputNode)

    this.balanceInNode.disconnect(this.negBalanceInNode)
    this.balanceInNode.disconnect(this.gainNode.gain)
    this.negBalanceInNode.disconnect(this.passthoughNode.gain)
  }

  setBalance(balance) {
    this.setState({ balance: balance / 100 }, () => {
      this.gainNode.gain.setValueAtTime(this.state.balance, this.props.audioCtx.currentTime)
      this.passthoughNode.gain.setValueAtTime(1 - this.state.balance, this.props.audioCtx.currentTime)
    })
  }

  setAmount(amount) {
    this.setState({ amount: Number(amount) }, () => {
      this.shaperNode.curve = makeDistortionCurve(this.state.amount, this.props.audioCtx.sampleRate)
    })
  }

  setOversample(oversample) {
    this.setState({ oversample }, () => {
      this.shaperNode.oversample = oversamples[this.state.oversample]
    })
  }

  setVolume(volume) {
    this.setState({ volume: volume / 100 }, () =>
      this.volumeNode.gain.setValueAtTime(this.state.volume, this.props.audioCtx.currentTime),
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

        <div {...name}>Wave Shaper</div>

        <Slider
          label="Oversample"
          max={oversamples.length - 1}
          onChange={this.setOversample}
          step={1}
          transformer={value => oversamples[value]}
          value={this.state.oversample}
        />

        <Slider editable label="Amount" max={500} min={0} onChange={this.setAmount} value={this.state.amount} />

        <Slider defaultValue={0} label="Volume" onChange={this.setVolume} unit="%" value={this.state.volume * 100} />

        <Slider
          control={this.balanceInNode}
          defaultValue={50}
          label="Balance"
          onChange={this.setBalance}
          unit="%"
          value={this.state.balance * 100}
        />

        <div {...plugs}>
          <JackPlug output={this.inputNode} label="In" />

          <JackPlug input={this.outputNode} label="Out" />
        </div>
      </Panel>
    )
  }
}
