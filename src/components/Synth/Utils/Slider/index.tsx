import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as uuid from 'uuid'
import css from './index.module.css'
import GateNode from '../../../../utils/GateNode'
import JackPlug from '../JackPlug'
import Preset, { PresetContext } from '../Preset'

interface Props<T extends string | number> {
  control?: AudioNode | AudioParam
  defaultValue?: T
  editable?: boolean
  label: string
  max?: number
  min?: number
  onChange: (value: T) => void
  precision?: number
  step?: number
  transformer?: (value: T) => string
  unit?: string
  value: T
}

export default function Slider<T extends string | number>({
  control,
  defaultValue,
  editable,
  label,
  max,
  min,
  onChange,
  precision,
  step,
  transformer,
  unit = '',
  value,
}: Props<T>) {
  const presetContext = useContext(PresetContext)

  const [editing, setEditing] = useState(false)
  const [editingValue, setEditingValue] = useState<T>(value)

  const sliderRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLInputElement>(null)

  const labelId = useMemo(() => uuid.v4(), [])

  useEffect(() => {
    if (editing) {
      setEditingValue(value)
      editorRef.current?.focus()
    }
  }, [editing, value])

  const onEdited = useCallback(
    (event: { key: string }) => {
      if (event.key === 'Enter') {
        setEditing(false)

        if (typeof value === 'number') {
          let tempValue: number = Number.parseFloat(editingValue.toString())

          if (Number.isNaN(tempValue) || !Number.isFinite(tempValue)) {
            tempValue = value
          }

          if (min !== undefined) {
            tempValue = Math.max(min, tempValue)
          }
          if (max !== undefined) {
            tempValue = Math.min(max, tempValue)
          }

          onChange(tempValue as T)
        }
      }
    },
    [editingValue, max, min, onChange, value],
  )

  useEffect(() => {
    presetContext.register?.({ [label]: onChange })

    return () => {
      presetContext.deregister?.([label])
    }
  }, [label, onChange, presetContext])

  return (
    <div className={css.container}>
      {control ? (
        <Preset id={label}>
          <div className={css.plug}>
            <JackPlug output={control} label={control instanceof GateNode ? 'GIn' : 'In'} />
          </div>
        </Preset>
      ) : null}

      <div
        className={css.manual}
        onClick={(event) => {
          if (defaultValue !== undefined && (event.ctrlKey || event.metaKey)) {
            event.preventDefault()
            sliderRef.current?.blur()

            onChange(defaultValue)
          }
        }}
      >
        <div className={css.element}>
          <label className={css.title} htmlFor={labelId}>
            {label}
          </label>
        </div>

        <div className={css.element}>
          <input
            className={css.slider}
            id={labelId}
            max={max}
            min={min}
            onChange={(event) =>
              onChange((typeof value === 'number' ? Number.parseFloat(event.target.value) : event.target.value) as T)
            }
            ref={sliderRef}
            step={step}
            type="range"
            value={value}
          />
        </div>

        <div className={css.element} onDoubleClick={() => setEditing(!!editable)}>
          {editing ? (
            <input
              className={css.editor}
              max={max}
              min={min}
              onChange={(event) => setEditingValue(event.target.value as T)}
              onKeyUp={onEdited}
              ref={editorRef}
              step={step}
              type="text"
              value={editingValue}
            />
          ) : (
            <label className={css.amount} htmlFor={labelId}>
              {transformer ? transformer(value) : `${Number(value).toFixed(precision)}`}
              {unit}
            </label>
          )}
        </div>
      </div>
    </div>
  )
}
