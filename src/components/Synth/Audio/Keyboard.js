import { css } from 'glamor'
import React from 'react'
import getFrequencyFromSemitone from '../../../utils/getFrequencyFromSemitone'
import getNoteFromSemitone from '../../../utils/getNoteFromSemitone'
import Panel from './Panel'
import Slider from './Slider'

const keyboard = css({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
})

const keyButton = css({
  color: 'black',
  fontWeight: 'bold',
})

const keymap = {
  a: -9,
  w: -8,
  s: -7,
  e: -6,
  d: -5,
  f: -4,
  t: -3,
  g: -2,
  y: -1,
  h: 0,
  u: 1,
  j: 2,
  k: 3,
  o: 4,
  l: 5,
  p: 6,
  ';': 7,
}

const types = ['mono', 'chord', 'poly']

export default class Keyboard extends React.PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      type: 0,
    }

    this.pressedKeys = {}

    this.setType = this.setType.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onKeyUp = this.onKeyUp.bind(this)
    this.onRelease = this.onRelease.bind(this)
    this.startFrequency = this.startFrequency.bind(this)
    this.stopFrequency = this.stopFrequency.bind(this)
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
  }

  setType(type) {
    this.onRelease()
    this.setState({ type })
  }

  onKeyDown(event) {
    const key = event.key.toLowerCase()

    if (key === ' ') {
      event.preventDefault()
      this.onRelease()

      return
    }

    const semitone = keymap[key]
    if (typeof semitone !== 'undefined') {
      event.preventDefault()
      this.pressedKeys[key] = new Date().getTime()

      this.startFrequency(getFrequencyFromSemitone(440, semitone))
    }
  }

  onKeyUp(event) {
    const key = event.key.toLowerCase()

    const semitone = keymap[key]
    if (typeof semitone !== 'undefined') {
      event.preventDefault()
      delete this.pressedKeys[key]

      if (['mono', 'chord'].includes(types[this.state.type]) && Object.keys(this.pressedKeys).length > 0) {
        const newestKey = Object.keys(this.pressedKeys).sort((k1, k2) => {
          const d1 = this.pressedKeys[k1]
          const d2 = this.pressedKeys[k2]

          if (d1 > d2) {
            return -1
          }
          if (d1 < d2) {
            return 1
          }

          return 0
        })[0]
        this.startFrequency(getFrequencyFromSemitone(440, keymap[newestKey]))
      } else {
        this.stopFrequency(getFrequencyFromSemitone(440, semitone))
      }
    }
  }

  onRelease() {
    this.props.oscillators.filter(({ active }) => active).map(({ frequency }) => this.stopFrequency(frequency))
  }

  startFrequency(frequency) {
    this.props.setOscillators(oscillators => {
      if (oscillators.find(oscillator => oscillator.active && oscillator.frequency === frequency)) {
        return null
      }

      switch (types[this.state.type]) {
        default:
        case 'mono':
          return [
            {
              ...oscillators[0],
              active: true,
              frequency,
              started: new Date().getTime(),
            },
            ...oscillators.slice(1),
          ]
        case 'poly': {
          let freeOscillatorIndex = oscillators.findIndex(oscillator => !oscillator.active)
          if (freeOscillatorIndex === -1) {
            let started = Infinity
            oscillators.forEach((oscillator, i) => {
              if (oscillator.started < started) {
                started = oscillator.started
                freeOscillatorIndex = i
              }
            })
          }

          const newOscillator = {
            ...oscillators[freeOscillatorIndex],
            active: true,
            frequency,
            started: new Date().getTime(),
          }

          return [
            ...oscillators.slice(0, freeOscillatorIndex),
            newOscillator,
            ...oscillators.slice(freeOscillatorIndex + 1),
          ]
        }
        case 'chord': {
          return oscillators.map(oscillator => ({
            ...oscillator,
            active: true,
            frequency,
            started: new Date().getTime(),
          }))
        }
      }
    })
  }

  stopFrequency(frequency) {
    this.props.setOscillators(oscillators => {
      const oscillatorIndex = oscillators.findIndex(oscillator => oscillator.frequency === frequency)
      if (oscillatorIndex === -1) {
        return null
      }

      switch (types[this.state.type]) {
        default:
        case 'mono':
          return [
            {
              ...oscillators[0],
              active: false,
            },
            ...oscillators.slice(1),
          ]
        case 'poly':
          return [
            ...oscillators.slice(0, oscillatorIndex),
            {
              ...oscillators[oscillatorIndex],
              active: false,
              frequency,
              started: 0,
            },
            ...oscillators.slice(oscillatorIndex + 1),
          ]

        case 'chord': {
          return oscillators.map(oscillator => ({
            ...oscillator,
            active: false,
          }))
        }
      }
    })
  }

  render() {
    return (
      <Panel height={1} width={4}>
        <div {...keyboard}>
          {Array.from({ length: 25 }).map((v, i) => {
            const note = getNoteFromSemitone(i - 12)
            const frequency = getFrequencyFromSemitone(440, i - 12)
            const inUse = this.props.oscillators.find(
              oscillator => oscillator.active && oscillator.frequency === frequency,
            )

            return (
              <div key={frequency}>
                <button
                  {...keyButton}
                  onClick={() => (inUse ? this.stopFrequency(frequency) : this.startFrequency(frequency))}
                  style={{ color: inUse ? 'red' : undefined }}
                >
                  {note}
                </button>
              </div>
            )
          })}
        </div>

        <div>
          <button {...keyButton} onClick={this.onRelease}>
            Release
          </button>
        </div>

        <Slider
          label="Type"
          max={types.length - 1}
          onChange={this.setType}
          step={1}
          transformer={value => types[value]}
          value={this.state.type}
        />
      </Panel>
    )
  }
}
