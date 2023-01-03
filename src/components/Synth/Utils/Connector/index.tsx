import { createContext, CSSProperties, PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react'
import * as uuid from 'uuid'
import css from './index.module.css'
import GateNode from '../../../../utils/GateNode'
import Cable, { Status } from './Cable'

export interface Position {
  readonly x: number
  readonly y: number
}

export interface IOput {
  readonly node: AudioNode | AudioParam
  readonly onConnect: () => void
  readonly onDisconnect: () => void
  readonly pos: Position
}

export interface Connection {
  readonly input: IOput
  readonly output: IOput
}

export type DanglingConnection = Omit<Connection, 'input'> | Omit<Connection, 'output'>

export const ConnectorContext = createContext(
  (
    input: AudioNode | AudioParam | undefined,
    output: AudioNode | AudioParam | undefined,
    pos: Position,
    onConnect = () => {},
    onDisconnect = () => {},
  ) => {},
)

const getCableStatus = ({ editing, selected }: { editing?: boolean; selected?: boolean }): Status => {
  if (selected) {
    return 'selected'
  } else if (editing) {
    return 'highlighted'
  }

  return ''
}

interface Props {}

export default function Connector({ children }: PropsWithChildren<Props>) {
  const [connections, setConnections] = useState<{
    dangling?: DanglingConnection
    positions: Connection[]
    toConnect: (() => void)[]
  }>({
    positions: [],
    toConnect: [],
  })
  const [editing, setEditing] = useState(false)
  const [cablesOpacity, setCablesOpacity] = useState(1)
  const [mousePosition, setMousePosition] = useState<Position>()
  const [scrollPosition, setScrollPosition] = useState({ x: window.scrollX, y: window.scrollY })
  const [selectedCable, setSelectedCable] = useState<number>()
  const [cableToDelete, setCableToDelete] = useState<number>()

  const outlineFilterId = useMemo(() => uuid.v4(), [])

  const connect = useCallback(
    (
      input: AudioNode | AudioParam | undefined,
      output: AudioNode | AudioParam | undefined,
      pos: Position,
      onConnect = () => {},
      onDisconnect = () => {},
    ) =>
      setConnections((connections) => {
        const { dangling, positions, toConnect } = connections

        if (dangling) {
          const inputToInput = 'input' in dangling && !!input
          const outputToOutput = 'output' in dangling && !!output
          if (inputToInput || outputToOutput) {
            return connections
          }

          const duplicate = positions.find((connection, i) =>
            input
              ? 'input' in connection &&
                'output' in connection &&
                'output' in dangling &&
                connection.input.node === input &&
                connection.output.node === dangling.output.node
              : 'input' in connection &&
                'output' in connection &&
                'input' in dangling &&
                connection.input.node === dangling.input.node &&
                connection.output.node === output,
          )
          if (duplicate) {
            return connections
          }
        }

        const newConnection: DanglingConnection = input
          ? { input: { onConnect, onDisconnect, node: input, pos } }
          : { output: { onConnect, onDisconnect, node: output as AudioNode, pos } }

        setMousePosition(!dangling ? pos : undefined)
        setSelectedCable(undefined)
        setScrollPosition({ x: window.scrollX, y: window.scrollY })

        if (dangling) {
          if (input && 'output' in dangling && 'connect' in input) {
            input.connect(dangling.output.node as AudioNode)
          }

          if (output && 'input' in dangling && 'connect' in dangling.input.node) {
            dangling.input.node.connect(output as AudioNode)
          }

          return {
            dangling: undefined,
            positions: [...positions, { ...dangling, ...newConnection } as Connection],
            toConnect: [...toConnect, onConnect],
          }
        } else {
          return {
            dangling: newConnection,
            positions,
            toConnect: [...toConnect, onConnect],
          }
        }
      }),
    [],
  )

  useEffect(() => {
    if (connections.toConnect.length === 0) {
      return
    }

    connections.toConnect.forEach((onConnect) => onConnect())

    setConnections({ ...connections, toConnect: [] })
  }, [connections])

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'c') {
        setEditing(!connections.positions.find((connection) => !('input' in connection) || !('output' in connection)))
        return
      }

      if (event.key === 'z') {
        setCablesOpacity((opacity) => (opacity === 1 ? 0.2 : 1))
        return
      }

      if (['Backspace', 'Clear'].includes(event.key)) {
        if (selectedCable === undefined) {
          return
        }

        setSelectedCable(undefined)
        setCableToDelete(selectedCable)
        return
      }

      if (event.key === 'Escape') {
        setEditing(false)
        setMousePosition(undefined)
        setSelectedCable(undefined)
        setConnections((connections) => ({ ...connections, dangling: undefined }))
        return
      }
    },
    [connections.positions, selectedCable],
  )

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      if (connections.dangling) {
        setMousePosition({ x: event.clientX, y: event.clientY })
      }
    },
    [connections.dangling],
  )

  const onScroll = useCallback(() => {
    if (connections.dangling) {
      setScrollPosition({ x: window.scrollX, y: window.scrollY })
    }
  }, [connections.dangling])

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('scroll', onScroll)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [onKeyDown, onMouseMove, onScroll])

  useEffect(() => {
    if (cableToDelete === undefined) {
      return
    }

    const toDelete = connections.positions[cableToDelete]

    if ('input' in toDelete) {
      toDelete.input.onDisconnect()
    }
    if ('output' in toDelete) {
      toDelete.output.onDisconnect()
    }
    if ('input' in toDelete && 'output' in toDelete && 'disconnect' in toDelete.input.node) {
      toDelete.input.node.disconnect(toDelete.output.node as AudioNode)
    }

    setCableToDelete(undefined)
    setConnections(({ dangling, toConnect }) => ({
      dangling,
      positions: [...connections.positions.slice(0, cableToDelete), ...connections.positions.slice(cableToDelete + 1)],
      toConnect,
    }))
  }, [cableToDelete, connections.dangling, connections.positions])

  return (
    <>
      <div
        className={css.cables}
        style={
          {
            '--opacity': cablesOpacity,
            pointerEvents: editing ? undefined : 'none',
          } as CSSProperties
        }
      >
        <svg className={css.container}>
          <filter
            id={outlineFilterId}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="linearRGB"
          >
            <feGaussianBlur
              stdDeviation="5 5"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              in="colormatrix"
              edgeMode="duplicate"
              result="blur"
            />
            <feColorMatrix
              type="hueRotate"
              values="20"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              in="blur"
              result="colormatrix"
            />
            <feMerge x="0%" y="0%" width="100%" height="100%" result="merge1">
              <feMergeNode in="merge1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <g>
            {connections.positions.map(({ input: { pos: p1, ...input }, output: { pos: p2, ...output } }, i) => (
              <Cable
                key={`${p1.x}_${p2.x}_${p1.y}_${p2.y}`}
                id={`${p1.x}_${p2.x}_${p1.y}_${p2.y}`}
                isGate={input.node instanceof GateNode || output.node instanceof GateNode}
                onSelect={() => setSelectedCable(i)}
                outlineFilterId={outlineFilterId}
                status={getCableStatus({ editing, selected: i === selectedCable })}
                x1={p1.x}
                x2={p2.x}
                y1={p1.y}
                y2={p2.y}
              />
            ))}

            {connections.dangling && mousePosition && scrollPosition ? (
              <Cable
                status="selected"
                id="dangling"
                outlineFilterId={outlineFilterId}
                x1={
                  ('input' in connections.dangling ? connections.dangling.input.pos : connections.dangling.output.pos).x
                }
                x2={mousePosition.x + scrollPosition.x}
                y1={
                  ('input' in connections.dangling ? connections.dangling.input.pos : connections.dangling.output.pos).y
                }
                y2={mousePosition.y + scrollPosition.y}
              />
            ) : null}
          </g>

          {!editing ? (
            <g>
              {connections.positions.map(({ input: { pos: p1 }, output: { pos: p2 } }, i) => (
                <use key={`${p1.x}_${p2.x}_${p1.y}_${p2.y}`} xlinkHref={`#${p1.x}_${p2.x}_${p1.y}_${p2.y}_high`} />
              ))}

              {connections.dangling ? <use xlinkHref="#dangling_high" /> : null}
            </g>
          ) : null}
        </svg>
      </div>

      <ConnectorContext.Provider value={connect}>{children}</ConnectorContext.Provider>
    </>
  )
}
