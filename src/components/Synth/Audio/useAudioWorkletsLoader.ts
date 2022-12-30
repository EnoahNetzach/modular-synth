import { useEffect, useMemo, useRef, useState } from 'react'
import WhiteNoiseNode from '../Utils/WhiteNoiseNode'

interface Params {
  audioCtx: AudioContext
}

export default function useAudioWorkletsLoader({ audioCtx }: Params) {
  const immediateCheck = useRef(false)
  const [workletsLoaded, setWorkletsLoaded] = useState(false)

  useMemo(
    () => {
      immediateCheck.current = false
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [audioCtx],
  )

  useEffect(() => {
    Promise.all([WhiteNoiseNode.registerWorklet(audioCtx)]).then(() => {
      immediateCheck.current = true
      setWorkletsLoaded(true)
    })

    return () => {
      immediateCheck.current = false
      setWorkletsLoaded(false)
    }
  }, [audioCtx])

  return workletsLoaded && immediateCheck.current
}
