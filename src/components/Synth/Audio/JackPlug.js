import { css } from 'glamor'
import React from 'react'
import { ConnectorContext } from './Connector'

const container = css({
  alignItems: 'center',
  color: '#1d1a1a',
  display: 'flex',
  flexDirection: 'column',
  fontWeight: 'bold',
  justifyContent: 'center',
  margin: '5px',
})

const plug = css({
  border: '2px solid #444',
  borderRadius: '50%',
  display: 'block',
  height: '20px',
  margin: '2px',
  minHeight: '20px',
  minWidth: '20px',
  position: 'relative',
  width: '20px',
  ':before': {
    background: '#aaa',
    border: '2px solid #aaa',
    content: '""',
    display: 'block',
    borderRadius: '50%',
    height: '12px',
    left: '0',
    position: 'absolute',
    top: '0',
    width: '12px',
  },
})

const pluggedIn = css({
  ':before': {
    background: '#2f2f2f',
    borderColor: '#404040',
  },
})

export default class JackPlug extends React.PureComponent {
  static contextType = ConnectorContext

  constructor(props) {
    super(props)

    this.state = {
      connections: 0,
    }

    this.plugRef = React.createRef()
  }

  render() {
    return (
      <div {...container}>
        <div
          className={`${plug} ${this.state.connections > 0 ? pluggedIn : ''}`}
          onMouseDown={() => {
            const { scrollX, scrollY } = window
            const { height, width, x, y } = this.plugRef.current.getBoundingClientRect()

            this.context(
              this.props.input,
              this.props.output,
              { x: x + width / 2 + scrollX, y: y + height / 2 + scrollY },
              () => this.setState(({ connections }) => ({ connections: connections + 1 })),
              () => this.setState(({ connections }) => ({ connections: Math.max(0, connections - 1) })),
            )
          }}
          ref={this.plugRef}
        />

        <div>{this.props.label}</div>
      </div>
    )
  }
}
