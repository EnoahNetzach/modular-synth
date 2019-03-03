import React from 'react'
import ReactDOM from 'react-dom'
import Synth from './components/Synth'
import './styles.css'

function App() {
  return (
    <div className="App">
      <Synth />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
