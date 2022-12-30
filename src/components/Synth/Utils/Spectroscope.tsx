import { useCallback, useEffect, useMemo, useRef } from 'react'

interface Props {
  audioCtx: AudioContext
  deregisterAnimations: () => void
  height?: number
  input: AudioNode
  registerAnimation: (cb: () => void) => void
  width?: number
}

export default function Spectroscope({
  audioCtx,
  deregisterAnimations: deregisterAnimationsInitial,
  height = 100,
  input,
  registerAnimation: registerAnimationInitial,
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

  const drawSpectrum = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const canvasCtx = canvas.getContext('2d', { willReadFrequently: true })
    if (!canvasCtx) {
      return
    }

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteFrequencyData(dataArray)

    const imageData = canvasCtx.getImageData(1, 0, width - 1, height)
    canvasCtx.putImageData(imageData, 0, 0)
    canvasCtx.clearRect(width - 1, 0, 1, height)

    const barHeight = (height * 2.5) / bufferLength
    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i]
      const v = 3 * value
      let y = i * barHeight

      const r = v - 255
      const g = v - 510
      const b = value < 85 ? v : 510 - v

      canvasCtx.fillStyle = `rgb(${r}, ${g}, ${b})`
      canvasCtx.fillRect(width - 1, height - y, width, barHeight * 2.5)

      y += barHeight
    }
  }, [analyser, height, width])

  useEffect(() => {
    input.connect(analyser)

    const canvasCtx = canvasRef.current?.getContext('2d', { willReadFrequently: true })
    if (canvasCtx) {
      canvasCtx.fillStyle = 'rgb(0, 0, 0)'
      canvasCtx.fillRect(0, 0, width, height)
    }

    registerAnimation.current(drawSpectrum)

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      deregisterAnimations.current()

      input.disconnect(analyser)
    }
  }, [analyser, drawSpectrum, height, input, width])

  return <canvas height={height} ref={canvasRef} style={{ height: `${height}px`, width: `${width}px` }} width={width} />
}
