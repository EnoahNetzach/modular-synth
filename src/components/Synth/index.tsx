import { useState } from 'react'
import Audio from './Audio'
import Splash from './Splash'

export default function Synth() {
  const [init, setInit] = useState(false)

  return !init ? <Splash initialize={() => setInit(true)} /> : <Audio />
}
