import { useState } from 'react'
import axios from 'axios'
import { ArrowLeft, Save } from 'lucide-react'

const API = 'http://127.0.0.1:8000/api'

function ContactForm({ volver, categorias, onGuardado, contactoEditando }) {
  const [form, setForm] = useState({
    nombre: contactoEditando?.nombre || '',
    telefono: contactoEditando?.telefono || '',
    correo_electronico: contactoEditando?.correo_electronico || '',
    direccion: contactoEditando?.direccion || '',
    empresa_organizacion: contactoEditando?.empresa_organizacion || '',
    categoria: contactoEditando?.categoria || '',
    estado: contactoEditando?.estado || 'activo',
    observaciones: contactoEditando?.observaciones || '',
    medio_contacto: contactoEditando?.medio_contacto || '',
    responsable: contactoEditando?.responsable || '',
  })

  const cambiar = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const guardar = async (e) => {
    e.preventDefault()

    if (!form.nombre || !form.telefono) {
      alert('Nombre y teléfono son obligatorios')
      return
    }

    if (contactoEditando) {
      await axios.patch(`${API}/contactos/${contactoEditando.id}/`, {
        ...form,
        categoria: form.categoria || null,
      })

      alert('Contacto actualizado correctamente')
    } else {
      await axios.post(`${API}/contactos/`, {
        ...form,
        categoria: form.categoria || null,
        etiquetas: [],
      })

      alert('Contacto guardado correctamente')
    }

    await onGuardado()
    volver()
  }

  return (
    <section>
      <button className="back-btn" onClick={volver}>
        <ArrowLeft size={18} /> Volver al listado
      </button>

      <div className="page-title">
        <h1>
          {contactoEditando
            ? 'Pantalla de Edición de Contacto'
            : 'Pantalla de Registro de Contacto'}
        </h1>
      </div>

      <form className="form-card" onSubmit={guardar}>
        <h3>Información del contacto</h3>

        <div className="form-grid">
          <input
            name="nombre"
            value={form.nombre}
            placeholder="Nombre completo *"
            onChange={cambiar}
          />

          <input
            name="telefono"
            value={form.telefono}
            placeholder="Teléfono *"
            onChange={cambiar}
          />

          <input
            name="correo_electronico"
            value={form.correo_electronico}
            placeholder="Correo electrónico"
            onChange={cambiar}
          />

          <input
            name="direccion"
            value={form.direccion}
            placeholder="Dirección"
            onChange={cambiar}
          />

          <input
            name="empresa_organizacion"
            value={form.empresa_organizacion}
            placeholder="Empresa / Organización"
            onChange={cambiar}
          />

          <select
            name="categoria"
            value={form.categoria || ''}
            onChange={cambiar}
          >
            <option value="">Selecciona una categoría</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>

          <select
            name="estado"
            value={form.estado}
            onChange={cambiar}
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="seguimiento">Seguimiento</option>
          </select>

          <input
            name="medio_contacto"
            value={form.medio_contacto}
            placeholder="Medio de contacto"
            onChange={cambiar}
          />

          <input
            name="responsable"
            value={form.responsable}
            placeholder="Responsable"
            onChange={cambiar}
          />
        </div>

        <textarea
          name="observaciones"
          value={form.observaciones}
          placeholder="Observaciones"
          onChange={cambiar}
        />

        <div className="form-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={volver}
          >
            Cancelar
          </button>

          <button type="submit" className="primary-btn">
            <Save size={18} />
            {contactoEditando ? 'Guardar cambios' : 'Guardar contacto'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default ContactForm