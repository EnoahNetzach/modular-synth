import { css } from 'glamor'
import React from 'react'
import Cable from './Cable'

export const ConnectorContext = React.createContext(() => {})

const getCableStatus = ({ editing, selected }) => {
  if (selected) {
    return 'selected'
  } else if (editing) {
    return 'highlighted'
  }

  return ''
}

const container = css({
  position: 'relative',
})

const cables = css({
  height: '100%',
  position: 'absolute',
  width: '100%',
  zIndex: '1',
})

export default class Connector extends React.PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      connectionPositions: [],
      editing: false,
      failedConnecting: false,
      mousePosition: null,
      scrollPosition: { x: window.scrollX, y: window.scrollY },
      selectedCable: null,
    }

    this.onCableSelected = this.onCableSelected.bind(this)
    this.onConnect = this.onConnect.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onScroll = this.onScroll.bind(this)
  }

  componentDidMount() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('scroll', this.onScroll)
  }

  componentWillUnount() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('scroll', this.onScroll)
  }

  onCableSelected(i) {
    this.setState({ selectedCable: i })
  }

  onConnect(input, output, pos, onConnect = () => {}, onDisconnect = () => {}) {
    this.setState(
      ({ connectionPositions, mousePosition }) => {
        const lastConnection = connectionPositions.slice(-1)[0] || {}

        const isNewConnection = lastConnection === {} || (lastConnection.input && lastConnection.output)

        if (!isNewConnection) {
          const inputToInput = !!lastConnection.input && !!input
          const outputToOutput = !!lastConnection.output && !!output
          if (inputToInput || outputToOutput) {
            return { failedConnecting: true }
          }

          const duplicate = connectionPositions.find((connection, i) =>
            input
              ? connection.input &&
                connection.output &&
                lastConnection.output &&
                connection.input.node === input &&
                connection.output.node === lastConnection.output.node
              : connection.input &&
                connection.output &&
                lastConnection.input &&
                connection.input.node === lastConnection.input.node &&
                connection.output.node === output,
          )
          if (duplicate) {
            return { failedConnecting: true }
          }
        }

        const newConnection = input
          ? { input: { onConnect, onDisconnect, node: input, pos } }
          : { output: { onConnect, onDisconnect, node: output, pos } }

        return {
          connectionPositions: isNewConnection
            ? [...connectionPositions, { ...newConnection, handled: false }]
            : [...connectionPositions.slice(0, -1), { ...lastConnection, ...newConnection }],
          failedConnecting: false,
          mousePosition: isNewConnection ? pos : null,
          selectedCable: null,
          scrollPosition: { x: window.scrollX, y: window.scrollY },
        }
      },
      () => {
        if (this.state.failedConnecting) {
          return
        }

        const lastConnection = this.state.connectionPositions.slice(-1)[0] || {}

        if (input && lastConnection.input) {
          lastConnection.input.onConnect()
        }
        if (output && lastConnection.output) {
          lastConnection.output.onConnect()
        }
        if (lastConnection.input && lastConnection.output) {
          lastConnection.input.node.connect(lastConnection.output.node)
        }

        this.setState(({ connectionPositions }) => ({
          connectionPositions: connectionPositions.map(connection => ({
            ...connection,
            handled: !!(connection.input && connection.output),
          })),
        }))
      },
    )
  }

  onKeyDown(event) {
    if (
      event.key === 'c' &&
      !this.state.connectionPositions.find(connection => !connection.input || !connection.output)
    ) {
      this.setState({ editing: true })
    }

    if (['Backspace', 'Clear'].includes(event.key)) {
      this.setState(
        ({ connectionPositions, selectedCable }) =>
          selectedCable !== null
            ? {
                connectionPositions: [
                  ...connectionPositions.slice(0, selectedCable),
                  { ...connectionPositions[selectedCable], toDelete: true },
                  ...connectionPositions.slice(selectedCable + 1),
                ],
                selectedCable: null,
              }
            : undefined,
        this.deleteConnections,
      )
    }

    if (event.key === 'Escape') {
      this.setState(
        ({ connectionPositions }) => ({
          editing: false,
          connectionPositions: connectionPositions.map(connection => ({
            ...connection,
            toDelete: !connection.input || !connection.output,
          })),
          mousePosition: null,
          selectedCable: null,
        }),
        this.deleteConnections,
      )
    }
  }

  onMouseMove(event) {
    if (this.state.connectionPositions.find(connection => !connection.input || !connection.output)) {
      this.setState({ mousePosition: { x: event.clientX, y: event.clientY } })
    }
  }

  onScroll() {
    if (this.state.connectionPositions.find(connection => !connection.input || !connection.output)) {
      this.setState({ scrollPosition: { x: window.scrollX, y: window.scrollY } })
    }
  }

  deleteConnections() {
    this.state.connectionPositions
      .filter(connection => connection.toDelete)
      .forEach(connection => {
        if (connection.input) {
          connection.input.onDisconnect()
        }
        if (connection.output) {
          connection.output.onDisconnect()
        }
        if (connection.input && connection.output) {
          connection.input.node.connect(connection.output.node)
        }
      })

    this.setState(({ connectionPositions }) => ({
      connectionPositions: connectionPositions.filter(connection => !connection.toDelete),
    }))
  }

  render() {
    const { children } = this.props
    const { connectionPositions, editing, mousePosition, scrollPosition, selectedCable } = this.state

    const danglingCable = connectionPositions.find(connection => !connection.input || !connection.output)
    const danglingPos = danglingCable && (danglingCable.input || danglingCable.output).pos

    return (
      <div {...container}>
        <div
          {...cables}
          style={{
            pointerEvents: editing ? '' : 'none',
          }}
        >
          {connectionPositions
            .filter(connection => connection.input && connection.output)
            .map(({ input: { pos: p1 }, output: { pos: p2 } }, i) => (
              <Cable
                key={`${p1.x}_${p2.x}_${p1.y}_${p2.y}`}
                onSelect={() => this.onCableSelected(i)}
                status={getCableStatus({ editing, selected: i === selectedCable })}
                x1={p1.x}
                x2={p2.x}
                y1={p1.y}
                y2={p2.y}
              />
            ))}

          {mousePosition && danglingCable ? (
            <Cable
              status="selected"
              x1={danglingPos.x}
              x2={mousePosition.x + scrollPosition.x}
              y1={danglingPos.y}
              y2={mousePosition.y + scrollPosition.y}
            />
          ) : null}
        </div>

        <ConnectorContext.Provider value={this.onConnect}>{children}</ConnectorContext.Provider>
      </div>
    )
  }
}
