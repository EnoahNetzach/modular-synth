import { css } from 'glamor'
import React from 'react'
import ReactDOM from 'react-dom'
import Synth from './components/Synth'
import './styles.css'

const app = css({
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '15px',
  '& button': {
    fontFamily: "'Courier New', Courier, monospace",
    height: '20px',
    lineHeight: '1.5em',
  },
})

function App() {
  return (
    <div {...app}>
      <Synth />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
