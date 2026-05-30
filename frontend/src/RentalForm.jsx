import { useState } from 'react'
import axios from 'axios'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'

const API = 'http://127.0.0.1:8000/api'

function RentalForm({ contactos, productos, volver, onGuardado }) {
  const [form, setForm] = useState({
    cliente: '',
    fecha_inicio: '',
    fecha_fin: '',
    direccion_evento: '',
    responsable: '',
    observaciones: '',
    estado: 'pendiente',
  })

  const [item, setItem] = useState({
    producto: '',
    cantidad: '',
  })

  const [carrito, setCarrito] = useState([])

  const cambiarForm = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const cambiarItem = (e) => {
    setItem({ ...item, [e.target.name]: e.target.value })
  }

  const agregarProducto = () => {
    if (!item.producto || !item.cantidad) {
      alert('Selecciona un producto y una cantidad')
      return
    }

    const producto = productos.find((p) => p.id === Number(item.producto))
    const cantidad = Number(item.cantidad)

    if (cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0')
      return
    }

    const existente = carrito.find((c) => c.producto === producto.id)
    const cantidadActual = existente ? existente.cantidad : 0

    if (cantidadActual + cantidad > producto.cantidad_disponible) {
      alert('No hay suficiente inventario disponible')
      return
    }

    if (existente) {
      setCarrito(
        carrito.map((c) =>
          c.producto === producto.id
            ? { ...c, cantidad: c.cantidad + cantidad }
            : c
        )
      )
    } else {
      setCarrito([
        ...carrito,
        {
          producto: producto.id,
          nombre: producto.nombre,
          disponible: producto.cantidad_disponible,
          cantidad,
        },
      ])
    }

    setItem({
      producto: '',
      cantidad: '',
    })
  }

  const eliminarProducto = (productoId) => {
    setCarrito(carrito.filter((item) => item.producto !== productoId))
  }

  const guardar = async (e) => {
    e.preventDefault()

    if (!form.cliente || !form.fecha_inicio || !form.fecha_fin || !form.direccion_evento) {
      alert('Completa los datos obligatorios del alquiler')
      return
    }

    if (form.fecha_fin < form.fecha_inicio) {
      alert('La fecha de finalización no puede ser anterior a la fecha de inicio')
      return
    }

    if (carrito.length === 0) {
      alert('Agrega al menos un producto al alquiler')
      return
    }

    const alquiler = await axios.post(`${API}/alquileres/`, {
      cliente: Number(form.cliente),
      fecha_evento: form.fecha_inicio,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      direccion_evento: form.direccion_evento,
      responsable: form.responsable,
      estado: form.estado,
      observaciones: form.observaciones,
    })

    for (const item of carrito) {
      await axios.post(`${API}/detalle-alquiler/`, {
        alquiler: alquiler.data.id,
        producto: item.producto,
        cantidad: item.cantidad,
      })

      if (form.estado === 'confirmado' || form.estado === 'en_curso') {
        await axios.post(`${API}/movimientos-inventario/`, {
          producto: item.producto,
          tipo: 'salida',
          cantidad: item.cantidad,
          observaciones: `Salida por alquiler No. ${alquiler.data.id}`,
        })
      }
    }

    await onGuardado()
    alert(`Alquiler No. ALQ-${String(alquiler.data.id).padStart(4, '0')} registrado correctamente`)
    volver()
  }

  return (
    <section>
      <button className="back-btn" onClick={volver}>
        <ArrowLeft size={18} /> Volver a alquileres
      </button>

      <div className="page-title">
        <h1>Registro de Alquiler</h1>
      </div>

      <form className="form-card" onSubmit={guardar}>
        <h3>Información del alquiler</h3>

        <div className="form-grid">
          <select name="cliente" value={form.cliente} onChange={cambiarForm}>
            <option value="">Selecciona un cliente *</option>
            {contactos
              .filter((contacto) => contacto.estado !== 'inactivo')
              .map((contacto) => (
                <option key={contacto.id} value={contacto.id}>
                  {contacto.nombre}
                </option>
              ))}
          </select>

          <label className="form-field">
            <span>Fecha de inicio *</span>
            <input
              type="date"
              name="fecha_inicio"
              value={form.fecha_inicio}
              onChange={cambiarForm}
            />
          </label>

          <label className="form-field">
            <span>Fecha de finalización *</span>
            <input
              type="date"
              name="fecha_fin"
              value={form.fecha_fin}
              onChange={cambiarForm}
            />
          </label>

          <input
            name="direccion_evento"
            value={form.direccion_evento}
            placeholder="Dirección del evento *"
            onChange={cambiarForm}
          />

          <input
            name="responsable"
            value={form.responsable}
            placeholder="Responsable"
            onChange={cambiarForm}
          />

          <select name="estado" value={form.estado} onChange={cambiarForm}>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="en_curso">En curso</option>
          </select>
        </div>

        <textarea
          name="observaciones"
          value={form.observaciones}
          placeholder="Observaciones del alquiler"
          onChange={cambiarForm}
        />

        <h3 className="section-subtitle">Productos del alquiler</h3>

        <div className="form-grid">
          <select name="producto" value={item.producto} onChange={cambiarItem}>
            <option value="">Selecciona un producto</option>
            {productos.map((producto) => (
              <option key={producto.id} value={producto.id}>
                {producto.nombre} - Disponible: {producto.cantidad_disponible}
              </option>
            ))}
          </select>

          <input
            type="number"
            name="cantidad"
            value={item.cantidad}
            placeholder="Cantidad"
            onChange={cambiarItem}
          />
        </div>

        <button type="button" className="add-item-btn" onClick={agregarProducto}>
          <Plus size={18} /> Agregar producto al alquiler
        </button>

        <section className="cart-card">
          {carrito.length === 0 ? (
            <p className="empty">Aún no hay productos agregados</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Disponible</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {carrito.map((item) => (
                  <tr key={item.producto}>
                    <td>{item.nombre}</td>
                    <td>{item.cantidad}</td>
                    <td>{item.disponible}</td>
                    <td>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => eliminarProducto(item.producto)}
                      >
                        <Trash2 size={15} /> Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <div className="form-actions">
          <button type="button" className="secondary-btn" onClick={volver}>
            Cancelar
          </button>

          <button type="submit" className="primary-btn">
            <Save size={18} /> Guardar alquiler
          </button>
        </div>
      </form>
    </section>
  )
}

export default RentalForm
