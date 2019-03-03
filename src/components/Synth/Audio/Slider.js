import { css } from 'glamor'
import React from 'react'
import JackPlug from './JackPlug'

const height = 20
const width = 90

const container = css({
  margin: '10px 5px 0',
  position: 'relative',
})

const plug = css({
  alignItems: 'center',
  display: 'flex',
  height: '100 %',
  justifyContent: 'center',
  height: '100%',
  left: '-30px',
  position: 'absolute',
  top: '0',
  transform: 'scale(0.8)',
})

const manual = css({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  height: `${height * 3}px`,
  justifyContent: 'center',
  width: `${width}px`,
})

const element = css({
  height: `${height}px`,
})

const labelId = css({})
const title = css({
  fontWeight: 'bold',
})

const slider = css({
  margin: 0,
  width: `${width}px`,
})

const editor = css({
  border: 'none',
  width: `${width}px`,
})

const amount = css({
  fontSize: '0.8em',
})

export default class Slider extends React.PureComponent {
  static defaultProps = {
    editable: false,
    precision: 0,
    unit: '',
  }

  constructor(props) {
    super(props)

    this.state = {
      editing: false,
      value: this.props.value,
    }

    this.editorRef = React.createRef()
    this.sliderRef = React.createRef()

    this.onEdit = this.onEdit.bind(this)
    this.onEdited = this.onEdited.bind(this)
  }

  onEdit(event) {
    this.setState({ value: event.target.value })
  }

  onEdited(event) {
    if (event.key === 'Enter') {
      this.setState({ editing: false }, () => {
        let { value } = this.state
        const { max, min } = this.props

        if (typeof min !== 'undefined') {
          value = Math.max(min, value)
        }
        if (typeof max !== 'undefined') {
          value = Math.min(max, value)
        }

        this.props.onChange(value)
      })
    }
  }

  render() {
    const {
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
      unit,
      value,
    } = this.props

    return (
      <div {...container}>
        {control ? (
          <div {...plug}>
            <JackPlug output={control} label="In" />
          </div>
        ) : null}

        <div
          {...manual}
          onClick={event => {
            if (typeof defaultValue !== 'undefined' && (event.ctrlKey || event.metaKey)) {
              event.preventDefault()
              this.sliderRef.current.blur()

              onChange(defaultValue)
            }
          }}
        >
          <div {...element}>
            <label {...title} htmlFor={labelId}>
              {label}
            </label>
          </div>

          <div {...element}>
            <input
              {...slider}
              id={labelId}
              max={max}
              min={min}
              onChange={event => onChange(event.target.value)}
              ref={this.sliderRef}
              step={step}
              type="range"
              value={value}
            />
          </div>

          <div
            {...element}
            onDoubleClick={() =>
              this.setState({ editing: editable }, () => this.state.editing && this.editorRef.current.focus())
            }
          >
            {this.state.editing ? (
              <input
                {...editor}
                max={max}
                min={min}
                onChange={this.onEdit}
                onKeyPress={this.onEdited}
                ref={this.editorRef}
                step={step}
                type="text"
                value={this.state.value}
              />
            ) : (
              <label {...amount} htmlFor={labelId}>
                {transformer ? transformer(value) : `${Number(value).toFixed(precision)}`} {unit}
              </label>
            )}
          </div>
        </div>
      </div>
    )
  }
}
