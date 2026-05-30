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
  const [toast, setToast] = useState(null)

  const mostrarToast = (mensaje, tipo = 'error') => {
    setToast({ mensaje, tipo })

    setTimeout(() => {
      setToast(null)
    }, 3500)
  }

  const cambiar = (e) => {
    const { name, value } = e.target

    setForm({
      ...form,
      [name]: name === 'telefono'
        ? value.replace(/\D/g, '')
        : value,
    })
  }

  const guardar = async (e) => {
    e.preventDefault()

    if (!form.nombre || !form.telefono) {
      mostrarToast('Nombre y teléfono son obligatorios')
      return
    }

    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (form.correo_electronico && !correoValido.test(form.correo_electronico)) {
      mostrarToast('Ingresa un correo electrónico válido')
      return
    }

    try {
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
    } catch (error) {
      console.error(error.response?.data || error)

      const data = error.response?.data
      const mensaje =
        data?.telefono?.[0] ||
        data?.correo_electronico?.[0] ||
        data?.nombre?.[0] ||
        data?.detail ||
        'No se pudo guardar el contacto'

      mostrarToast(mensaje)
    }
  }

  return (
    <>
      {toast && (
        <div className={`toast-notification ${toast.tipo}`}>
          {toast.mensaje}
        </div>
      )}

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
            <label className="form-field">
              <span>Nombre completo *</span>
              <input
                name="nombre"
                value={form.nombre}
                placeholder="Ingresa el nombre completo"
                onChange={cambiar}
              />
            </label>

            <label className="form-field">
              <span>Teléfono *</span>
              <input
                name="telefono"
                type="tel"
                inputMode="numeric"
                value={form.telefono}
                placeholder="Ingresa el número de teléfono"
                onChange={cambiar}
              />
            </label>

            <label className="form-field">
              <span>Correo electrónico</span>
              <input
                name="correo_electronico"
                type="email"
                value={form.correo_electronico}
                placeholder="Ingresa el correo electrónico"
                onChange={cambiar}
              />
            </label>

            <label className="form-field">
              <span>Dirección</span>
              <input
                name="direccion"
                value={form.direccion}
                placeholder="Ingresa la dirección"
                onChange={cambiar}
              />
            </label>

            <label className="form-field">
              <span>Empresa / Organización</span>
              <input
                name="empresa_organizacion"
                value={form.empresa_organizacion}
                placeholder="Ingresa la empresa u organización"
                onChange={cambiar}
              />
            </label>

            <label className="form-field">
              <span>Categoría</span>
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
            </label>

            <label className="form-field">
              <span>Estado</span>
              <select
                name="estado"
                value={form.estado}
                onChange={cambiar}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="seguimiento">Seguimiento</option>
              </select>
            </label>

            <label className="form-field">
              <span>Medio de contacto</span>
              <input
                name="medio_contacto"
                value={form.medio_contacto}
                placeholder="Ejemplo: WhatsApp"
                onChange={cambiar}
              />
            </label>

            <label className="form-field">
              <span>Responsable</span>
              <input
                name="responsable"
                value={form.responsable}
                placeholder="Ingresa el responsable"
                onChange={cambiar}
              />
            </label>
          </div>

          <label className="form-field observations-field">
            <span>Observaciones</span>
            <textarea
              name="observaciones"
              value={form.observaciones}
              placeholder="Ingresa observaciones adicionales"
              onChange={cambiar}
            />
          </label>

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
    </>
  )
}

export default ContactForm
