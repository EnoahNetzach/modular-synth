// Taken from https://github.com/dinchak/node-easymidi/blob/master/index.js

type Channel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15

interface Note {
  note: number
  velocity: number
  channel: Channel
}

interface PolyAfterTouch {
  note: number
  pressure: number
  channel: Channel
}

interface ControlChange {
  controller: number
  value: number
  channel: Channel
}

interface Program {
  number: number
  channel: Channel
}

interface ChannelAfterTouch {
  pressure: number
  channel: Channel
}

interface Pitch {
  value: number
  channel: Channel
}

interface Position {
  value: number
}

interface Mtc {
  type: number
  value: number
}

interface Select {
  song: number
}

interface Sysex {
  bytes: number[]
}

interface Smpte {
  smpte: string
  smpteType?: number
}

export type MIDIEvent =
  | ({ name: 'noteon' } & Note)
  | ({ name: 'noteoff' } & Note)
  | ({ name: 'poly aftertouch' } & PolyAfterTouch)
  | ({ name: 'cc' } & ControlChange)
  | ({ name: 'program' } & Program)
  | ({ name: 'channel aftertouch' } & ChannelAfterTouch)
  | ({ name: 'pitch' } & Pitch)
  | ({ name: 'position' } & Position)
  | ({ name: 'mtc' } & Mtc)
  | ({ name: 'select' } & Select)
  | { name: 'tune' }
  | { name: 'clock' }
  | { name: 'start' }
  | { name: 'continue' }
  | { name: 'stop' }
  | { name: 'activesense' }
  | { name: 'reset' }
  | ({ name: 'sysex' } & Sysex)
  | ({ name: 'sysex end' } & Sysex)
  | ({ name: 'smpte' } & Smpte)

const INPUT_TYPES: { [msg: number]: MIDIEvent['name'] } = {
  0x08: 'noteoff',
  0x09: 'noteon',
  0x0a: 'poly aftertouch',
  0x0b: 'cc',
  0x0c: 'program',
  0x0d: 'channel aftertouch',
  0x0e: 'pitch',
}
const INPUT_EXTENDED_TYPES: { [msg: number]: MIDIEvent['name'] } = {
  0xf0: 'sysex',
  0xf1: 'mtc',
  0xf2: 'position',
  0xf3: 'select',
  0xf6: 'tune',
  0xf7: 'sysex end',
  0xf8: 'clock',
  0xfa: 'start',
  0xfb: 'continue',
  0xfc: 'stop',
  0xfe: 'activesense',
  0xff: 'reset',
}

export default class MIDIInputParser {
  private sysex: number[] = []
  private pendingSysex: boolean = false

  parse(bytes: Uint8Array) {
    const events: MIDIEvent[] = []

    // a long sysex can be sent in multiple chunks, depending on the RtMidi buffer size
    let proceed = true
    if (this.pendingSysex && bytes.length > 0) {
      if (bytes[0] < 0x80) {
        this.sysex = this.sysex.concat([...bytes])
        if (bytes[bytes.length - 1] === 0xf7) {
          events.push({ bytes: this.sysex, name: 'sysex' })
          this.sysex = []
          this.pendingSysex = false
        }
        proceed = false
      } else {
        // ignore invalid sysex messages
        this.sysex = []
        this.pendingSysex = false
      }
    }
    if (proceed) {
      const data = this.parseMessage(bytes)
      if (!data) {
        return events
      }

      if (data.name === 'sysex' && bytes[bytes.length - 1] !== 0xf7) {
        this.sysex = [...bytes]
        this.pendingSysex = true
      } else {
        events.push(data)
        // also emit "message" event, to allow easy monitoring of all messages
        if (data.name === 'mtc') {
          events.push(...this.parseMtc(data))
        }
      }
    }

    return events
  }

  private parseMessage(bytes: Uint8Array): MIDIEvent | undefined {
    const name = bytes[0] >= 0xf0 ? INPUT_EXTENDED_TYPES[bytes[0]] : INPUT_TYPES[bytes[0] >> 4]
    const channel = (bytes[0] & 0xf) as Channel

    switch (name) {
      case 'noteon':
      case 'noteoff':
        return {
          channel,
          name,
          note: bytes[1],
          velocity: bytes[2],
        }
      case 'cc':
        return {
          channel,
          controller: bytes[1],
          name,
          value: bytes[2],
        }
      case 'poly aftertouch':
        return {
          channel,
          name,
          note: bytes[1],
          pressure: bytes[2],
        }
      case 'channel aftertouch':
        return {
          channel,
          name,
          pressure: bytes[1],
        }
      case 'program':
        return {
          channel,
          name,
          number: bytes[1],
        }
      case 'pitch':
      case 'position':
        return {
          channel,
          name,
          value: bytes[1] + bytes[2] * 128,
        }
      case 'sysex':
        return {
          bytes: [...bytes],
          name,
        }
      case 'select':
        return {
          name,
          song: bytes[1],
        }
      case 'mtc':
        return {
          name,
          type: (bytes[1] >> 4) & 0x07,
          value: bytes[1] & 0x0f,
        }
    }
  }

  private parseMtc(data: Mtc): MIDIEvent[] {
    const byteNumber = data.type
    const smpte = []
    let value = data.value
    let smpteMessageCounter = 0
    let smpteType

    if (byteNumber === 7) {
      const bits = []
      for (let i = 3; i >= 0; i--) {
        const bit = value & (1 << i) ? 1 : 0
        bits.push(bit)
      }
      value = bits[3]
      smpteType = bits[1] * 2 + bits[2]
    }
    smpte[byteNumber] = value
    if (smpteMessageCounter !== 7) {
      smpteMessageCounter++
      return []
    }
    if (byteNumber === 7) {
      const smpteFormatted =
        (smpte[7] * 16 + smpte[6]).toString().padStart(2, '0') +
        ':' +
        (smpte[5] * 16 + smpte[4]).toString().padStart(2, '0') +
        ':' +
        (smpte[3] * 16 + smpte[2]).toString().padStart(2, '0') +
        ':' +
        (smpte[1] * 16 + smpte[0]).toString().padStart(2, '0')

      return [
        {
          name: 'smpte',
          smpte: smpteFormatted,
          smpteType,
        },
      ]
    }

    return []
  }
}
