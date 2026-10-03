import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  Users,
  Package,
  CalendarDays,
  Activity,
  AlertTriangle,
  Clock,
  Zap,
  UserPlus,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

const ESTADOS = [
  { clave: 'en_curso', etiqueta: 'En curso', color: '#22c55e' },
  { clave: 'confirmado', etiqueta: 'Confirmados', color: '#3b82f6' },
  { clave: 'pendiente', etiqueta: 'Pendientes', color: '#f59e0b' },
  { clave: 'finalizado', etiqueta: 'Finalizados', color: '#9ca3af' },
  { clave: 'cancelado', etiqueta: 'Cancelados', color: '#ef4444' },
]

const ACCIONES = [
  { icono: Package, titulo: 'Ir a inventario', sub: 'Productos y movimientos', destino: 'inventario' },
  { icono: UserPlus, titulo: 'Nuevo contacto', sub: 'Registrar cliente', destino: 'registro' },
]

const fechaDe = (alquiler) => {
  const base = alquiler.fecha_inicio || alquiler.fecha_evento
  return base ? new Date(`${base}T00:00:00`) : null
}

const tiempoRelativo = (valor) => {
  if (!valor) return ''
  const minutos = Math.floor((Date.now() - new Date(valor).getTime()) / 60000)
  if (Number.isNaN(minutos)) return ''
  if (minutos < 1) return 'Ahora'
  if (minutos < 60) return `Hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `Hace ${horas} h`
  return `Hace ${Math.floor(horas / 24)} d`
}

function DashboardPage({ irA }) {
  const [contactos, setContactos] = useState([])
  const [productos, setProductos] = useState([])
  const [alquileres, setAlquileres] = useState([])
  const [movimientos, setMovimientos] = useState([])

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    const [resContactos, resProductos, resAlquileres, resMovimientos] =
      await Promise.all([
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

  const resumen = useMemo(() => ({
    pendientes: alquileres.filter((a) => a.estado === 'pendiente').length,
    confirmados: alquileres.filter((a) => a.estado === 'confirmado').length,
    enCurso: alquileres.filter((a) => a.estado === 'en_curso').length,
    finalizados: alquileres.filter((a) => a.estado === 'finalizado').length,
    cancelados: alquileres.filter((a) => a.estado === 'cancelado').length,
  }), [alquileres])

  const alquileresProximos = useMemo(() => {
    return alquileres
      .filter((a) =>
        ['pendiente', 'confirmado', 'en_curso'].includes(a.estado)
      )
      .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
  }, [alquileres])

  const estadosGrafica = [
    { key: 'pendiente', label: 'Pendientes', value: resumen.pendientes, color: '#f59e0b' },
    { key: 'confirmado', label: 'Confirmados', value: resumen.confirmados, color: '#16a34a' },
    { key: 'en_curso', label: 'En curso', value: resumen.enCurso, color: '#2563eb' },
    { key: 'finalizado', label: 'Finalizados', value: resumen.finalizados, color: '#6b7280' },
    { key: 'cancelado', label: 'Cancelados', value: resumen.cancelados, color: '#dc2626' },
  ]

  const tarjetas = [
    {
      icono: CalendarDays,
      valor: alquileres.filter((a) => a.estado === 'en_curso').length,
      titulo: 'Alquileres activos',
      sub: 'En curso',
    },
    { icono: Package, valor: productos.length, titulo: 'Productos disponibles', sub: 'Listos para alquilar' },
    { icono: Users, valor: contactos.length, titulo: 'Contactos registrados', sub: 'Clientes registrados' },
    { icono: Activity, valor: movimientos.length, titulo: 'Movimientos', sub: 'Inventario' },
  ]

  const datosMensuales = useMemo(() => {
    const meses = {}

    alquileres.forEach((alquiler) => {
      const fecha = fechaDe(alquiler)
      if (!fecha) return

      const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      const mes = fecha.toLocaleDateString('es-GT', { month: 'short' }).replace('.', '')

      if (!meses[clave]) {
        meses[clave] = { clave, mes: mes.charAt(0).toUpperCase() + mes.slice(1), total: 0 }
      }
      meses[clave].total += 1
    })

    return Object.values(meses).sort((a, b) => a.clave.localeCompare(b.clave))
  }, [alquileres])

  const resumenMensual = useMemo(() => {
    const actual = datosMensuales[datosMensuales.length - 1]
    const anterior = datosMensuales[datosMensuales.length - 2]

    if (!actual) return { mes: 'Actual', total: 0, variacion: null, mesAnterior: null }

    const variacion =
      anterior && anterior.total > 0
        ? Math.round(((actual.total - anterior.total) / anterior.total) * 100)
        : null

    return { mes: actual.mes, total: actual.total, variacion, mesAnterior: anterior?.mes || null }
  }, [datosMensuales])

  const alertasDashboard = useMemo(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const limite = new Date(hoy)
    limite.setDate(limite.getDate() + 3)

    const alquileresPorVencer = alquileres.filter((alquiler) => {
      if (!['pendiente', 'confirmado', 'en_curso'].includes(alquiler.estado)) {
        return false
      }

      const fechaBase = alquiler.fecha_fin || alquiler.fecha_evento
      if (!fechaBase) return false

      const fecha = new Date(`${fechaBase}T00:00:00`)
      return fecha >= hoy && fecha <= limite
    })

    const productosBajoStock = productos.filter((producto) => {
      const cantidad =
        producto.cantidad_disponible ??
        producto.cantidad ??
        producto.stock ??
        0

      return Number(cantidad) > 0 && Number(cantidad) <= 2
    })

    return {
      alquileresPorVencer,
      productosBajoStock,
      total: alquileresPorVencer.length + productosBajoStock.length,
    }
  }, [alquileres, productos])

  const totalEstados = estadosGrafica.reduce((total, estado) => total + estado.value, 0)

  const obtenerNombreProducto = (productoId) => {
    const producto = productos.find((p) => p.id === productoId)
    return producto ? producto.nombre : 'Producto no encontrado'
  }

  const formatearEstado = (clave) => ESTADOS.find((e) => e.clave === clave)?.etiqueta.replace(/s$/, '') || clave

  return (
    <main className="main-content dm-page">
      <div className="page-title">
        <h1>Dashboard</h1>
      </div>

      <section className="dm-stats">
        {tarjetas.map(({ icono: Icono, valor, titulo, sub }) => (
          <article className="dm-stat" key={titulo}>
            <div className="dm-stat-icon"><Icono size={24} /></div>
            <div>
              <strong>{valor}</strong>
              <p>{titulo}</p>
              <span>{sub}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="dm-grid">
        {/* Actividad reciente */}
        <article className="dm-panel dm-panel--equal">
          <div className="dm-panel-head">
            <Clock size={18} />
            <h2>Actividad reciente</h2>
            <button className="dm-link-btn" onClick={() => irA('inventario')}>Ver todas</button>
          </div>

          <div className="dm-list dm-scroll">
            {movimientos.length === 0 && <p className="dm-empty">Aún no hay movimientos.</p>}
            {movimientos.slice(0, 5).map((m) => (
              <div className="dm-row" key={m.id}>
                <div className="dm-row-icon"><Package size={16} /></div>
                <div className="dm-row-text">
                  <strong>{obtenerNombreProducto(m.producto)}</strong>
                  <p>Movimiento de {m.tipo} por {m.cantidad} unidades.</p>
                </div>
                <span className="dm-row-time">
                  {tiempoRelativo(m.fecha || m.created_at || m.fecha_movimiento)}
                </span>
              </div>
            ))}
          </div>
        </article>

        {/* Próximos alquileres */}
        <article className="dm-panel dm-panel--equal">
          <div className="dm-panel-head">
            <CalendarDays size={18} />
            <h2>Próximos alquileres</h2>
            <button className="dm-link-btn" onClick={() => irA('alquileres')}>Ver todos</button>
          </div>

          <div className="dm-scroll">
            {alquileresProximos.length === 0 ? (
              <div className="dm-empty dm-empty-box">
                No hay eventos próximos.
              </div>
            ) : (
              <div className="dm-list">
                {alquileresProximos.slice(0, 5).map((alquiler) => {
                  const fecha = fechaDe(alquiler)
                  const dia = fecha ? fecha.getDate() : '--'
                  const mes = fecha
                    ? fecha.toLocaleString('es-GT', { month: 'short' }).toUpperCase()
                    : ''

                  return (
                    <div className="dm-row" key={alquiler.id}>
                      <div className="dm-date">
                        <strong>{dia}</strong>
                        <span>{mes}</span>
                      </div>

                      <div className="dm-row-text">
                        <strong>{alquiler.responsable || 'Sin responsable'}</strong>
                        <p>Alquiler No. {String(alquiler.id).padStart(4, '0')}</p>
                      </div>

                      <span className={`dm-pill dm-pill--${alquiler.estado}`}>
                        {formatearEstado(alquiler.estado)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </article>

        {/* Columna derecha */}
        <aside className="dm-side">
          <section className="dm-panel">
            <div className="dm-panel-head">
              <Zap size={18} />
              <h2>Acciones rápidas</h2>
            </div>

            {ACCIONES.map(({ icono: Icono, titulo, sub, destino }) => (
              <button className="dm-action" key={titulo} onClick={() => irA(destino)}>
                <div className="dm-row-icon"><Icono size={16} /></div>
                <div className="dm-row-text">
                  <strong>{titulo}</strong>
                  <p>{sub}</p>
                </div>
                <ChevronRight size={16} className="dm-chevron" />
              </button>
            ))}
          </section>

          <section className="dm-panel">
            <div className="dm-panel-head">
              <Activity size={18} />
              <h2>Alquileres por estado</h2>
            </div>

            <>
                <div className="dm-donut">
                  <div className="dm-donut-box">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={estadosGrafica}
                          dataKey="value"
                          nameKey="label"
                          innerRadius={42}
                          outerRadius={68}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {estadosGrafica.map((entry) => (
                            <Cell key={entry.key} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="dm-donut-center">
                      <strong>{totalEstados}</strong>
                      <span>Total</span>
                    </div>
                  </div>

                  <div className="dm-legend">
                    {estadosGrafica.map((estado) => (
                      <p key={estado.key}>
                        <i style={{ background: estado.color }} />
                        <span>{estado.label}</span>
                        <strong>{estado.value}</strong>
                      </p>
                    ))}
                  </div>
                </div>

                <button className="dm-footer-btn" onClick={() => irA('reportes')}>
                  Ver reporte detallado <ArrowRight size={14} />
                </button>
                {totalEstados === 0 && (
                  <p className="dm-empty">Aún no hay alquileres para mostrar.</p>
                )}
            </>
          </section>

          <section className="dm-panel dm-alerts-mini">
            <div className="dm-panel-head">
              <AlertTriangle size={18} />
              <h2>Alertas y notificaciones</h2>
            </div>

            {alertasDashboard.total === 0 ? (
              <div className="dm-alert-empty">
                No hay alertas por el momento.
              </div>
            ) : (
              <>
                <button className="dm-alert-row" onClick={() => irA('alquileres')}>
                  <span className="dm-alert-icon warn">
                    <AlertTriangle size={18} />
                  </span>

                  <span>
                    <strong>
                      {alertasDashboard.alquileresPorVencer.length} alquileres vencen en 3 días o menos.
                    </strong>
                    <small>Ver alquileres</small>
                  </span>

                  <span className="dm-alert-arrow">›</span>
                </button>

                <button className="dm-alert-row" onClick={() => irA('inventario')}>
                  <span className="dm-alert-icon info">
                    <Package size={18} />
                  </span>

                  <span>
                    <strong>
                      {alertasDashboard.productosBajoStock.length} productos con stock bajo.
                    </strong>
                    <small>Ver inventario</small>
                  </span>

                  <span className="dm-alert-arrow">›</span>
                </button>
              </>
            )}
          </section>
        </aside>

        {/* Resumen mensual */}
        <article className="dm-panel dm-monthly">
          <div className="dm-panel-head">
            <Activity size={18} />
            <h2>Resumen mensual de alquileres</h2>
          </div>

          <div className="dm-monthly-body">
            <div className="dm-chart">
              {datosMensuales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={datosMensuales} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradMensual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fill="url(#gradMensual)"
                      dot={{ r: 3, fill: '#ffffff', stroke: '#f59e0b', strokeWidth: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="dm-empty">Aún no hay alquileres registrados.</p>
              )}
            </div>

            <div className="dm-monthly-total">
              <span>Total de alquileres ({resumenMensual.mes})</span>
              <strong>{resumenMensual.total}</strong>

              {resumenMensual.variacion !== null && (
                <p className={resumenMensual.variacion >= 0 ? 'positive' : 'negative'}>
                  {resumenMensual.variacion >= 0 ? '▲' : '▼'} {Math.abs(resumenMensual.variacion)}%
                  <small> vs. {resumenMensual.mesAnterior}</small>
                </p>
              )}
            </div>
          </div>
        </article>
      </section>
    </main>
  )
}

export default DashboardPage
