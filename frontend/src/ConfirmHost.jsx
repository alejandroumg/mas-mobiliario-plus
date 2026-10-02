import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, X } from 'lucide-react'

function ConfirmHost() {
  const [confirmData, setConfirmData] = useState(null)

  useEffect(() => {
    window.appConfirm = ({
      title = 'Confirmar acción',
      message = '¿Deseas continuar?',
      confirmText = 'Confirmar',
      cancelText = 'Cancelar',
      type = 'warning',
    }) => {
      return new Promise((resolve) => {
        setConfirmData({
          title,
          message,
          confirmText,
          cancelText,
          type,
          resolve,
        })
      })
    }

    return () => {
      delete window.appConfirm
    }
  }, [])

  if (!confirmData) return null

  const Icon = confirmData.type === 'success' ? CheckCircle : AlertTriangle

  const close = (value) => {
    confirmData.resolve(value)
    setConfirmData(null)
  }

  return (
    <div className="confirm-overlay">
      <div className="confirm-modal">
        <button
          type="button"
          className="confirm-x"
          onClick={() => close(false)}
        >
          <X size={18} />
        </button>

        <div className={`confirm-icon confirm-${confirmData.type}`}>
          <Icon size={28} />
        </div>

        <h2>{confirmData.title}</h2>
        <p>{confirmData.message}</p>

        <div className="confirm-actions">
          <button
            type="button"
            className="confirm-cancel"
            onClick={() => close(false)}
          >
            {confirmData.cancelText}
          </button>

          <button
            type="button"
            className="confirm-accept"
            onClick={() => close(true)}
          >
            {confirmData.confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmHost
