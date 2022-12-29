import { CSSProperties, PropsWithChildren } from 'react'
import css from './index.module.css'

interface Props {
  height?: number
  width?: number
}

export default function Panel({ children, height = 3, width = 1 }: PropsWithChildren<Props>) {
  return (
    <div
      className={css.container}
      style={
        {
          '--height': height,
          '--width': width,
        } as CSSProperties
      }
    >
      {children}
    </div>
  )
}
