import { useEffect, useState } from 'react'
import axios from 'axios'
import { User, Calendar, Plus, Eye, Pencil, Lock, Unlock, Search, Tag, Clock, ChevronRight, ChevronLeft, UserCheck } from 'lucide-react'
import logo from './assets/logo.png'
import ContactForm from './ContactForm'
import ContactDetail from './ContactDetail'
import InventoryList from './InventoryList'
import RentalsList from './RentalsList'
import ReportsPage from './ReportsPage'
import UsersPage from './UsersPage'
import DashboardPage from './DashboardPage'
import LoginPage from './LoginPage'
import './App.css'
import ToastHost from './ToastHost'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import ConfirmHost from './ConfirmHost'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api' 
function App() {
  const [pantalla, setPantalla] = useState('dashboard')
  const [usuarioActual, setUsuarioActual] = useState(() => {
    const usuarioGuardado = localStorage.getItem('usuarioActual')
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null
  })

  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false)

  const iniciarSesion = (usuario) => {
    setUsuarioActual(usuario)
    localStorage.setItem('usuarioActual', JSON.stringify(usuario))
    setPantalla('dashboard')
    setMenuPerfilAbierto(false)
  }

  const cerrarSesion = () => {
    localStorage.removeItem('usuarioActual')
    setUsuarioActual(null)
    setPantalla('dashboard')
    setMenuPerfilAbierto(false)
  }
  const [contactos, setContactos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [contactoEditando, setContactoEditando] = useState(null)
  const [contactoSeleccionado, setContactoSeleccionado] = useState(null)

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(6)

  useEffect(() => {
    setPagina(1)
  }, [busqueda, filtroEstado, filtroCategoria, porPagina])

  useEffect(() => {
    if (usuarioActual?.rol !== 'administrador' && pantalla === 'usuarios') {
      setPantalla('dashboard')
    }
  }, [usuarioActual, pantalla])
  useEffect(() => {
  if (usuarioActual) {
    cargarDatos()
  }
}, [usuarioActual])

  const cargarDatos = async () => {
    const resContactos = await axios.get(`${API}/contactos/`)
    const resCategorias = await axios.get(`${API}/categorias-contacto/`)

    setContactos(resContactos.data)
    setCategorias(resCategorias.data)
  }

  const categoriasMap = Object.fromEntries(
    categorias.map((cat) => [cat.id, cat.nombre])
  )

  const activos = contactos.filter((c) => c.estado === 'activo').length

  const contactosFiltrados = contactos.filter((contacto) => {
    const texto = busqueda.toLowerCase()

    const coincideBusqueda =
      contacto.nombre.toLowerCase().includes(texto) ||
      contacto.telefono.toLowerCase().includes(texto) ||
      (contacto.direccion || '').toLowerCase().includes(texto)

    const coincideEstado =
      filtroEstado === '' || contacto.estado === filtroEstado

    const coincideCategoria =
      filtroCategoria === '' || String(contacto.categoria) === filtroCategoria

    return coincideBusqueda && coincideEstado && coincideCategoria
  })

  const totalPaginas = Math.max(1, Math.ceil(contactosFiltrados.length / porPagina))
  const paginaActual = Math.min(pagina, totalPaginas)
  const inicio = (paginaActual - 1) * porPagina
  const contactosPagina = contactosFiltrados.slice(inicio, inicio + porPagina)

  const obtenerPaginas = () => {
    if (totalPaginas <= 5) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1)
    }
    const paginas = [1]
    const desde = Math.max(2, paginaActual - 1)
    const hasta = Math.min(totalPaginas - 1, paginaActual + 1)
    if (desde > 2) paginas.push('...')
    for (let i = desde; i <= hasta; i++) paginas.push(i)
    if (hasta < totalPaginas - 1) paginas.push('...')
    paginas.push(totalPaginas)
    return paginas
  }

  const cambiarEstadoContacto = async (contacto) => {
    const nuevoEstado = contacto.estado === 'activo' ? 'inactivo' : 'activo'

    try {
      await axios.patch(`${API}/contactos/${contacto.id}/`, {
        estado: nuevoEstado,
      })

      await cargarDatos()
    } catch (error) {
      console.error(error.response?.data || error)
      alert('No se pudo cambiar el estado del contacto')
    }
  }

  if (!usuarioActual) {
    return <LoginPage onLogin={iniciarSesion} />
  }


  // Datos visuales para listado de contactos estilo mockup
  const coloresCategoriasContactos = ['#f59e0b', '#a855f7', '#60a5fa', '#fb7185', '#94a3b8', '#22c55e']

  const contactosRecientes = [...contactos]
    .sort((a, b) => (b.id || 0) - (a.id || 0))
    .slice(0, 5)

  const datosCategoriasContacto = categorias
    .map((cat, index) => ({
      id: cat.id,
      nombre: cat.nombre,
      cantidad: contactos.filter((contacto) => String(contacto.categoria) === String(cat.id)).length,
      color: coloresCategoriasContactos[index % coloresCategoriasContactos.length],
    }))
    .filter((cat) => cat.cantidad > 0)

  const coloresCategoriasMap = Object.fromEntries(
    datosCategoriasContacto.map((categoria) => [categoria.id, categoria.color])
  )

  const totalContactosGrafica = datosCategoriasContacto.reduce(
    (total, cat) => total + cat.cantidad,
    0
  )

  const obtenerInicialesContacto = (nombre = '') => {
    const partes = nombre.trim().split(' ').filter(Boolean)
    if (partes.length === 0) return 'CN'
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase()
  }

  const obtenerCorreoContacto = (contacto) => {
    return contacto.correo || contacto.email || contacto.correo_electronico || 'Sin correo registrado'
  }

  return (
    <>
      <ToastHost />
      <ConfirmHost />
    <div className="app">
      <aside className="sidebar">
        <img src={logo} alt="Mobiliario Plus" className="logo" />
        <p>Soluciones para eventos inolvidables</p>

        <nav>
          <span
            className={pantalla === 'dashboard' ? 'active' : ''}
            onClick={() => setPantalla('dashboard')}
          >
            Dashboard
          </span>

          <span
            className={['listado', 'registro', 'detalle'].includes(pantalla) ? 'active' : ''}
            onClick={() => {
              setContactoEditando(null)
              setContactoSeleccionado(null)
              setPantalla('listado')
            }}
          >
            Contactos
          </span>

          <span
            className={pantalla === 'alquileres' ? 'active' : ''}
            onClick={() => setPantalla('alquileres')}
          >
            Alquileres
          </span>

          <span
            className={pantalla === 'inventario' ? 'active' : ''}
            onClick={() => setPantalla('inventario')}
          >
            Inventario
          </span>

          {usuarioActual.rol === 'administrador' && (
            <span
              className={pantalla === 'usuarios' ? 'active' : ''}
              onClick={() => setPantalla('usuarios')}
            >
              Usuarios
            </span>
          )}

          <span
            className={pantalla === 'reportes' ? 'active' : ''}
            onClick={() => setPantalla('reportes')}
          >
            Reportes
          </span>


        </nav>

      </aside>

      <main className="content">
        <header className="topbar">
          <div className="profile-menu-wrapper">
            <button
              className={`user ${menuPerfilAbierto ? 'user-active' : ''}`}
              onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}
            >
              AR
            </button>

            {menuPerfilAbierto && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <strong>{usuarioActual.nombre}</strong>
                  <span>{usuarioActual.rol}</span>
                </div>

                <button type="button">
                  Mi perfil
                </button>

                <button type="button" onClick={cerrarSesion}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        {pantalla === 'registro' ? (
          <ContactForm
            categorias={categorias}
            contactoEditando={contactoEditando}
            volver={() => {
              setContactoEditando(null)
              setPantalla('listado')
            }}
            onGuardado={cargarDatos}
          />
        ) : pantalla === 'detalle' ? (
          <ContactDetail
            contacto={contactoSeleccionado}
            categoria={categoriasMap[contactoSeleccionado?.categoria]}
            volver={() => {
              setContactoSeleccionado(null)
              setPantalla('listado')
            }}
          />
        ) : pantalla === 'inventario' ? (
          <InventoryList />
        ) : pantalla === 'alquileres' ? (
          <RentalsList />
        ) : pantalla === 'dashboard' ? (
          <DashboardPage irA={setPantalla} />
        ) : pantalla === 'usuarios' ? (
          <UsersPage />
        ) : pantalla === 'reportes' ? (
          <ReportsPage />
        ) : pantalla === 'configuracion' ? (
          <div className="page-title">
            <h1>Configuración</h1>
          </div>
        ) : (
          <section className="cm-page">
            <section className="cm-title">
              <h1>Listado de Contactos</h1>
            </section>

            <section className="cm-toolbar">
              <label className="cm-search">
                <Search size={19} />
                <input
                  placeholder="Buscar contacto, teléfono o categoría..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </label>

              <label className="cm-filter">
                <span>Categoría</span>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                >
                  <option value="">Todas</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="cm-filter">
                <span>Estado</span>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="seguimiento">Seguimiento</option>
                </select>
              </label>

              <button
                className="cm-primary-btn"
                onClick={() => {
                  setContactoEditando(null)
                  setPantalla('registro')
                }}
              >
                <Plus size={19} />
                Nuevo contacto
              </button>
            </section>

            <section className="cm-stats">
              <article className="cm-stat">
                <div className="cm-stat-icon">
                  <User size={26} />
                </div>

                <div>
                  <p>Total contactos</p>
                  <strong>{contactos.length}</strong>
                  <span>Todos los registros</span>
                </div>
              </article>

              <article className="cm-stat">
                <div className="cm-stat-icon success">
                  <UserCheck size={26} />
                </div>

                <div>
                  <p>Activos</p>
                  <strong>{activos}</strong>
                  <span>Clientes disponibles</span>
                </div>
              </article>

              <article className="cm-stat">
                <div className="cm-stat-icon">
                  <Tag size={26} />
                </div>

                <div>
                  <p>Categorías</p>
                  <strong>{categorias.length}</strong>
                  <span>Tipos de clasificación</span>
                </div>
              </article>
            </section>

            <section className="cm-layout">
              <article className="cm-table-card">
                <div className="cm-table-scroll">
                  <table className="cm-table">
                    <colgroup>
                      <col style={{ width: '27%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '14%' }} />
                    </colgroup>

                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Teléfono</th>
                        <th>Dirección</th>
                        <th>Categoría</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {contactosPagina.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="empty">
                            Aún no hay contactos registrados
                          </td>
                        </tr>
                      ) : (
                        contactosPagina.map((contacto) => (
                          <tr key={contacto.id}>
                            <td>
                              <div className="cm-contact-cell">
                                <span className="cm-avatar">
                                  {obtenerInicialesContacto(contacto.nombre)}
                                </span>
                                <div>
                                  <strong>{contacto.nombre}</strong>
                                  <small>{obtenerCorreoContacto(contacto)}</small>
                                </div>
                              </div>
                            </td>

                            <td>{contacto.telefono}</td>
                            <td>
                              <span className="cm-address">{contacto.direccion || 'Sin dirección'}</span>
                            </td>

                            <td>
                              <span
                                className="cm-category-pill"
                                style={{ '--category-color': coloresCategoriasMap[contacto.categoria] || '#94a3b8' }}
                              >
                                {categoriasMap[contacto.categoria] || 'Sin categoría'}
                              </span>
                            </td>

                            <td>
                              <span className={`cm-status cm-status--${contacto.estado}`}>
                                {contacto.estado}
                              </span>
                            </td>

                            <td className="cm-actions-cell">
                              <div className="cm-actions">
                                <button
                                  className="icon-action-btn"
                                  data-tooltip="Ver contacto"
                                  onClick={() => {
                                    setContactoSeleccionado(contacto)
                                    setPantalla('detalle')
                                  }}
                                >
                                  <Eye size={18} />
                                </button>

                                <button
                                  className="icon-action-btn"
                                  data-tooltip="Editar contacto"
                                  onClick={() => {
                                    setContactoEditando(contacto)
                                    setPantalla('registro')
                                  }}
                                >
                                  <Pencil size={18} />
                                </button>

                                <button
                                  className={`icon-action-btn ${
                                    contacto.estado === 'activo' ? 'danger-icon-btn' : 'success-icon-btn'
                                  }`}
                                  data-tooltip={
                                    contacto.estado === 'activo' ? 'Desactivar contacto' : 'Activar contacto'
                                  }
                                  onClick={() => cambiarEstadoContacto(contacto)}
                                >
                                  {contacto.estado === 'activo' ? <Lock size={18} /> : <Unlock size={18} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="cm-table-footer">
                  <span className="cm-showing">
                    {contactosFiltrados.length === 0
                      ? 'Mostrando 0 contactos'
                      : `Mostrando ${inicio + 1} a ${Math.min(inicio + porPagina, contactosFiltrados.length)} de ${contactosFiltrados.length} contactos`}
                  </span>

                  <div className="cm-pagination">
                    <button
                      type="button"
                      disabled={paginaActual === 1}
                      onClick={() => setPagina(paginaActual - 1)}
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {obtenerPaginas().map((p, i) =>
                      p === '...' ? (
                        <span key={`dots-${i}`} className="cm-page-dots">…</span>
                      ) : (
                        <button
                          type="button"
                          key={p}
                          className={p === paginaActual ? 'active' : ''}
                          onClick={() => setPagina(p)}
                        >
                          {p}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      disabled={paginaActual === totalPaginas}
                      onClick={() => setPagina(paginaActual + 1)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <select
                    className="cm-per-page"
                    value={porPagina}
                    onChange={(e) => setPorPagina(Number(e.target.value))}
                  >
                    <option value={6}>6 por página</option>
                    <option value={10}>10 por página</option>
                    <option value={20}>20 por página</option>
                  </select>
                </div>
              </article>

              <aside className="cm-side">
                <section className="cm-side-card">
                  <div className="cm-side-head">
                    <Clock size={18} />
                    <h2>Actividad reciente</h2>
                  </div>

                  <div className="cm-activity-list">
                    {contactosRecientes.length === 0 ? (
                      <p className="cm-empty">No hay actividad reciente.</p>
                    ) : (
                      contactosRecientes.map((contacto) => (
                        <div className="cm-activity-item" key={contacto.id}>
                          <span className="cm-activity-icon">
                            <User size={16} />
                          </span>

                          <div>
                            <strong>Contacto registrado</strong>
                            <p>{contacto.nombre}</p>
                          </div>

                          <small>Reciente</small>
                        </div>
                      ))
                    )}
                  </div>

                  <button className="cm-side-link">
                    Ver toda la actividad
                    <ChevronRight size={15} />
                  </button>
                </section>

                <section className="cm-side-card">
                  <div className="cm-side-head">
                    <Tag size={18} />
                    <h2>Clasificación por categoría</h2>
                  </div>

                  {totalContactosGrafica === 0 ? (
                    <p className="cm-empty">No hay datos para mostrar.</p>
                  ) : (
                    <>
                      <div className="cm-donut">
                        <div className="cm-donut-box">
                          <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                              <Pie
                                data={datosCategoriasContacto}
                                dataKey="cantidad"
                                nameKey="nombre"
                                innerRadius={45}
                                outerRadius={67}
                                paddingAngle={3}
                              >
                                {datosCategoriasContacto.map((item) => (
                                  <Cell key={item.id} fill={item.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>

                          <div className="cm-donut-center">
                            <strong>{contactos.length}</strong>
                            <span>Total</span>
                          </div>
                        </div>

                        <div className="cm-legend">
                          {datosCategoriasContacto.map((item) => (
                            <p key={item.id}>
                              <i style={{ background: item.color }} />
                              <span>{item.nombre}</span>
                              <strong>
                                {item.cantidad}
                                <small>
                                  ({Math.round((item.cantidad / totalContactosGrafica) * 100)}%)
                                </small>
                              </strong>
                            </p>
                          ))}
                        </div>
                      </div>

                      <button className="cm-side-link">
                        Ver reporte completo
                        <ChevronRight size={15} />
                      </button>
                    </>
                  )}
                </section>
              </aside>
            </section>
          </section>
        )}
      </main>
    </div>
    </>
  )
}

export default App
