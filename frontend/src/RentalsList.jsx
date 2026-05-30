import { useEffect, useState } from 'react'
import axios from 'axios'
import { Calendar, Plus, ArrowLeft } from 'lucide-react'
import RentalForm from './RentalForm'

const API = 'http://127.0.0.1:8000/api'

function RentalsList() {
  const [alquileres, setAlquileres] = useState([])
  const [contactos, setContactos] = useState([])
  const [productos, setProductos] = useState([])
  const [movimientos, setMovimientos] = useState([])
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
    const resMovimientos = await axios.get(`${API}/movimientos-inventario/`)

    setAlquileres(resAlquileres.data)
    setContactos(resContactos.data)
    setProductos(resProductos.data)
    setMovimientos(resMovimientos.data)
  }

  const contactosMap = Object.fromEntries(
    contactos.map((contacto) => [contacto.id, contacto.nombre])
  )

  const productosMap = Object.fromEntries(
    productos.map((producto) => [producto.id, producto.nombre])
  )

  const formatearNoAlquiler = (id) => String(id).padStart(4, '0')

  const alquileresFiltrados = alquileres.filter((alquiler) => {
    const texto = busqueda.toLowerCase()
    const cliente = contactosMap[alquiler.cliente] || ''
    const noAlquiler = formatearNoAlquiler(alquiler.id)

    const coincideBusqueda =
      noAlquiler.includes(texto) ||
      cliente.toLowerCase().includes(texto) ||
      (alquiler.responsable || '').toLowerCase().includes(texto)

    const coincideEstado =
      filtroEstado === '' || alquiler.estado === filtroEstado

    const coincideFecha =
      filtroFecha === '' || alquiler.fecha_evento === filtroFecha

    return coincideBusqueda && coincideEstado && coincideFecha
  })

  const confirmarAlquiler = async (alquiler) => {
    const confirmar = confirm(
      '¿Deseas confirmar este alquiler y reservar los productos del inventario?'
    )

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

      alert(
        data?.[0] ||
        data?.detail ||
        'No se pudo confirmar el alquiler'
      )
    }
  }

  const iniciarAlquiler = async (alquiler) => {
    const confirmar = confirm('¿Deseas marcar este alquiler como En curso?')

    if (!confirmar) return

    try {
      await axios.patch(`${API}/alquileres/${alquiler.id}/`, {
        estado: 'en_curso',
      })

      await cargarDatos()
      alert('El alquiler ahora está En curso')
    } catch (error) {
      const data = error.response?.data

      alert(
        data?.[0] ||
        data?.detail ||
        'No se pudo iniciar el alquiler'
      )
    }
  }

  const finalizarAlquiler = async (alquiler) => {
    const confirmar = confirm('¿Deseas finalizar este alquiler y devolver los productos al inventario?')
    if (!confirmar) return

    try {
      const claveAlquiler = `alquiler No. ${alquiler.id}`

      const movimientosDelAlquiler = movimientos.filter((movimiento) =>
        movimiento.observaciones?.includes(claveAlquiler)
      )

      const resumenPorProducto = {}

      movimientosDelAlquiler.forEach((movimiento) => {
        if (!resumenPorProducto[movimiento.producto]) {
          resumenPorProducto[movimiento.producto] = {
            producto: movimiento.producto,
            salidas: 0,
            devoluciones: 0,
          }
        }

        if (movimiento.tipo === 'salida') {
          resumenPorProducto[movimiento.producto].salidas += movimiento.cantidad
        }

        if (movimiento.tipo === 'devolucion') {
          resumenPorProducto[movimiento.producto].devoluciones += movimiento.cantidad
        }
      })

      const pendientesDevolver = Object.values(resumenPorProducto)
        .map((item) => ({
          producto: item.producto,
          cantidad: item.salidas - item.devoluciones,
        }))
        .filter((item) => item.cantidad > 0)

      if (pendientesDevolver.length === 0) {
        await axios.patch(`${API}/alquileres/${alquiler.id}/`, {
          estado: 'finalizado',
        })

        await cargarDatos()
        alert('Alquiler finalizado. No había productos pendientes de devolución.')
        return
      }

      for (const item of pendientesDevolver) {
        await axios.post(`${API}/movimientos-inventario/`, {
          producto: item.producto,
          tipo: 'devolucion',
          cantidad: item.cantidad,
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

  const cancelarAlquiler = async (alquiler) => {
    const confirmar = confirm('¿Deseas cancelar este alquiler?')
    if (!confirmar) return

    try {
      const debeDevolverInventario =
        alquiler.estado === 'confirmado' ||
        alquiler.estado === 'en_curso'

      if (debeDevolverInventario) {
        const claveAlquiler = `alquiler No. ${alquiler.id}`

        const movimientosDelAlquiler = movimientos.filter((movimiento) =>
          movimiento.observaciones?.includes(claveAlquiler)
        )

        const resumenPorProducto = {}

        movimientosDelAlquiler.forEach((movimiento) => {
          if (!resumenPorProducto[movimiento.producto]) {
            resumenPorProducto[movimiento.producto] = {
              producto: movimiento.producto,
              salidas: 0,
              devoluciones: 0,
            }
          }

          if (movimiento.tipo === 'salida') {
            resumenPorProducto[movimiento.producto].salidas += Number(movimiento.cantidad)
          }

          if (movimiento.tipo === 'devolucion') {
            resumenPorProducto[movimiento.producto].devoluciones += Number(movimiento.cantidad)
          }
        })

        const pendientesDevolver = Object.values(resumenPorProducto)
          .map((item) => ({
            producto: item.producto,
            cantidad: item.salidas - item.devoluciones,
          }))
          .filter((item) => item.cantidad > 0)

        for (const item of pendientesDevolver) {
          await axios.post(`${API}/movimientos-inventario/`, {
            producto: item.producto,
            tipo: 'devolucion',
            cantidad: item.cantidad,
            observaciones: `Devolución por alquiler No. ${alquiler.id}`,
          })
        }
      }

      await axios.patch(`${API}/alquileres/${alquiler.id}/`, {
        estado: 'cancelado',
      })

      await cargarDatos()
      alert('Alquiler cancelado correctamente')
    } catch (error) {
      const data = error.response?.data

      alert(
        data?.[0] ||
        data?.detail ||
        'No se pudo cancelar el alquiler'
      )
    }
  }

  const cambiarEstado = async (alquiler, nuevoEstado) => {
    if (nuevoEstado === alquiler.estado) return

    if (nuevoEstado === 'confirmado') await confirmarAlquiler(alquiler)
    if (nuevoEstado === 'en_curso') await iniciarAlquiler(alquiler)
    if (nuevoEstado === 'finalizado') await finalizarAlquiler(alquiler)
    if (nuevoEstado === 'cancelado') await cancelarAlquiler(alquiler)
  }

  const opcionesEstado = {
    pendiente: ['pendiente', 'confirmado', 'cancelado'],
    confirmado: ['confirmado', 'en_curso', 'cancelado'],
    en_curso: ['en_curso', 'finalizado'],
    finalizado: ['finalizado'],
    cancelado: ['cancelado'],
  }

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
          <h1>Detalle del Alquiler No. {formatearNoAlquiler(alquilerSeleccionado?.id)}</h1>
        </div>

        <section className="rental-detail-card">
          <div className="rental-detail-grid">
            <div>
              <span>Cliente</span>
              <strong>{contactosMap[alquilerSeleccionado?.cliente] || 'Cliente no encontrado'}</strong>
            </div>

            <div>
              <span>Fecha del evento</span>
              <strong>{alquilerSeleccionado?.fecha_evento}</strong>
            </div>

            <div>
              <span>Responsable</span>
              <strong>{alquilerSeleccionado?.responsable || 'Sin responsable'}</strong>
            </div>

            <div>
              <span>Estado</span>
              <strong>{alquilerSeleccionado?.estado}</strong>
            </div>
          </div>

          <div className="rental-detail-info">
            <span>Dirección del evento</span>
            <p>{alquilerSeleccionado?.direccion_evento || 'Sin dirección'}</p>
          </div>

          <div className="rental-detail-info">
            <span>Observaciones</span>
            <p>{alquilerSeleccionado?.observaciones || 'Sin observaciones'}</p>
          </div>
        </section>

        <section className="table-card">
          <h3>Productos alquilados</h3>

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

  return (
    <>
      <div className="page-title">
        <h1>Pantalla de Listado de Alquileres</h1>
      </div>

      <section className="filters">
        <input
          placeholder="Buscar por No. alquiler, cliente o responsable..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmado">Confirmado</option>
          <option value="en_curso">En curso</option>
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

      <section className="table-card rentals-clean-card">
        <table className="rentals-clean-table">
          <thead>
            <tr>
              <th>No. alquiler</th>
              <th>Cliente</th>
              <th>Fecha inicio</th>
              <th>Fecha fin</th>
              <th>Producto</th>
              <th>Responsable</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {alquileresFiltrados.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty">
                  Aún no hay alquileres registrados
                </td>
              </tr>
            ) : (
              alquileresFiltrados.map((alquiler) => (
                <tr key={alquiler.id}>
                  <td>{formatearNoAlquiler(alquiler.id)}</td>

                  <td>{contactosMap[alquiler.cliente] || 'Cliente no encontrado'}</td>

                  <td>{alquiler.fecha_inicio || alquiler.fecha_evento}</td>
                  <td>{alquiler.fecha_fin || alquiler.fecha_evento}</td>

                  <td>
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

                  <td>{alquiler.responsable || 'Sin responsable'}</td>

                  <td>
                    <select
                      className={`rental-status-select ${alquiler.estado}`}
                      value={alquiler.estado}
                      onChange={(e) => cambiarEstado(alquiler, e.target.value)}
                      disabled={alquiler.estado === 'finalizado' || alquiler.estado === 'cancelado'}
                    >
                      {opcionesEstado[alquiler.estado].map((estado) => (
                        <option key={estado} value={estado}>
                          {formatearEstado(estado)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </>
  )
}

export default RentalsList
