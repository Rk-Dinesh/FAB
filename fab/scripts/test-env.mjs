/**
 * Shared jsdom + Vite environment for the gate scripts.
 *
 * jsdom has no layout engine, so elements report 0×0 and chart libraries refuse
 * to render. This module installs a fixed viewport box and a ResizeObserver that
 * actually reports one, so charts render the same way they do in a browser.
 */
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const VIEWPORT = { width: 1280, height: 800 }
const ELEMENT_BOX = { width: 900, height: 320 }

/**
 * Install the DOM globals React and the app expect.
 * @returns {{window: import('jsdom').DOMWindow, container: HTMLElement}}
 */
export function setupDom() {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
  })
  const { window } = dom

  globalThis.window = window
  globalThis.document = window.document
  globalThis.localStorage = window.localStorage
  globalThis.sessionStorage = window.sessionStorage
  Object.defineProperty(globalThis, 'navigator', {
    value: window.navigator,
    configurable: true,
    writable: true,
  })
  for (const key of [
    'HTMLElement', 'HTMLInputElement', 'HTMLSelectElement', 'HTMLTextAreaElement',
    'Element', 'Node', 'Event', 'KeyboardEvent', 'MouseEvent', 'SVGElement',
  ]) {
    globalThis[key] = window[key]
  }
  globalThis.getComputedStyle = window.getComputedStyle.bind(window)
  globalThis.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 0)
  globalThis.cancelAnimationFrame = (handle) => clearTimeout(handle)
  globalThis.IS_REACT_ACT_ENVIRONMENT = true

  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })
  window.scrollTo = () => {}
  window.HTMLElement.prototype.scrollIntoView = () => {}
  window.SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 200, height: 20 })

  // Give every element a non-zero box. Recharts (and anything measuring layout)
  // otherwise warns about a 0×0 container and renders nothing.
  for (const [property, value] of [
    ['offsetWidth', ELEMENT_BOX.width],
    ['offsetHeight', ELEMENT_BOX.height],
    ['clientWidth', ELEMENT_BOX.width],
    ['clientHeight', ELEMENT_BOX.height],
  ]) {
    Object.defineProperty(window.HTMLElement.prototype, property, {
      configurable: true,
      get() {
        return value
      },
    })
  }
  window.Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: ELEMENT_BOX.width,
      bottom: ELEMENT_BOX.height,
      width: ELEMENT_BOX.width,
      height: ELEMENT_BOX.height,
      toJSON: () => ({}),
    }
  }

  class ResizeObserverStub {
    constructor(callback) {
      this.callback = callback
    }
    observe(target) {
      setTimeout(() => {
        this.callback?.(
          [{ target, contentRect: { ...ELEMENT_BOX, top: 0, left: 0, x: 0, y: 0 } }],
          this,
        )
      }, 0)
    }
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub
  window.ResizeObserver = ResizeObserverStub

  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.IntersectionObserver = IntersectionObserverStub
  window.IntersectionObserver = IntersectionObserverStub

  Object.defineProperty(window, 'innerWidth', { value: VIEWPORT.width, writable: true })
  Object.defineProperty(window, 'innerHeight', { value: VIEWPORT.height, writable: true })

  return { window, container: window.document.getElementById('root') }
}

/**
 * A Vite dev server in middleware mode for loading the app's modules.
 *
 * React and the router are marked external so the transformed app modules share
 * the exact instances this process imported. Everything else is externalised by
 * Vite's default SSR behaviour, which is what keeps CJS dependencies working.
 */
export function setupVite() {
  return createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    logLevel: 'error',
    ssr: { external: ['react', 'react-dom', 'react-router-dom', 'react-router'] },
  })
}

/** React pieces, imported natively so there is only ever one copy. */
export async function loadReact() {
  const [reactModule, clientModule, routerModule] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('react-router-dom'),
  ])
  const React = reactModule.default ?? reactModule
  return {
    React,
    act: reactModule.act ?? React.act,
    createRoot: clientModule.createRoot,
    createMemoryRouter: routerModule.createMemoryRouter,
    RouterProvider: routerModule.RouterProvider,
  }
}
