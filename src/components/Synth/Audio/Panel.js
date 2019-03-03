import { css } from 'glamor'
import React from 'react'

const container = css({
  alignItems: 'center',
  background: '#675a4e',
  border: '3px solid #444',
  borderRadius: '3px',
  color: '#d1d8de',
  display: 'flex',
  flexDirection: 'column',
  margin: '1px',
  padding: '15px',
})

export default class Panel extends React.PureComponent {
  static defaultProps = {
    height: 3,
    width: 1,
  }

  render() {
    return (
      <div
        {...container}
        style={{
          gridColumn: `span ${this.props.width}`,
          gridRow: `span ${this.props.height}`,
        }}
      >
        {this.props.children}
      </div>
    )
  }
}
