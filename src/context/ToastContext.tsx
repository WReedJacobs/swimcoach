import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { Trophy, Info, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ToastType = 'pb' | 'feedback' | 'success' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

type AddToast = (toast: Omit<Toast, 'id'>) => void

const ToastContext = createContext<AddToast>(() => {})

export function useToast(): AddToast {
  return useContext(ToastContext)
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const icon =
    toast.type === 'pb' ? (
      <Trophy className="h-4 w-4 text-accent" />
    ) : toast.type === 'feedback' ? (
      <Info className="h-4 w-4 text-primary" />
    ) : (
      <CheckCircle2 className="h-4 w-4 text-secondary" />
    )

  const border =
    toast.type === 'pb'
      ? 'border-accent/30 bg-accent/10'
      : toast.type === 'feedback'
        ? 'border-primary/30 bg-primary/5'
        : 'border-secondary/30 bg-secondary/5'

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-card border p-3 shadow-lg',
        'animate-in slide-in-from-right-4 duration-200',
        border,
      )}
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
      <button onClick={onDismiss} className="shrink-0 text-text-muted hover:text-text-primary">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const add = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, 5000)
  }, [])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={add}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed right-4 top-4 z-[100] w-72 space-y-2">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}
