import { CSSProperties, useMemo } from 'react'
import css from './index.module.css'
import catenary from './catenary'

export type Status = 'selected' | 'highlighted' | ''

interface Props {
  id: string
  isGate?: boolean
  onSelect?: () => void
  outlineFilterId: string
  status: Status
  x1: number
  x2: number
  y1: number
  y2: number
}

export default function Cable({ id, isGate, onSelect, outlineFilterId, status, x1, x2, y1, y2 }: Props) {
  const d = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  const l = Math.max(50, d + 0.1 * d)
  const chain = useMemo(() => {
    const chain = catenary(x1, y1, x2, y2, l, 30)
    const min = [...chain].sort(([x1, y1], [x2, y2]) => y2 - y1)[0]
    const indexOfMin = chain.indexOf(min)

    const chainHalves = [chain.slice(0, indexOfMin + 1), chain.slice(indexOfMin)]

    return chain[0][1] > chain.slice(-1)[0][1] ? chainHalves : chainHalves.reverse()
  }, [l, x1, x2, y1, y2])

  return (
    <>
      <polyline
        className={`${css.cable} ${isGate ? css.gate : ''}`}
        data-status={status}
        id={`${id}_low`}
        onClick={onSelect}
        points={chain[0].map(([x, y]) => `${x} ${y}`).join(', ')}
        style={
          {
            '--outline-filter-id-url': `url(#${outlineFilterId})`,
          } as CSSProperties
        }
      />

      <polyline
        className={`${css.cable} ${isGate ? css.gate : ''}`}
        data-status={status}
        id={`${id}_high`}
        onClick={onSelect}
        points={chain[1].map(([x, y]) => `${x} ${y}`).join(', ')}
        style={
          {
            '--outline-filter-id-url': `url(#${outlineFilterId})`,
          } as CSSProperties
        }
      />
    </>
  )
}
