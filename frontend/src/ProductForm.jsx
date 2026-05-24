import { useState } from 'react'
import axios from 'axios'
import { ArrowLeft, Save } from 'lucide-react'

const API = 'http://127.0.0.1:8000/api'

function ProductForm({ categorias, volver, onGuardado }) {
  const [form, setForm] = useState({
    nombre: '',
    cantidad_disponible: '',
    estado: 'disponible',
    categoria: '',
    observaciones: '',
  })

  const cambiar = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const guardar = async (e) => {
    e.preventDefault()

    if (!form.nombre || !form.cantidad_disponible) {
      alert('Nombre y cantidad son obligatorios')
      return
    }

    await axios.post(`${API}/productos/`, {
      ...form,
      cantidad_disponible: Number(form.cantidad_disponible),
      categoria: form.categoria || null,
    })

    await onGuardado()
    alert('Producto guardado correctamente')
    volver()
  }

  return (
    <section>
      <button className="back-btn" onClick={volver}>
        <ArrowLeft size={18} /> Volver al inventario
      </button>

      <div className="page-title">
        <h1>Pantalla de Registro de Producto</h1>
      </div>

      <form className="form-card" onSubmit={guardar}>
        <h3>Información del producto</h3>

        <div className="form-grid">
          <input
            name="nombre"
            value={form.nombre}
            placeholder="Nombre del producto *"
            onChange={cambiar}
          />

          <input
            name="cantidad_disponible"
            type="number"
            value={form.cantidad_disponible}
            placeholder="Cantidad disponible *"
            onChange={cambiar}
          />

          <select name="categoria" value={form.categoria} onChange={cambiar}>
            <option value="">Selecciona una categoría</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>

          <select name="estado" value={form.estado} onChange={cambiar}>
            <option value="disponible">Disponible</option>
            <option value="danado">Dañado</option>
            <option value="fuera_uso">Fuera de uso</option>
          </select>
        </div>

        <textarea
          name="observaciones"
          value={form.observaciones}
          placeholder="Observaciones"
          onChange={cambiar}
        />

        <div className="form-actions">
          <button type="button" className="secondary-btn" onClick={volver}>
            Cancelar
          </button>

          <button type="submit" className="primary-btn">
            <Save size={18} /> Guardar producto
          </button>
        </div>
      </form>
    </section>
  )
}

export default ProductForm
