import {
  ContextType,
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

type RegisterCb = (...args: any[]) => void

export const PresetContext = createContext<{
  deregister?: (keys: string[]) => void
  id: string
  register?: (connectors: { [key: string]: RegisterCb }) => void
}>({
  deregister: undefined,
  id: '',
  register: undefined,
})

interface Props {
  defaultConnections?: [string, string][]
  defaultParams?: [string, any[]][]
  id: string
}

export default function Preset({ children, defaultConnections, defaultParams, id }: PropsWithChildren<Props>) {
  const preset = useContext(PresetContext)

  const [registrations, setRegistrations] = useState<{ [key: string]: RegisterCb }>({})
  const [registered, setRegistered] = useState(false)

  const register = useCallback<NonNullable<ContextType<typeof PresetContext>['register']>>(
    (connections) =>
      preset.register
        ? preset.register(connections)
        : setRegistrations((prevState) => ({ ...prevState, ...connections })),
    [preset],
  )

  const deregister = useCallback<NonNullable<ContextType<typeof PresetContext>['deregister']>>(
    (keys) =>
      preset.deregister
        ? preset.deregister(keys)
        : setRegistrations((prevState) =>
            keys.reduce(
              (all, key) => {
                delete prevState[key]
                return prevState
              },
              { ...prevState },
            ),
          ),
    [preset],
  )

  const presetContext = useMemo(
    () => ({
      deregister:
        id === ''
          ? deregister
          : (keys: string[]) => {
              deregister(keys.map((key) => `${id}.${key}`))
            },
      id,
      register:
        id === ''
          ? register
          : (connectors: { [key: string]: RegisterCb }) => {
              register(
                Object.keys(connectors).reduce((acc, key) => ({ ...acc, [`${id}.${key}`]: connectors[key] }), {}),
              )
            },
    }),
    [deregister, id, register],
  )

  useEffect(() => {
    if (defaultConnections?.length === 0 || registered || Object.keys(registrations).length === 0) {
      return
    }

    setRegistered(true)

    defaultConnections?.forEach(([input, output]) => {
      if (input in registrations && output in registrations) {
        registrations[input]()
        registrations[output]()
      }
    })
  }, [defaultConnections, registered, registrations])

  useEffect(() => {
    if (defaultParams?.length === 0 || registered || Object.keys(registrations).length === 0) {
      return
    }

    setRegistered(true)

    defaultParams?.forEach(([param, args]) => {
      if (param in registrations) {
        registrations[param](...args)
      }
    })
  }, [defaultParams, registered, registrations])

  return <PresetContext.Provider value={presetContext}>{children}</PresetContext.Provider>
}
