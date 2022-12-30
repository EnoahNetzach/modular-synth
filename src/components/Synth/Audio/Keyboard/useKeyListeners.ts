import { useEffect } from 'react'
import { isMappedKey, keymap } from './constants'

interface Params {
  onRelease: () => void
  startNote: (semitone: number) => void
  stopNote: (semitone: number) => void
}

export default function useKeyListeners({ onRelease, startNote, stopNote }: Params) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) {
        return
      }

      const key = event.key.toLowerCase()

      if (key === ' ') {
        event.preventDefault()
        onRelease()

        return
      }

      if (!isMappedKey(key)) {
        return
      }

      event.preventDefault()
      const semitone = keymap[key]
      startNote(semitone)
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.repeat) {
        return
      }

      const key = event.key.toLowerCase()

      if (!isMappedKey(key)) {
        return
      }

      event.preventDefault()
      const semitone = keymap[key]
      stopNote(semitone)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [onRelease, startNote, stopNote])
}
