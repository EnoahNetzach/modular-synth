import React from 'react'
import Audio from './Audio'
import Splash from './Splash'

export default class Synth extends React.PureComponent {
  state = {
    init: false,
  }

  render() {
    return !this.state.init ? <Splash initialize={() => this.setState({ init: true })} /> : <Audio />
  }
}
