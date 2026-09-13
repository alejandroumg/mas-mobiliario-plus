import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { BarChart3, FileSpreadsheet, Users, Package, CalendarDays } from 'lucide-react'

const API = 'http://127.0.0.1:8000/api'

function ReportsPage() {
  const [contactos, setContactos] = useState([])
  const [productos, setProductos] = useState([])
  const [alquileres, setAlquileres] = useState([])
  const [movimientos, setMovimientos] = useState([])

  const [tipoReporte, setTipoReporte] = useState('general')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    const [resContactos, resProductos, resAlquileres, resMovimientos] = await Promise.all([
      axios.get(`${API}/contactos/`),
      axios.get(`${API}/productos/`),
      axios.get(`${API}/alquileres/`),
      axios.get(`${API}/movimientos-inventario/`),
    ])

    setContactos(resContactos.data)
    setProductos(resProductos.data)
    setAlquileres(resAlquileres.data)
    setMovimientos(resMovimientos.data)
  }

  const estaEnRango = (fecha) => {
    if (!fechaInicio && !fechaFin) return true
    if (!fecha) return false

    const fechaRegistro = new Date(fecha)
    const inicio = fechaInicio ? new Date(fechaInicio) : null
    const fin = fechaFin ? new Date(fechaFin) : null

    if (inicio && fechaRegistro < inicio) return false
    if (fin && fechaRegistro > fin) return false

    return true
  }

  const alquileresFiltrados = useMemo(() => {
    return alquileres.filter((alquiler) =>
      estaEnRango(alquiler.fecha_inicio || alquiler.fecha_evento)
    )
  }, [alquileres, fechaInicio, fechaFin])

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((movimiento) =>
      estaEnRango(movimiento.creado_en)
    )
  }, [movimientos, fechaInicio, fechaFin])

  const resumen = {
    totalContactos: contactos.length,
    contactosActivos: contactos.filter((c) => c.estado === 'activo').length,
    totalProductos: productos.length,
    productosDisponibles: productos.filter((p) => p.estado === 'disponible').length,
    totalAlquileres: alquileresFiltrados.length,
    alquileresConfirmados: alquileresFiltrados.filter((a) => a.estado === 'confirmado').length,
    alquileresEnCurso: alquileresFiltrados.filter((a) => a.estado === 'en_curso').length,
    alquileresFinalizados: alquileresFiltrados.filter((a) => a.estado === 'finalizado').length,
  }

  const obtenerNombreProducto = (productoId) => {
    const producto = productos.find((p) => p.id === productoId)
    return producto ? producto.nombre : 'Producto no encontrado'
  }

  const exportarExcel = () => {
    let filas = []

    if (tipoReporte === 'clientes' || tipoReporte === 'general') {
      filas.push(['Reporte de clientes'])
      filas.push(['Nombre', 'Teléfono', 'Dirección', 'Categoría', 'Estado'])

      contactos.forEach((contacto) => {
        filas.push([
          contacto.nombre,
          contacto.telefono,
          contacto.direccion,
          contacto.categoria_nombre || contacto.categoria || '',
          contacto.estado,
        ])
      })

      filas.push([])
    }

    if (tipoReporte === 'inventario' || tipoReporte === 'general') {
      filas.push(['Reporte de inventario'])
      filas.push(['Producto', 'Cantidad', 'Estado', 'Observaciones'])

      productos.forEach((producto) => {
        filas.push([
          producto.nombre,
          producto.cantidad_disponible,
          producto.estado,
          producto.observaciones || '',
        ])
      })

      filas.push([])
    }

    if (tipoReporte === 'alquileres' || tipoReporte === 'general') {
      filas.push(['Reporte de alquileres'])
      filas.push(['No. alquiler', 'Cliente', 'Fecha inicio', 'Fecha fin', 'Responsable', 'Estado'])

      alquileresFiltrados.forEach((alquiler) => {
        filas.push([
          String(alquiler.id).padStart(4, '0'),
          alquiler.cliente_nombre || alquiler.cliente,
          alquiler.fecha_inicio || alquiler.fecha_evento,
          alquiler.fecha_fin || alquiler.fecha_evento,
          alquiler.responsable,
          alquiler.estado,
        ])
      })

      filas.push([])
    }

    const contenido = filas.map((fila) => fila.join('\t')).join('\n')
    const blob = new Blob([contenido], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'reporte_mas_mobiliario.xls'
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <main className="main-content">
      <div className="page-title">
        <h1>Pantalla de Reportes</h1>
      </div>

      <section className="filters-row">
        <select value={tipoReporte} onChange={(e) => setTipoReporte(e.target.value)}>
          <option value="general">Reporte general</option>
          <option value="clientes">Clientes</option>
          <option value="inventario">Inventario</option>
          <option value="alquileres">Alquileres</option>
        </select>

        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
        />

        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
        />

        <button className="primary-btn" onClick={exportarExcel}>
          <FileSpreadsheet size={18} />
          Exportar Excel
        </button>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <Users size={24} />
          <p>Total clientes</p>
          <h2>{resumen.totalContactos}</h2>
        </article>

        <article className="stat-card">
          <Package size={24} />
          <p>Total productos</p>
          <h2>{resumen.totalProductos}</h2>
        </article>

        <article className="stat-card">
          <CalendarDays size={24} />
          <p>Alquileres filtrados</p>
          <h2>{resumen.totalAlquileres}</h2>
        </article>
      </section>

      <section className="report-card">
        <div className="report-header">
          <div>
            <h2>Resumen visual</h2>
            <p>Datos principales para apoyar la toma de decisiones.</p>
          </div>
          <BarChart3 size={26} />
        </div>

        <div className="simple-chart">
          <div>
            <span>Confirmados</span>
            <div className="bar">
              <div style={{ width: `${Math.min(resumen.alquileresConfirmados * 20, 100)}%` }} />
            </div>
            <strong>{resumen.alquileresConfirmados}</strong>
          </div>

          <div>
            <span>En curso</span>
            <div className="bar">
              <div style={{ width: `${Math.min(resumen.alquileresEnCurso * 20, 100)}%` }} />
            </div>
            <strong>{resumen.alquileresEnCurso}</strong>
          </div>

          <div>
            <span>Finalizados</span>
            <div className="bar">
              <div style={{ width: `${Math.min(resumen.alquileresFinalizados * 20, 100)}%` }} />
            </div>
            <strong>{resumen.alquileresFinalizados}</strong>
          </div>
        </div>
      </section>

      <section className="table-card">
        <h2>Movimientos recientes de inventario</h2>

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Observaciones</th>
            </tr>
          </thead>

          <tbody>
            {movimientosFiltrados.slice(0, 8).map((movimiento) => (
              <tr key={movimiento.id}>
                <td>{obtenerNombreProducto(movimiento.producto)}</td>
                <td>{movimiento.tipo}</td>
                <td>{movimiento.cantidad}</td>
                <td>{movimiento.observaciones || 'Sin observaciones'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}

export default ReportsPage