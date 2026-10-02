import { useEffect, useState } from 'react'
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react'

const getToastType = (message = '') => {
  const text = message.toLowerCase()

  if (
    text.includes('error') ||
    text.includes('no se pudo') ||
    text.includes('inválid') ||
    text.includes('obligatorio') ||
    text.includes('completa') ||
    text.includes('revisa')
  ) {
    return 'error'
  }

  if (
    text.includes('guardado') ||
    text.includes('creado') ||
    text.includes('actualizado') ||
    text.includes('eliminado') ||
    text.includes('correctamente') ||
    text.includes('listo')
  ) {
    return 'success'
  }

  return 'info'
}

const playToastSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    const audio = new AudioContext()
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()

    oscillator.connect(gain)
    gain.connect(audio.destination)

    if (type === 'success') {
      oscillator.frequency.setValueAtTime(880, audio.currentTime)
      oscillator.frequency.setValueAtTime(1175, audio.currentTime + 0.08)
    } else if (type === 'error') {
      oscillator.frequency.setValueAtTime(260, audio.currentTime)
      oscillator.frequency.setValueAtTime(220, audio.currentTime + 0.12)
    } else {
      oscillator.frequency.setValueAtTime(660, audio.currentTime)
    }

    gain.gain.setValueAtTime(0.07, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.25)

    oscillator.start()
    oscillator.stop(audio.currentTime + 0.25)
  } catch {
    // Si el navegador bloquea audio, solo muestra la notificación.
  }
}

function ToastHost() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const nativeAlert = window.alert

    window.alert = (message) => {
      const type = getToastType(String(message))
      setToast({
        id: Date.now(),
        message: String(message),
        type,
      })
      playToastSound(type)
    }

    return () => {
      window.alert = nativeAlert
    }
  }, [])

  useEffect(() => {
    if (!toast) return

    const timer = setTimeout(() => {
      setToast(null)
    }, 6400)

    return () => clearTimeout(timer)
  }, [toast])

  if (!toast) return null

  const Icon =
    toast.type === 'success'
      ? CheckCircle
      : toast.type === 'error'
        ? AlertTriangle
        : Info

  return (
    <div className={`toast-notification toast-${toast.type}`}>
      <div className="toast-icon">
        <Icon size={22} />
      </div>

      <div className="toast-content">
        <strong>
          {toast.type === 'success'
            ? 'Operación exitosa'
            : toast.type === 'error'
              ? 'Revisa la información'
              : 'Notificación'}
        </strong>
        <span>{toast.message}</span>
      </div>

      <button
        type="button"
        className="toast-close"
        onClick={() => setToast(null)}
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default ToastHost
