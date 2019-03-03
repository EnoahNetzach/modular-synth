import { css } from 'glamor'
import React from 'react'
import uuid from 'uuid'
import catenary from './catenary'

const outlineFilterId = uuid.v4()

const container = css({
  pointerEvents: 'none',
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
})

const cable = css({
  fill: 'none',
  pointerEvents: 'none',
  stroke: 'rgb(93, 206, 8)',
  strokeWidth: '7px',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
})

const cableStatus = {
  highlighted: css({
    pointerEvents: 'visibleStroke',
    stroke: 'rgb(206, 93, 8)',
  }),
  selected: css({
    filter: `url(#${outlineFilterId})`,
    stroke: 'rgb(8, 93, 206)',
  }),
}

export default class JackPlug extends React.PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      connected: false,
    }

    this.plugRef = React.createRef()
  }

  getPoints(x1, y1, x2, y2) {
    return ''
  }

  render() {
    const { onSelect, status, x1, x2, y1, y2 } = this.props

    const d = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    const l = Math.max(50, d + 0.1 * d)
    const chain = catenary(x1, y1, x2, y2, l, 30)

    return (
      <svg {...container} style={{ zIndex: status === 'selected' ? 10 : 'auto' }}>
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

        <polyline
          className={`${cable} ${cableStatus[status]}`}
          onClick={onSelect}
          points={chain.map(([x, y]) => `${x} ${y}`).join(', ')}
        />
      </svg>
    )
  }
}
