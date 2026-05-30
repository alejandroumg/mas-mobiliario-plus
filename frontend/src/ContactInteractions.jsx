import { useEffect, useState } from 'react'
import axios from 'axios'
import { Plus, MessageCircle } from 'lucide-react'

const API = 'http://127.0.0.1:8000/api'

function ContactInteractions({ contactoId }) {
  const [interacciones, setInteracciones] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [form, setForm] = useState({
    medio: 'whatsapp',
    motivo: '',
    descripcion: '',
    responsable: '',
  })

  useEffect(() => {
    cargarInteracciones()
  }, [contactoId])

  const cargarInteracciones = async () => {
    const res = await axios.get(`${API}/interacciones-contacto/`)
    setInteracciones(
      res.data.filter((item) => item.contacto === contactoId)
    )
  }

  const cambiar = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const guardar = async (e) => {
    e.preventDefault()

    if (!form.motivo || !form.descripcion) {
      alert('Motivo y descripción son obligatorios')
      return
    }

    await axios.post(`${API}/interacciones-contacto/`, {
      contacto: contactoId,
      ...form,
    })

    setForm({
      medio: 'whatsapp',
      motivo: '',
      descripcion: '',
      responsable: '',
    })

    setMostrarFormulario(false)
    await cargarInteracciones()
  }

  return (
    <section className="interactions-section">
      <div className="interactions-header">
        <h3>Historial de interacciones</h3>

        <button
          className="add-item-btn"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          <Plus size={18} /> Nueva interacción
        </button>
      </div>

      {mostrarFormulario && (
        <form className="interaction-form" onSubmit={guardar}>
          <select name="medio" value={form.medio} onChange={cambiar}>
            <option value="whatsapp">WhatsApp</option>
            <option value="llamada">Llamada</option>
            <option value="correo">Correo electrónico</option>
            <option value="presencial">Presencial</option>
            <option value="otro">Otro</option>
          </select>

          <input
            name="motivo"
            value={form.motivo}
            placeholder="Motivo *"
            onChange={cambiar}
          />

          <input
            name="responsable"
            value={form.responsable}
            placeholder="Responsable"
            onChange={cambiar}
          />

          <textarea
            name="descripcion"
            value={form.descripcion}
            placeholder="¿Qué se habló? *"
            onChange={cambiar}
          />

          <button type="submit" className="primary-btn">
            Guardar interacción
          </button>
        </form>
      )}

      {interacciones.length === 0 ? (
        <p className="empty">Aún no hay interacciones registradas</p>
      ) : (
        interacciones.map((item) => (
          <article className="interaction-item" key={item.id}>
            <MessageCircle size={18} />
            <div>
              <strong>{item.motivo}</strong>
              <p>{item.descripcion}</p>
              <small>
                {item.medio} · {item.responsable || 'Sin responsable'}
              </small>
            </div>
          </article>
        ))
      )}
    </section>
  )
}

export default ContactInteractions
