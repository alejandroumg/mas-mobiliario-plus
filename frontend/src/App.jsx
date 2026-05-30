import { useEffect, useState } from 'react'
import axios from 'axios'
import { User, Calendar, Plus, Eye, Pencil, Lock, Unlock } from 'lucide-react'
import logo from './assets/logo.png'
import ContactForm from './ContactForm'
import ContactDetail from './ContactDetail'
import InventoryList from './InventoryList'
import RentalsList from './RentalsList'
import './App.css'

const API = 'http://127.0.0.1:8000/api'

function App() {
  const [pantalla, setPantalla] = useState('listado')
  const [contactos, setContactos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [contactoEditando, setContactoEditando] = useState(null)
  const [contactoSeleccionado, setContactoSeleccionado] = useState(null)

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

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

  return (
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

          <span
            className={pantalla === 'reportes' ? 'active' : ''}
            onClick={() => setPantalla('reportes')}
          >
            Reportes
          </span>

          <span
            className={pantalla === 'configuracion' ? 'active' : ''}
            onClick={() => setPantalla('configuracion')}
          >
            Configuración
          </span>
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div className="user">AR</div>
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
          <div className="page-title">
            <h1>Dashboard</h1>
          </div>
        ) : pantalla === 'reportes' ? (
          <div className="page-title">
            <h1>Reportes</h1>
          </div>
        ) : pantalla === 'configuracion' ? (
          <div className="page-title">
            <h1>Configuración</h1>
          </div>
        ) : (
          <>
            <section className="page-title">
              <h1>Pantalla de Listado de Contactos</h1>
            </section>

            <section className="filters">
              <input
                placeholder="Buscar contacto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />

              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="seguimiento">Seguimiento</option>
              </select>

              <button
                onClick={() => {
                  setContactoEditando(null)
                  setPantalla('registro')
                }}
              >
                <Plus size={18} /> Nuevo contacto
              </button>
            </section>

            <section className="cards">
              <div className="card">
                <User />
                <h3>Total contactos</h3>
                <strong>{contactos.length}</strong>
              </div>

              <div className="card">
                <User />
                <h3>Activos</h3>
                <strong>{activos}</strong>
              </div>

              <div className="card">
                <Calendar />
                <h3>Categorías</h3>
                <strong>{categorias.length}</strong>
              </div>
            </section>

            <section className="table-card">
              <table>
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
                  {contactosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty">
                        Aún no hay contactos registrados
                      </td>
                    </tr>
                  ) : (
                    contactosFiltrados.map((contacto) => (
                      <tr key={contacto.id}>
                        <td>{contacto.nombre}</td>
                        <td>{contacto.telefono}</td>
                        <td>{contacto.direccion || 'Sin dirección'}</td>
                        <td>{categoriasMap[contacto.categoria] || 'Sin categoría'}</td>
                        <td>{contacto.estado}</td>
                        <td className="contact-actions">
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
                              contacto.estado === 'activo'
                                ? 'danger-icon-btn'
                                : 'success-icon-btn'
                            }`}
                            data-tooltip={
                              contacto.estado === 'activo'
                                ? 'Desactivar contacto'
                                : 'Activar contacto'
                            }
                            onClick={() => cambiarEstadoContacto(contacto)}
                          >
                            {contacto.estado === 'activo' ? (
                              <Lock size={18} />
                            ) : (
                              <Unlock size={18} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default App
