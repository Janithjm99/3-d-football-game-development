'use client'

import { useEffect, useRef } from 'react'

export default function FootballGame() {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let disposed = false
    let game: { dispose: () => void } | undefined
    import('@/lib/football/game.js').then(({ createGame }) => {
      if (!disposed && host.current) game = createGame(host.current)
    }).catch(() => {
      if (host.current) host.current.innerHTML = '<div class="game-error"><h1>Unable to load the stadium</h1><p>Please reload the page in a browser with WebGL 2 enabled.</p><button onclick="location.reload()">Reload game</button></div>'
    })
    return () => { disposed = true; game?.dispose() }
  }, [])
  return <main ref={host} className="football-app" aria-label="Floodlight football game"><div className="boot-screen"><span className="brand-mark">F</span><p>PREPARING THE PITCH<span className="loading-dots">...</span></p></div></main>
}
