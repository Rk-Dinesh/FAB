import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * Run an async loader and expose `{data, error, loading, reload}`.
 *
 * Every list and detail screen uses this, which is what gives the app a
 * consistent loading / empty / error story. `deps` behaves like an effect
 * dependency array. `loading` is derived from which request has landed, so the
 * hook never has to set state synchronously inside an effect — and the previous
 * data stays on screen while a refetch is in flight.
 *
 * @template T
 * @param {() => Promise<T>} loader
 * @param {Array<unknown>} [deps]
 * @param {{initialData?: T, enabled?: boolean}} [options]
 * @returns {{data: T|undefined, error: Error|null, loading: boolean, reload: () => void}}
 */
export function useAsync(loader, deps = [], options = {}) {
  const { initialData, enabled = true } = options
  const [nonce, setNonce] = useState(0)
  const [state, setState] = useState({ key: null, data: initialData, error: null })

  // Kept in a ref so a new inline loader on every render doesn't refetch.
  const loaderRef = useRef(loader)
  useEffect(() => {
    loaderRef.current = loader
  })

  const requestKey = useMemo(() => `${JSON.stringify(deps)}|${nonce}`, [deps, nonce])

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false

    loaderRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ key: requestKey, data, error: null })
      })
      .catch((error) => {
        if (!cancelled) setState({ key: requestKey, data: undefined, error })
      })

    return () => {
      cancelled = true
    }
  }, [requestKey, enabled])

  const reload = useCallback(() => setNonce((value) => value + 1), [])

  return {
    data: state.data,
    error: state.error,
    loading: enabled && state.key !== requestKey,
    reload,
  }
}
