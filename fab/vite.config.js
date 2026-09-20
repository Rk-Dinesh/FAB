import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// The scaffold originally enabled the React Compiler via
// `babel({ presets: [reactCompilerPreset()] })`. It is deliberately off.
//
// The compiler hoists property reads out of a closure and into its
// memoisation guard *without* preserving null-safety, which turns ordinary
// code into a render-time crash:
//
//   useMemo(() => data?.leaves ?? [], [data])
//     → if ($[3] !== data.leaves) { ... }        // throws while data is undefined
//
//   const save = async () => { ...editing.id... }
//     → if ($[6] !== editing.id || ...) { ... }  // throws while editing is null
//
// That broke three pages in the browser (design requests, cost sheets, leave)
// while every jsdom check passed, because the Babel transform only runs in the
// client build. Auto-memoisation buys this app nothing at demo scale, so it is
// not worth a whole class of latent crashes. `npm run browser` guards the
// regression either way.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // The largest chunk is the seeded mock database (~922 kB raw, ~95 kB gzipped).
    // It is code-split away from the marketing site and loads only when an app
    // screen needs it, so the default 500 kB warning is not meaningful here.
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
