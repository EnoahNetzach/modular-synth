import { useCallback, useEffect, useMemo, useRef } from 'react'

interface Props {
  audioCtx: AudioContext
  deregisterAnimations: () => void
  height?: number
  input: AudioNode
  registerAnimation: (cb: () => void) => void
  scale?: number
  width?: number
}

export default function Oscilloscope({
  audioCtx,
  deregisterAnimations: deregisterAnimationsInitial,
  height = 100,
  input,
  registerAnimation: registerAnimationInitial,
  scale = 1,
  width = 100,
}: Props) {
  const deregisterAnimations = useRef(deregisterAnimationsInitial)
  const registerAnimation = useRef(registerAnimationInitial)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyser = useMemo(
    () =>
      new AnalyserNode(audioCtx, {
        fftSize: 2048,
      }),
    [audioCtx],
  )

  const drawOscilloscope = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) {
      return
    }

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteTimeDomainData(dataArray)

    canvasCtx.fillStyle = 'rgb(200, 200, 200)'
    canvasCtx.fillRect(0, 0, width, height)

    canvasCtx.lineWidth = 1
    canvasCtx.strokeStyle = 'rgb(103, 20, 10)'
    canvasCtx.beginPath()

    const sliceWidth = width / bufferLength
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0
      const x = i * sliceWidth
      const y = (v * height) / 2 / scale

      if (i === 0) {
        canvasCtx.moveTo(x, y)
      } else {
        canvasCtx.lineTo(x, y)
      }
    }

    canvasCtx.stroke()
  }, [analyser, height, scale, width])

  useEffect(() => {
    input.connect(analyser)

    registerAnimation.current(drawOscilloscope)

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      deregisterAnimations.current()

      input.disconnect(analyser)
    }
  }, [analyser, drawOscilloscope, input])

  return <canvas height={height} ref={canvasRef} style={{ height: `${height}px`, width: `${width}px` }} width={width} />
}
