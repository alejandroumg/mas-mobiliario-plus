import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
    Users,
    Package,
    CalendarDays,
    Activity,
    Plus,
    AlertTriangle,
    CheckCircle,
} from 'lucide-react'

const API = 'http://127.0.0.1:8000/api'

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

    const resumen = useMemo(() => {
        return {
            contactos: contactos.length,
            productos: productos.length,
            alquileres: alquileres.length,
            enCurso: alquileres.filter((a) => a.estado === 'en_curso').length,
            confirmados: alquileres.filter((a) => a.estado === 'confirmado').length,
            pendientes: alquileres.filter((a) => a.estado === 'pendiente').length,
            finalizados: alquileres.filter((a) => a.estado === 'finalizado').length,
            movimientos: movimientos.length,
        }
    }, [contactos, productos, alquileres, movimientos])

    const obtenerNombreProducto = (productoId) => {
        const producto = productos.find((p) => p.id === productoId)
        return producto ? producto.nombre : 'Producto no encontrado'
    }

    const formatearEstado = (estado) => {
        const estados = {
            pendiente: 'Pendiente',
            confirmado: 'Confirmado',
            en_curso: 'En curso',
            finalizado: 'Finalizado',
            cancelado: 'Cancelado',
        }

        return estados[estado] || estado
    }

    return (
        <main className="main-content">
            <div className="page-title">
                <h1>Pantalla Principal del Sistema</h1>
            </div>

            <section className="dashboard-grid">
                <article className="dashboard-card">
                    <CalendarDays size={24} />
                    <p>Alquileres activos</p>
                    <h2>{resumen.enCurso}</h2>
                    <span>En curso actualmente</span>
                </article>

                <article className="dashboard-card">
                    <Package size={24} />
                    <p>Productos disponibles</p>
                    <h2>{resumen.productos}</h2>
                    <span>Listos para alquilar</span>
                </article>

                <article className="dashboard-card">
                    <Users size={24} />
                    <p>Contactos registrados</p>
                    <h2>{resumen.contactos}</h2>
                    <span>Clientes registrados</span>
                </article>

                <article className="dashboard-card">
                    <Activity size={24} />
                    <p>Movimientos</p>
                    <h2>{resumen.movimientos}</h2>
                    <span>Entradas, salidas y devoluciones</span>
                </article>
            </section>

            <section className="dashboard-main-layout">
                <article className="table-card">
                    <h2>Actividad reciente</h2>

                    <div className="activity-list">
                        {movimientos.slice(0, 5).map((movimiento) => (
                            <div className="activity-item" key={movimiento.id}>
                                <div className="activity-icon">
                                    <Package size={18} />
                                </div>

                                <div>
                                    <strong>{obtenerNombreProducto(movimiento.producto)}</strong>
                                    <p>
                                        Movimiento de {movimiento.tipo} por {movimiento.cantidad} unidades.
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="table-card">
                    <h2>Próximos / recientes alquileres</h2>

                    <table>
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Responsable</th>
                                <th>Estado</th>
                            </tr>
                        </thead>

                        <tbody>
                            {alquileres.slice(0, 5).map((alquiler) => (
                                <tr key={alquiler.id}>
                                    <td>{String(alquiler.id).padStart(4, '0')}</td>
                                    <td>{alquiler.responsable || 'Sin responsable'}</td>
                                    <td>{formatearEstado(alquiler.estado)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </article>

                <aside className="dashboard-side">
                    <section className="side-card">
                        <h2>Acciones rápidas</h2>

                        <button onClick={() => irA('alquileres')}>
                            <Plus size={18} />
                            Ir a alquileres
                        </button>

                        <button onClick={() => irA('inventario')}>
                            <Plus size={18} />
                            Ir a inventario
                        </button>

                        <button onClick={() => irA('registro')}>
                            <Plus size={18} />
                            Nuevo contacto
                        </button>
                    </section>

                    <section className="side-card">
                        <h2>Alquileres por estado</h2>

                        <div className="status-summary">
                            <p><span>Confirmados</span><strong>{resumen.confirmados}</strong></p>
                            <p><span>En curso</span><strong>{resumen.enCurso}</strong></p>
                            <p><span>Pendientes</span><strong>{resumen.pendientes}</strong></p>
                            <p><span>Finalizados</span><strong>{resumen.finalizados}</strong></p>
                        </div>
                    </section>

                    <section className="side-card alert-card">
                        <h2>Alertas</h2>

                        <p>
                            <AlertTriangle size={18} />
                            Revisar productos dañados o fuera de uso.
                        </p>

                        <p>
                            <CheckCircle size={18} />
                            Sistema funcionando correctamente.
                        </p>
                    </section>
                </aside>
            </section>
        </main>
    )
}

export default DashboardPage