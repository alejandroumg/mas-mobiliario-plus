import { useEffect, useState } from 'react'
import axios from 'axios'
import { CalendarDays } from 'lucide-react'

const API = 'http://127.0.0.1:8000/api'

function ContactRentals({ contactoId }) {
  const [alquileres, setAlquileres] = useState([])

  useEffect(() => {
    cargarAlquileres()
  }, [contactoId])

  const cargarAlquileres = async () => {
    const res = await axios.get(`${API}/alquileres/`)

    setAlquileres(
      res.data.filter((alquiler) => alquiler.cliente === contactoId)
    )
  }

  const formatearNoAlquiler = (id) => String(id).padStart(4, '0')

  const formatearEstado = (estado) => {
    const nombres = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      en_curso: 'En curso',
      finalizado: 'Finalizado',
      cancelado: 'Cancelado',
    }

    return nombres[estado] || estado
  }

  return (
    <section className="contact-rentals-section">
      <h3>Alquileres asociados</h3>

      {alquileres.length === 0 ? (
        <p className="empty">Este contacto aún no tiene alquileres registrados</p>
      ) : (
        <div className="contact-rentals-list">
          {alquileres.map((alquiler) => (
            <article className="contact-rental-item" key={alquiler.id}>
              <CalendarDays size={18} />

              <div>
                <strong>Alquiler No. {formatearNoAlquiler(alquiler.id)}</strong>

                <p>
                  {alquiler.fecha_inicio || alquiler.fecha_evento}
                  {' — '}
                  {alquiler.fecha_fin || alquiler.fecha_evento}
                </p>

                <span className={`contact-rental-status ${alquiler.estado}`}>
                  {formatearEstado(alquiler.estado)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default ContactRentals
