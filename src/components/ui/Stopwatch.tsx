import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Flag } from 'lucide-react'
import { formatStopwatch } from '@/lib/formatTime'
import { Button } from './Button'

export interface StopwatchHandle {
  elapsedMs: number
  laps: number[]
}

/**
 * Reusable stopwatch with start / stop / reset / lap.
 * Reports elapsed seconds on stop via onStop so the parent can log a time.
 * Uses performance.now via rAF for drift-free display; state kept minimal
 * so the logic ports cleanly to React Native (swap rAF for an interval).
 */
export function Stopwatch({
  onStop,
  accent = 'default',
}: {
  onStop?: (seconds: number, laps: number[]) => void
  accent?: 'default' | 'coral'
}) {
  const [elapsed, setElapsed] = useState(0) // ms
  const [running, setRunning] = useState(false)
  const [laps, setLaps] = useState<number[]>([])
  const startRef = useRef(0)
  const baseRef = useRef(0)
  const rafRef = useRef<number>()

  const tick = useCallback(() => {
    setElapsed(baseRef.current + (performance.now() - startRef.current))
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const start = () => {
    if (running) return
    startRef.current = performance.now()
    setRunning(true)
    rafRef.current = requestAnimationFrame(tick)
  }

  const stop = () => {
    if (!running) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    baseRef.current = elapsed
    setRunning(false)
    onStop?.(elapsed / 1000, laps.map((l) => l / 1000))
  }

  const reset = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    baseRef.current = 0
    setElapsed(0)
    setLaps([])
    setRunning(false)
  }

  const lap = () => {
    if (running) setLaps((prev) => [...prev, elapsed])
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="font-mono text-6xl font-semibold tabular-nums tracking-tight text-text-primary">
        {formatStopwatch(elapsed)}
      </div>

      <div className="flex items-center gap-3">
        {!running ? (
          <Button size="lg" accent={accent} leftIcon={<Play className="h-5 w-5" />} onClick={start}>
            {elapsed > 0 ? 'Resume' : 'Start'}
          </Button>
        ) : (
          <Button size="lg" variant="danger" leftIcon={<Pause className="h-5 w-5" />} onClick={stop}>
            Stop
          </Button>
        )}
        <Button
          size="lg"
          variant="outline"
          leftIcon={<Flag className="h-5 w-5" />}
          onClick={lap}
          disabled={!running}
        >
          Lap
        </Button>
        <Button
          size="lg"
          variant="ghost"
          leftIcon={<RotateCcw className="h-5 w-5" />}
          onClick={reset}
          disabled={elapsed === 0}
        >
          Reset
        </Button>
      </div>

      {laps.length > 0 && (
        <div className="w-full max-w-xs space-y-1">
          {laps.map((l, i) => (
            <div
              key={i}
              className="flex justify-between border-b border-border py-1 text-sm text-text-secondary"
            >
              <span>Lap {i + 1}</span>
              <span className="font-mono tabular-nums">{formatStopwatch(l)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
