import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Pencil,
  Plus,
  Trash2,
  UserCheck,
  UserX,
  Search,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  RotateCcw,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

function UsersPage() {
  const [usuarios, setUsuarios] = useState([])
  const [logs, setLogs] = useState([])
  const [editando, setEditando] = useState(null)

  const [busquedaUsuarios, setBusquedaUsuarios] = useState('')
  const [paginaUsuarios, setPaginaUsuarios] = useState(1)

  const [busquedaDescripcionLog, setBusquedaDescripcionLog] = useState('')
  const [filtroLogUsuario, setFiltroLogUsuario] = useState('')
  const [filtroLogAccion, setFiltroLogAccion] = useState('')
  const [filtroLogModulo, setFiltroLogModulo] = useState('')
  const [fechaInicioLog, setFechaInicioLog] = useState('')
  const [fechaFinLog, setFechaFinLog] = useState('')
  const [fechaExactaLog, setFechaExactaLog] = useState('')
  const [paginaLogs, setPaginaLogs] = useState(1)
  const [filtroAbierto, setFiltroAbierto] = useState(null)

  const usuariosPorPagina = 4
  const logsPorPagina = 8

  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    password: '',
    rol: 'usuario',
    estado: 'activo',
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    setPaginaUsuarios(1)
  }, [busquedaUsuarios])

  useEffect(() => {
    setPaginaLogs(1)
  }, [
    busquedaDescripcionLog,
    filtroLogUsuario,
    filtroLogAccion,
    filtroLogModulo,
    fechaInicioLog,
    fechaFinLog,
    fechaExactaLog,
  ])

  const cargarDatos = async () => {
    const [resUsuarios, resLogs] = await Promise.all([
      axios.get(`${API}/usuarios-sistema/`),
      axios.get(`${API}/logs-actividad/`),
    ])

    setUsuarios(resUsuarios.data)
    setLogs(resLogs.data)
  }

  const registrarLog = async (accion, descripcion, usuarioId = null) => {
    try {
      await axios.post(`${API}/logs-actividad/`, {
        usuario: usuarioId,
        accion,
        modulo: 'Usuarios',
        descripcion,
      })
    } catch (error) {
      console.error('No se pudo registrar el log', error)
    }
  }

  const limpiarForm = () => {
    setForm({
      nombre: '',
      correo: '',
      password: '',
      rol: 'usuario',
      estado: 'activo',
    })
    setEditando(null)
  }

  const guardarUsuario = async (e) => {
    e.preventDefault()

    if (!form.nombre || !form.correo) {
      alert('Completa el nombre y correo del usuario')
      return
    }

    if (!editando && !form.password) {
      alert('Ingresa una contraseña para el usuario')
      return
    }

    try {
      if (editando) {
        await axios.put(`${API}/usuarios-sistema/${editando.id}/`, form)
        await registrarLog(
          'Actualización de usuario',
          `Se actualizó la información de ${form.nombre}`,
          editando.id
        )
      } else {
        const res = await axios.post(`${API}/usuarios-sistema/`, form)
        await registrarLog(
          'Registro de usuario',
          `Se registró el usuario ${form.nombre}`,
          res.data.id
        )
      }

      await cargarDatos()
      limpiarForm()
    } catch (error) {
      console.error(error.response?.data || error)
      alert('No se pudo guardar el usuario')
    }
  }

  const cargarUsuarioParaEditar = (usuario) => {
    setEditando(usuario)
    setForm({
      nombre: usuario.nombre,
      correo: usuario.correo,
      password: '',
      rol: usuario.rol,
      estado: usuario.estado,
    })
  }

  const cambiarEstado = async (usuario) => {
    const nuevoEstado = usuario.estado === 'activo' ? 'inactivo' : 'activo'

    try {
      await axios.patch(`${API}/usuarios-sistema/${usuario.id}/`, {
        estado: nuevoEstado,
      })

      await registrarLog(
        'Cambio de estado',
        `El usuario ${usuario.nombre} cambió a estado ${nuevoEstado}`,
        usuario.id
      )

      await cargarDatos()
    } catch (error) {
      console.error(error.response?.data || error)
      alert('No se pudo cambiar el estado del usuario')
    }
  }

  const eliminarUsuario = async (usuario) => {
    const confirmar = await window.appConfirm({
      title: 'Eliminar usuario',
      message: `¿Deseas eliminar al usuario ${usuario.nombre}?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'warning',
    })

    if (!confirmar) return

    try {
      await axios.delete(`${API}/usuarios-sistema/${usuario.id}/`)
      await cargarDatos()
    } catch (error) {
      console.error(error.response?.data || error)
      alert('No se pudo eliminar el usuario')
    }
  }

  const obtenerFechaLog = (log) => {
    return (
      log.fecha ||
      log.fecha_creacion ||
      log.created_at ||
      log.createdAt ||
      log.fecha_registro ||
      ''
    )
  }

  const formatearFechaLog = (log) => {
    const fecha = obtenerFechaLog(log)

    if (!fecha) return 'Sin fecha'

    const fechaParseada = new Date(fecha)

    if (Number.isNaN(fechaParseada.getTime())) return 'Sin fecha'

    return fechaParseada.toLocaleDateString('es-GT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const estaEnRangoFecha = (log) => {
    if (!fechaInicioLog && !fechaFinLog) return true

    const fecha = obtenerFechaLog(log)
    if (!fecha) return false

    const fechaLog = new Date(fecha)
    if (Number.isNaN(fechaLog.getTime())) return false

    const inicio = fechaInicioLog
      ? new Date(`${fechaInicioLog}T00:00:00`)
      : null

    const fin = fechaFinLog
      ? new Date(`${fechaFinLog}T23:59:59`)
      : null

    if (inicio && fechaLog < inicio) return false
    if (fin && fechaLog > fin) return false

    return true
  }

  const toggleFiltro = (filtro) => {
    setFiltroAbierto(filtroAbierto === filtro ? null : filtro)
  }

  const limpiarFiltrosLogs = () => {
    setBusquedaDescripcionLog('')
    setFiltroLogUsuario('')
    setFiltroLogAccion('')
    setFiltroLogModulo('')
    setFechaInicioLog('')
    setFechaFinLog('')
    setFechaExactaLog('')
  }

  const usuariosFiltrados = usuarios.filter((usuario) =>
    usuario.nombre.toLowerCase().includes(busquedaUsuarios.toLowerCase())
  )

  const totalPaginasUsuarios =
    Math.ceil(usuariosFiltrados.length / usuariosPorPagina) || 1

  const usuariosPaginados = usuariosFiltrados.slice(
    (paginaUsuarios - 1) * usuariosPorPagina,
    paginaUsuarios * usuariosPorPagina
  )

  const opcionesUsuariosLogs = [
    ...new Set(logs.map((log) => log.usuario_nombre || 'Sistema')),
  ]

  const opcionesAccionesLogs = [
    ...new Set(logs.map((log) => log.accion).filter(Boolean)),
  ]

  const opcionesModulosLogs = [
    ...new Set(logs.map((log) => log.modulo).filter(Boolean)),
  ]

  const logsFiltrados = logs.filter((log) => {
    const usuarioLog = log.usuario_nombre || 'Sistema'
    const descripcion = log.descripcion || 'Sin descripción'

    const coincideDescripcion = descripcion
      .toLowerCase()
      .includes(busquedaDescripcionLog.toLowerCase())

    const coincideUsuario =
      filtroLogUsuario === '' || usuarioLog === filtroLogUsuario

    const coincideAccion =
      filtroLogAccion === '' || log.accion === filtroLogAccion

    const coincideModulo =
      filtroLogModulo === '' || log.modulo === filtroLogModulo

    const coincideFechaExacta =
      fechaExactaLog === '' || log.fecha === fechaExactaLog

    return (
      coincideDescripcion &&
      coincideUsuario &&
      coincideAccion &&
      coincideModulo &&
      estaEnRangoFecha(log) &&
      coincideFechaExacta
    )
  })

  const totalPaginasLogs =
    Math.ceil(logsFiltrados.length / logsPorPagina) || 1

  const logsPaginados = logsFiltrados.slice(
    (paginaLogs - 1) * logsPorPagina,
    paginaLogs * logsPorPagina
  )

  return (
    <main className="main-content users-page">
      <div className="page-title">
        <h1>Usuarios</h1>
      </div>

      <section className="users-layout users-layout-equal">
        <form className="user-form-card" onSubmit={guardarUsuario}>
          <div className="form-header">
            <div>
              <h2>{editando ? 'Editar usuario' : 'Nuevo usuario'}</h2>
              <p>Gestión básica de usuarios, roles y estado.</p>
            </div>
            <Plus size={24} />
          </div>

          <label>
            Nombre
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre del usuario"
            />
          </label>

          <label>
            Correo electrónico
            <input
              type="email"
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
              placeholder="correo@ejemplo.com"
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editando ? 'Dejar vacío para no cambiar' : 'Contraseña del usuario'}
            />
          </label>

          <label>
            Rol
            <select
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
            >
              <option value="administrador">Administrador</option>
              <option value="usuario">Usuario</option>
            </select>
          </label>

          <label>
            Estado
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </label>

          <div className="form-actions">
            <button type="button" className="secondary-btn" onClick={limpiarForm}>
              Cancelar
            </button>

            <button type="submit" className="primary-btn">
              {editando ? 'Guardar cambios' : 'Registrar usuario'}
            </button>
          </div>
        </form>

        <section className="table-card users-table-card users-registered-card">
          <div className="users-card-header">
            <h2>Usuarios registrados</h2>

            <label className="users-search">
              <Search size={17} />
              <input
                value={busquedaUsuarios}
                onChange={(e) => setBusquedaUsuarios(e.target.value)}
                placeholder="Buscar por nombre..."
              />
            </label>
          </div>

          <div className="users-table-scroll">
            <table className="users-clean-table users-registered-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {usuariosPaginados.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>{usuario.nombre}</td>
                    <td>{usuario.correo}</td>
                    <td>{usuario.rol}</td>
                    <td>
                      <span className={`user-status ${usuario.estado}`}>
                        {usuario.estado}
                      </span>
                    </td>
                    <td>
                      <div className="contact-actions users-actions">
                        <button
                          className="icon-action-btn inventory-action-edit"
                          data-tooltip="Editar usuario"
                          onClick={() => cargarUsuarioParaEditar(usuario)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          className={`icon-action-btn ${
                            usuario.estado === 'activo'
                              ? 'danger-icon-btn'
                              : 'success-icon-btn'
                          }`}
                          data-tooltip={
                            usuario.estado === 'activo'
                              ? 'Desactivar usuario'
                              : 'Activar usuario'
                          }
                          onClick={() => cambiarEstado(usuario)}
                        >
                          {usuario.estado === 'activo' ? (
                            <UserX size={17} />
                          ) : (
                            <UserCheck size={17} />
                          )}
                        </button>

                        <button
                          className="icon-action-btn danger-icon-btn"
                          data-tooltip="Eliminar usuario"
                          onClick={() => eliminarUsuario(usuario)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {usuariosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="users-table-footer">
            <span>
              Mostrando {usuariosPaginados.length} de {usuariosFiltrados.length} usuarios
            </span>

            {totalPaginasUsuarios > 1 && (
              <div className="users-pagination">
                <button
                  type="button"
                  disabled={paginaUsuarios === 1}
                  onClick={() => setPaginaUsuarios(paginaUsuarios - 1)}
                >
                  <ChevronLeft size={16} />
                </button>

                <strong>
                  {paginaUsuarios} / {totalPaginasUsuarios}
                </strong>

                <button
                  type="button"
                  disabled={paginaUsuarios === totalPaginasUsuarios}
                  onClick={() => setPaginaUsuarios(paginaUsuarios + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </section>
      </section>

      <section className="table-card users-logs-card">
        <div className="users-card-header users-logs-header">
          <div className="users-title-search">
            <h2>Logs de actividad recientes</h2>

            <label className="users-search users-log-search">
              <Search size={17} />
              <input
                value={busquedaDescripcionLog}
                onChange={(e) => setBusquedaDescripcionLog(e.target.value)}
                placeholder="Buscar por descripción..."
              />
            </label>
          </div>

          <div className="logs-date-header">
            <label>
              Desde
              <div className="users-date-input">
                <CalendarDays size={16} />
                <input
                  type="date"
                  value={fechaInicioLog}
                  onChange={(e) => setFechaInicioLog(e.target.value)}
                />
              </div>
            </label>

            <label>
              Hasta
              <div className="users-date-input">
                <CalendarDays size={16} />
                <input
                  type="date"
                  value={fechaFinLog}
                  onChange={(e) => setFechaFinLog(e.target.value)}
                />
              </div>
            </label>

            <button type="button" className="users-clear-btn" onClick={limpiarFiltrosLogs}>
              <RotateCcw size={16} />
              Limpiar
            </button>
          </div>
        </div>

        <div className="users-table-scroll">
          <table className="users-clean-table users-logs-table">
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    className="users-th-filter"
                    onClick={() => toggleFiltro('fecha')}
                  >
                    Fecha <ChevronsUpDown size={14} />
                  </button>

                  {filtroAbierto === 'fecha' && (
                    <div className="users-filter-popover users-filter-popover-wide">
                      <label>
                        Fecha
                        <input
                          type="date"
                          value={fechaExactaLog}
                          onChange={(e) => setFechaExactaLog(e.target.value)}
                        />
                      </label>
                    </div>
                  )}
                </th>

                <th>
                  <button
                    type="button"
                    className="users-th-filter"
                    onClick={() => toggleFiltro('usuario')}
                  >
                    Usuario <ChevronsUpDown size={14} />
                  </button>

                  {filtroAbierto === 'usuario' && (
                    <div className="users-filter-popover">
                      <button type="button" onClick={() => setFiltroLogUsuario('')}>
                        Todos
                      </button>

                      {opcionesUsuariosLogs.map((usuario) => (
                        <button
                          key={usuario}
                          type="button"
                          onClick={() => {
                            setFiltroLogUsuario(usuario)
                            setFiltroAbierto(null)
                          }}
                        >
                          {usuario}
                        </button>
                      ))}
                    </div>
                  )}
                </th>

                <th>
                  <button
                    type="button"
                    className="users-th-filter"
                    onClick={() => toggleFiltro('accion')}
                  >
                    Acción <ChevronsUpDown size={14} />
                  </button>

                  {filtroAbierto === 'accion' && (
                    <div className="users-filter-popover">
                      <button type="button" onClick={() => setFiltroLogAccion('')}>
                        Todas
                      </button>

                      {opcionesAccionesLogs.map((accion) => (
                        <button
                          key={accion}
                          type="button"
                          onClick={() => {
                            setFiltroLogAccion(accion)
                            setFiltroAbierto(null)
                          }}
                        >
                          {accion}
                        </button>
                      ))}
                    </div>
                  )}
                </th>

                <th>
                  <button
                    type="button"
                    className="users-th-filter"
                    onClick={() => toggleFiltro('modulo')}
                  >
                    Módulo <ChevronsUpDown size={14} />
                  </button>

                  {filtroAbierto === 'modulo' && (
                    <div className="users-filter-popover">
                      <button type="button" onClick={() => setFiltroLogModulo('')}>
                        Todos
                      </button>

                      {opcionesModulosLogs.map((modulo) => (
                        <button
                          key={modulo}
                          type="button"
                          onClick={() => {
                            setFiltroLogModulo(modulo)
                            setFiltroAbierto(null)
                          }}
                        >
                          {modulo}
                        </button>
                      ))}
                    </div>
                  )}
                </th>

                <th>
                  <button
                    type="button"
                    className="users-th-filter"
                    onClick={() => toggleFiltro('descripcion')}
                  >
                    Descripción <ChevronsUpDown size={14} />
                  </button>

                  {filtroAbierto === 'descripcion' && (
                    <div className="users-filter-popover users-filter-popover-wide">
                      <input
                        value={busquedaDescripcionLog}
                        onChange={(e) => setBusquedaDescripcionLog(e.target.value)}
                        placeholder="Buscar descripción..."
                      />
                    </div>
                  )}
                </th>
              </tr>
            </thead>

            <tbody>
              {logsPaginados.map((log) => (
                <tr key={log.id}>
                  <td>{formatearFechaLog(log)}</td>
                  <td>{log.usuario_nombre || 'Sistema'}</td>
                  <td>{log.accion}</td>
                  <td>{log.modulo}</td>
                  <td>{log.descripcion || 'Sin descripción'}</td>
                </tr>
              ))}

              {logsFiltrados.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty">
                    No hay logs registrados con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="users-table-footer">
          <span>
            Mostrando {logsPaginados.length} de {logsFiltrados.length} registros
          </span>

          {totalPaginasLogs > 1 && (
            <div className="users-pagination">
              <button
                type="button"
                disabled={paginaLogs === 1}
                onClick={() => setPaginaLogs(paginaLogs - 1)}
              >
                <ChevronLeft size={16} />
              </button>

              <strong>
                {paginaLogs} / {totalPaginasLogs}
              </strong>

              <button
                type="button"
                disabled={paginaLogs === totalPaginasLogs}
                onClick={() => setPaginaLogs(paginaLogs + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default UsersPage
