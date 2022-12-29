import { CSSProperties, useMemo } from 'react'
import * as uuid from 'uuid'
import css from './index.module.css'
import catenary from './catenary'

export type Status = 'selected' | 'highlighted' | ''

interface Props {
  onSelect?: () => void
  status: Status
  x1: number
  x2: number
  y1: number
  y2: number
}

export default function Cable({ onSelect, status, x1, x2, y1, y2 }: Props) {
  const outlineFilterId = useMemo(() => uuid.v4(), [])
  const d = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  const l = Math.max(50, d + 0.1 * d)
  const chain = catenary(x1, y1, x2, y2, l, 30)

  return (
    <svg className={css.container} style={{ zIndex: status === 'selected' ? 10 : 'auto' }}>
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
        className={css.cable}
        data-status={status}
        onClick={onSelect}
        points={chain.map(([x, y]) => `${x} ${y}`).join(', ')}
        style={
          {
            '--outline-filter-id-url': `url(#${outlineFilterId})`,
          } as CSSProperties
        }
      />
    </svg>
  )
}
