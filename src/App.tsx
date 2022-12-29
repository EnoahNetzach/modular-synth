import css from './App.module.css'
import AudioRecorderControl from './AudioRecorderControl'

export default function App() {
  return (
    <div className={css.container}>
      <header className={css.header}>Wasm Pitch Detector</header>
      <div className={css.content}>
        <AudioRecorderControl />
      </div>
    </div>
  )
}
