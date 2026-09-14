import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { BarChart3, FileSpreadsheet, Users, Package, CalendarDays } from 'lucide-react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts'

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

        const fechaRegistro = new Date(`${fecha}T00:00:00`)
        const inicio = fechaInicio ? new Date(`${fechaInicio}T00:00:00`) : null
        const fin = fechaFin ? new Date(`${fechaFin}T23:59:59`) : null

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
            estaEnRango(movimiento.creado_en || movimiento.fecha_movimiento)
        )
    }, [movimientos, fechaInicio, fechaFin])

    const resumen = {
        totalContactos: contactos.length,
        contactosActivos: contactos.filter((c) => c.estado === 'activo').length,
        totalProductos: productos.length,
        productosDisponibles: productos.filter((p) => p.estado === 'disponible').length,
        totalAlquileres: alquileresFiltrados.length,
        alquileresPendientes: alquileresFiltrados.filter((a) => a.estado === 'pendiente').length,
        alquileresConfirmados: alquileresFiltrados.filter((a) => a.estado === 'confirmado').length,
        alquileresEnCurso: alquileresFiltrados.filter((a) => a.estado === 'en_curso').length,
        alquileresFinalizados: alquileresFiltrados.filter((a) => a.estado === 'finalizado').length,
        alquileresCancelados: alquileresFiltrados.filter((a) => a.estado === 'cancelado').length,
    }

    const datosGraficaMensual = useMemo(() => {
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

        const datos = meses.map((mes) => ({
            mes,
            alquileres: 0,
        }))

        alquileresFiltrados.forEach((alquiler) => {
            const fecha = alquiler.fecha_inicio || alquiler.fecha_evento
            if (!fecha) return

            const mes = new Date(`${fecha}T00:00:00`).getMonth()
            datos[mes].alquileres += 1
        })

        return datos.filter((item) => item.alquileres > 0)
    }, [alquileresFiltrados])

    const datosEstados = [
        { name: 'Confirmados', value: resumen.alquileresConfirmados, color: '#f59e0b' },
        { name: 'En curso', value: resumen.alquileresEnCurso, color: '#16a34a' },
        { name: 'Pendientes', value: resumen.alquileresPendientes, color: '#facc15' },
        { name: 'Finalizados', value: resumen.alquileresFinalizados, color: '#6b7280' },
        { name: 'Cancelados', value: resumen.alquileresCancelados, color: '#ef4444' },
    ].filter((item) => item.value > 0)

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

            <section className="reports-charts-grid">
                <article className="report-card line-chart-card">
                    <div className="report-header">
                        <div>
                            <h2>Resumen mensual de alquileres</h2>
                            <p>Cantidad de alquileres registrados por mes.</p>
                        </div>
                        <BarChart3 size={26} />
                    </div>

                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={datosGraficaMensual}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="mes" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="alquileres"
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    dot={{ r: 5 }}
                                    activeDot={{ r: 7 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </article>

                <article className="report-card donut-chart-card">
                    <div className="report-header">
                        <div>
                            <h2>Alquileres por estado</h2>
                            <p>Distribución actual.</p>
                        </div>
                        <BarChart3 size={24} />
                    </div>

                    <div className="donut-layout">
                        <div className="donut-chart-box">
                            <ResponsiveContainer width="100%" height={210}>
                                <PieChart>
                                    <Pie
                                        data={datosEstados}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={58}
                                        outerRadius={82}
                                        paddingAngle={3}
                                    >
                                        {datosEstados.map((entry) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>

                            <div className="donut-center">
                                <strong>{resumen.totalAlquileres}</strong>
                                <span>Total</span>
                            </div>
                        </div>

                        <div className="donut-legend">
                            {datosEstados.map((item) => (
                                <p key={item.name}>
                                    <i style={{ background: item.color }} />
                                    <span>{item.name}</span>
                                    <strong>{item.value}</strong>
                                </p>
                            ))}
                        </div>
                    </div>
                </article>
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