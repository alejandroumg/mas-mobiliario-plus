import { useEffect, useState } from 'react'
import axios from 'axios'
import { Pencil, Plus, Trash2, UserCheck, UserX } from 'lucide-react'

const API = 'http://127.0.0.1:8000/api'

function UsersPage() {
  const [usuarios, setUsuarios] = useState([])
  const [logs, setLogs] = useState([])
  const [editando, setEditando] = useState(null)

  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    rol: 'usuario',
    estado: 'activo',
  })

  useEffect(() => {
    cargarDatos()
  }, [])

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
    const confirmar = confirm(`¿Deseas eliminar al usuario ${usuario.nombre}?`)

    if (!confirmar) return

    try {
      await axios.delete(`${API}/usuarios-sistema/${usuario.id}/`)
      await cargarDatos()
    } catch (error) {
      console.error(error.response?.data || error)
      alert('No se pudo eliminar el usuario')
    }
  }

  return (
    <main className="main-content">
      <div className="page-title">
        <h1>Pantalla de Usuarios</h1>
      </div>

      <section className="users-layout">
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

        <section className="table-card users-table-card">
          <h2>Usuarios registrados</h2>

          <table>
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
              {usuarios.map((usuario) => (
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
                    <div className="contact-actions">
                      <button
                        className="icon-action-btn"
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

              {usuarios.length === 0 && (
                <tr>
                  <td colSpan="5">No hay usuarios registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </section>

      <section className="table-card">
        <h2>Logs de actividad recientes</h2>

        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Módulo</th>
              <th>Descripción</th>
            </tr>
          </thead>

          <tbody>
            {logs.slice(0, 8).map((log) => (
              <tr key={log.id}>
                <td>{log.usuario_nombre || 'Sistema'}</td>
                <td>{log.accion}</td>
                <td>{log.modulo}</td>
                <td>{log.descripcion || 'Sin descripción'}</td>
              </tr>
            ))}

            {logs.length === 0 && (
              <tr>
                <td colSpan="4">No hay logs registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  )
}

export default UsersPage