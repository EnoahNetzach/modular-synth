import { css } from 'glamor'
import React from 'react'
import JackPlug from './JackPlug'
import Oscilloscope from './Oscilloscope'
import Panel from './Panel'
import Slider from './Slider'

const types = ['lowpass', 'highpass', 'bandpass']

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
      frequency: 1000,
      q: 0.2,
      type: 0,
    }

    this.inputNode = this.props.audioCtx.createGain()
    this.inputNode.gain.setValueAtTime(1, this.props.audioCtx.currentTime)

    this.outputNode = this.props.audioCtx.createGain()
    this.outputNode.gain.setValueAtTime(1, this.props.audioCtx.currentTime)

    this.filterNode = this.props.audioCtx.createBiquadFilter()
    this.filterNode.frequency.setValueAtTime(this.state.frequency, this.props.audioCtx.currentTime)
    this.filterNode.Q.setValueAtTime(this.state.q, this.props.audioCtx.currentTime)

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
    this.setFrequency = this.setFrequency.bind(this)
    this.setQ = this.setQ.bind(this)
    this.setType = this.setType.bind(this)
  }

  componentDidMount() {
    this.inputNode.connect(this.filterNode)
    this.inputNode.connect(this.passthoughNode)
    this.filterNode.connect(this.gainNode)
    this.gainNode.connect(this.mixerNode)
    this.passthoughNode.connect(this.mixerNode)
    this.mixerNode.connect(this.outputNode)

    this.balanceInNode.connect(this.negBalanceInNode)
    this.balanceInNode.connect(this.gainNode.gain)
    this.negBalanceInNode.connect(this.passthoughNode.gain)
  }

  componentWillUnmount() {
    this.inputNode.disconnect(this.filterNode)
    this.inputNode.disconnect(this.passthoughNode)
    this.filterNode.disconnect(this.gainNode)
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

  setFrequency(frequency) {
    this.setState({ frequency: frequency }, () =>
      this.filterNode.frequency.setValueAtTime(this.state.frequency, this.props.audioCtx.currentTime),
    )
  }

  setQ(q) {
    this.setState({ q: q / 100 }, () => this.filterNode.Q.setValueAtTime(this.state.q, this.props.audioCtx.currentTime))
  }

  setType(type) {
    this.setState({ type }, () => {
      this.filterNode.type = types[this.state.type]
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
            input={this.mixerNode}
            registerAnimation={this.props.registerAnimation}
            width={130}
          />
        </div>

        <div {...name}>Pass Filter</div>

        <Slider
          label="Type"
          max={types.length - 1}
          onChange={this.setType}
          step={1}
          transformer={value => types[value]}
          value={this.state.type}
        />

        <Slider
          control={this.filterNode.frequency}
          defaultValue={0}
          label="Frequency"
          max={10000}
          min={20}
          onChange={this.setFrequency}
          step={0.1}
          unit="Hz"
          value={this.state.frequency}
        />

        <Slider label="Q" onChange={this.setQ} value={this.state.q * 100} />

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
