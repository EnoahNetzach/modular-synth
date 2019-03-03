import { css } from 'glamor'
import React from 'react'
import Connector from './Connector'
import Keyboard from './Keyboard'
import LFO from './LFO'
import MainOutput from './MainOutput'
import Oscillator from './Oscillator'
import PassFilter from './PassFilter'
import Tuner from './Tuner'
import WaveShaper from './WaveShaper'

const baseHeight = 220
const baseWidth = 170
const cols = 6
const rows = 8

const grid = css({
  display: 'grid',
  gridTemplateColumns: `repeat(${cols}, 1fr)`,
  gridTemplateRows: `repeat(${rows}, 1fr)`,
  height: `${baseHeight * rows}px`,
  width: `${baseWidth * cols}px`,
})

export default class Audio extends React.PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      lfos: Array.from({ length: 2 }).map((_, i) => ({
        id: `lfo_${i}`,
      })),
      oscillators: Array.from({ length: 6 }).map((_, i) => ({
        frequency: 440,
        id: `oscillator_${i}`,
        started: 0,
        active: false,
      })),
      passFilters: Array.from({ length: 2 }).map((_, i) => ({
        id: `pass_filter_${i}`,
      })),
      waveShapers: Array.from({ length: 1 }).map((_, i) => ({
        id: `wave_shaper_${i}`,
      })),
    }

    this.animations = {}

    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    console.log(this.audioCtx)
  }

  componentDidMount() {
    this.animation = requestAnimationFrame(() => this.draw())
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.animation)
  }

  deregisterAnimations(id) {
    delete this.animations[id]
  }

  registerAnimation(id, animation) {
    this.animations[id] = [...(this.animations[id] || []), animation]
  }

  draw() {
    Object.values(this.animations).forEach(animations => animations.forEach(animation => animation()))

    this.animation = requestAnimationFrame(() => this.draw())
  }

  render() {
    return (
      <Connector>
        <div {...grid}>
          {this.state.oscillators.map(({ active, frequency, id }, i) => (
            <Oscillator
              active={active}
              audioCtx={this.audioCtx}
              deregisterAnimations={() => this.deregisterAnimations(id)}
              frequency={frequency}
              key={id}
              registerAnimation={animation => this.registerAnimation(id, animation)}
            />
          ))}

          {this.state.lfos.map(({ id }, i) => (
            <LFO
              audioCtx={this.audioCtx}
              deregisterAnimations={() => this.deregisterAnimations(id)}
              key={id}
              registerAnimation={animation => this.registerAnimation(id, animation)}
            />
          ))}

          {this.state.passFilters.map(({ id }, i) => (
            <PassFilter
              audioCtx={this.audioCtx}
              deregisterAnimations={() => this.deregisterAnimations(id)}
              key={id}
              registerAnimation={animation => this.registerAnimation(id, animation)}
            />
          ))}

          {this.state.waveShapers.map(({ id }, i) => (
            <WaveShaper
              audioCtx={this.audioCtx}
              deregisterAnimations={() => this.deregisterAnimations(id)}
              key={id}
              registerAnimation={animation => this.registerAnimation(id, animation)}
            />
          ))}

          <MainOutput
            audioCtx={this.audioCtx}
            deregisterAnimations={() => this.deregisterAnimations('main_output')}
            registerAnimation={animation => this.registerAnimation('main_output', animation)}
          />

          <Tuner
            audioCtx={this.audioCtx}
            deregisterAnimations={() => this.deregisterAnimations('tuner')}
            registerAnimation={animation => this.registerAnimation('tuner', animation)}
          />

          <Keyboard
            oscillators={this.state.oscillators}
            setOscillators={callback =>
              this.setState(({ oscillators }) => {
                const ret = callback(oscillators)

                if (ret === null) {
                  return null
                }

                return { oscillators: ret }
              })
            }
          />
        </div>
      </Connector>
    )
  }
}
