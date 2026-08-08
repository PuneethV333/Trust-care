import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold text-slate-900">
        Trust Care
      </h1>
      <p className="text-slate-600 max-w-md text-center">
        React + TypeScript + Vite frontend, styled with Tailwind CSS.
      </p>
      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-500 transition-colors"
      >
        Count is {count}
      </button>
    </main>
  )
}

export default App
