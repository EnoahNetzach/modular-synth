import { CSSProperties, useCallback, useContext, useEffect, useRef, useState } from 'react'
import css from './index.module.css'
import { ConnectorContext } from '../Connector'
import { PresetContext } from '../Preset'

type IO = AudioNode | AudioParam

type InOrOut = { input: IO; output?: IO } | { input?: IO; output: IO }

type Props = {
  indicator?: number
  indicatorType?: 'relative' | 'absolute'
  label: string
} & InOrOut

export default function JackPlug({ indicator, indicatorType, input, label, output }: Props) {
  const presetContext = useContext(PresetContext)
  const connectorContext = useContext(ConnectorContext)

  const [connections, setConnections] = useState(0)

  const plugRef = useRef<HTMLDivElement>(null)

  const createConnection = useCallback(() => {
    if (!plugRef.current) {
      return
    }

    const { scrollX, scrollY } = window
    const { height, width, x, y } = plugRef.current.getBoundingClientRect()

    connectorContext(
      input,
      output,
      { x: x + width / 2 + scrollX, y: y + height / 2 + scrollY },
      () => setConnections((oldConnections) => oldConnections + 1),
      () => setConnections((oldConnections) => Math.max(0, oldConnections - 1)),
    )
  }, [connectorContext, input, output])

  useEffect(() => {
    presetContext.register?.({ [label]: createConnection })

    return () => {
      presetContext.deregister?.([label])
    }
  }, [createConnection, label, presetContext])

  return (
    <div className={css.container}>
      <div
        className={`${css.indicator} ${css[indicatorType as string]}`}
        style={
          indicator !== undefined
            ? ({
                '--size': 35,
                '--value': indicator,
              } as CSSProperties)
            : undefined
        }
      >
        <div className={`${css.washer} ${css.round}`}>
          <div
            className={`${css.plug} ${connections > 0 ? css.plugged : ''}`}
            onMouseDown={createConnection}
            ref={plugRef}
          />
        </div>
      </div>

      <div className={css.label}>{label}</div>
    </div>
  )
}
