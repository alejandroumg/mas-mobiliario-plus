import { useEffect, useState } from 'react'
import axios from 'axios'
import { Calendar, Plus, ArrowLeft } from 'lucide-react'
import RentalForm from './RentalForm'

const API = 'http://127.0.0.1:8000/api'

function RentalsList() {
  const [alquileres, setAlquileres] = useState([])
  const [contactos, setContactos] = useState([])
  const [productos, setProductos] = useState([])
  const [pantalla, setPantalla] = useState('listado')
  const [alquilerSeleccionado, setAlquilerSeleccionado] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    const resAlquileres = await axios.get(`${API}/alquileres/`)
    const resContactos = await axios.get(`${API}/contactos/`)
    const resProductos = await axios.get(`${API}/productos/`)

    setAlquileres(resAlquileres.data)
    setContactos(resContactos.data)
    setProductos(resProductos.data)
  }

  const contactosMap = Object.fromEntries(
    contactos.map((contacto) => [contacto.id, contacto.nombre])
  )

  const productosMap = Object.fromEntries(
    productos.map((producto) => [producto.id, producto.nombre])
  )

  const formatearNoAlquiler = (id) => {
    return String(id).padStart(4, '0')
  }

  const alquileresFiltrados = alquileres.filter((alquiler) => {
    const texto = busqueda.toLowerCase()
    const cliente = contactosMap[alquiler.cliente] || ''
    const noAlquiler = formatearNoAlquiler(alquiler.id).toLowerCase()

    const coincideBusqueda =
      noAlquiler.includes(texto) ||
      cliente.toLowerCase().includes(texto) ||
      alquiler.direccion_evento.toLowerCase().includes(texto) ||
      (alquiler.responsable || '').toLowerCase().includes(texto)

    const coincideEstado =
      filtroEstado === '' || alquiler.estado === filtroEstado

    const coincideFecha =
      filtroFecha === '' || alquiler.fecha_evento === filtroFecha

    return coincideBusqueda && coincideEstado && coincideFecha
  })

  if (pantalla === 'registro') {
    return (
      <RentalForm
        contactos={contactos}
        productos={productos}
        volver={() => setPantalla('listado')}
        onGuardado={cargarDatos}
      />
    )
  }

  if (pantalla === 'detalle') {
    return (
      <>
        <button className="back-btn" onClick={() => setPantalla('listado')}>
          <ArrowLeft size={18} /> Volver a alquileres
        </button>

        <div className="page-title">
          <h1>Detalle de Productos Alquilados</h1>
        </div>

        <section className="table-card">
          <h3>
            Cliente: {contactosMap[alquilerSeleccionado?.cliente] || 'Cliente no encontrado'}
          </h3>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
              </tr>
            </thead>

            <tbody>
              {alquilerSeleccionado?.detalles?.map((detalle) => (
                <tr key={detalle.id}>
                  <td>{productosMap[detalle.producto] || 'Producto no encontrado'}</td>
                  <td>{detalle.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    )
  }

  const finalizarAlquiler = async (alquiler) => {
    const confirmar = confirm('¿Deseas finalizar este alquiler y devolver los productos al inventario?')

    if (!confirmar) return

    try {
      for (const detalle of alquiler.detalles) {
        await axios.post(`${API}/movimientos-inventario/`, {
          producto: detalle.producto,
          tipo: 'devolucion',
          cantidad: detalle.cantidad,
          observaciones: `Devolución por alquiler No. ${alquiler.id}`,
        })
      }

      await axios.patch(`${API}/alquileres/${alquiler.id}/`, {
        estado: 'finalizado',
      })

      await cargarDatos()
      alert('Alquiler finalizado correctamente')
    } catch (error) {
      const data = error.response?.data
      alert(data?.[0] || data?.detail || 'No se pudo finalizar el alquiler')
    }
  }

  const confirmarAlquiler = async (alquiler) => {
    const confirmar = confirm('¿Deseas confirmar este alquiler y descontar inventario?')
    if (!confirmar) return

    try {
      for (const detalle of alquiler.detalles) {
        await axios.post(`${API}/movimientos-inventario/`, {
          producto: detalle.producto,
          tipo: 'salida',
          cantidad: detalle.cantidad,
          observaciones: `Salida por alquiler No. ${alquiler.id}`,
        })
      }

      await axios.patch(`${API}/alquileres/${alquiler.id}/`, {
        estado: 'confirmado',
      })

      await cargarDatos()
      alert('Alquiler confirmado correctamente')
    } catch (error) {
      const data = error.response?.data
      alert(data?.[0] || data?.detail || 'No se pudo confirmar el alquiler')
    }
  }

  const cancelarAlquiler = async (alquiler) => {
    const confirmar = confirm('¿Deseas cancelar este alquiler?')
    if (!confirmar) return

    await axios.patch(`${API}/alquileres/${alquiler.id}/`, {
      estado: 'cancelado',
    })

    await cargarDatos()
    alert('Alquiler cancelado correctamente')
  }

  const formatRentalNumber = (id) => String(id).padStart(4, '0')

  const opcionesEstado = {
    pendiente: ['pendiente', 'confirmado', 'cancelado'],
    confirmado: ['confirmado', 'finalizado'],
    finalizado: ['finalizado'],
    cancelado: ['cancelado'],
  }

  const cambiarEstadoDesdeTabla = async (alquiler, nuevoEstado) => {
    if (nuevoEstado === alquiler.estado) return

    if (nuevoEstado === 'confirmado') {
      await confirmarAlquiler(alquiler)
      return
    }

    if (nuevoEstado === 'finalizado') {
      await finalizarAlquiler(alquiler)
      return
    }

    if (nuevoEstado === 'cancelado') {
      await cancelarAlquiler(alquiler)
      return
    }
  }

  return (
    <>
      <div className="page-title">
        <h1>Pantalla de Listado de Alquileres</h1>
      </div>

      <section className="filters">
        <input
          placeholder="Buscar por No. alquiler, cliente o dirección..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmado">Confirmado</option>
          <option value="finalizado">Finalizado</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
        />

        <button onClick={() => setPantalla('registro')}>
          <Plus size={18} /> Nuevo alquiler
        </button>
      </section>

      <section className="cards">
        <div className="card">
          <Calendar />
          <h3>Total alquileres</h3>
          <strong>{alquileres.length}</strong>
        </div>

        <div className="card">
          <Calendar />
          <h3>Pendientes</h3>
          <strong>{alquileres.filter((a) => a.estado === 'pendiente').length}</strong>
        </div>

        <div className="card">
          <Calendar />
          <h3>Confirmados</h3>
          <strong>{alquileres.filter((a) => a.estado === 'confirmado').length}</strong>
        </div>
      </section>

      <div className="table-card rentals-clean-card">
        <table className="rentals-clean-table">
          <thead>
            <tr>
              <th>No. alquiler</th>
              <th>Cliente</th>
              <th>Fecha evento</th>
              <th>Producto</th>
              <th>Responsable</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {alquileresFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-cell">
                  Aún no hay alquileres registrados
                </td>
              </tr>
            ) : (
              alquileresFiltrados.map((alquiler) => (
                <tr key={alquiler.id}>
                  <td className="rental-number-cell">
                    {formatRentalNumber(alquiler.id)}
                  </td>

                  <td className="client-cell">
                    {contactosMap[alquiler.cliente] || 'Cliente no encontrado'}
                  </td>

                  <td className="date-cell">
                    {alquiler.fecha_evento}
                  </td>

                  <td className="products-cell">
                    <button
                      className="see-more-btn"
                      onClick={() => {
                        setAlquilerSeleccionado(alquiler)
                        setPantalla('detalle')
                      }}
                    >
                      Ver +
                    </button>
                  </td>

                  <td className="responsable-cell">
                    {alquiler.responsable}
                  </td>

                  <td className="estado-cell">
                    <div className={`status-select-wrap status-${alquiler.estado}`}>
                      <select
                        value={alquiler.estado}
                        onChange={(e) =>
                          cambiarEstadoDesdeTabla(alquiler, e.target.value)
                        }
                        className={`status-select status-${alquiler.estado}`}
                        disabled={
                          alquiler.estado === 'finalizado' ||
                          alquiler.estado === 'cancelado'
                        }
                      >
                        {opcionesEstado[alquiler.estado]?.map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default RentalsList
