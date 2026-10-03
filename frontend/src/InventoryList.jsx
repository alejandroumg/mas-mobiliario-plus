import { useEffect, useState } from 'react'
import axios from 'axios'
import { Package, Plus, ArrowLeftRight, History, ArrowLeft, Eye, Pencil, MoreVertical } from 'lucide-react'
import ProductForm from './ProductForm'
import InventoryMovementForm from './InventoryMovementForm'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api' 
function InventoryList() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [alquileres, setAlquileres] = useState([])
  const [contactos, setContactos] = useState([])
  const [pantalla, setPantalla] = useState('listado')
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [menuEstadoAbierto, setMenuEstadoAbierto] = useState(null)

  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const [historialFiltro, setHistorialFiltro] = useState({
    productoId: '',
    tipo: '',
  })

  useEffect(() => {
    cargarInventario()
  }, [])

  const cargarInventario = async () => {
    const resProductos = await axios.get(`${API}/productos/`)
    const resCategorias = await axios.get(`${API}/categorias-producto/`)
    const resMovimientos = await axios.get(`${API}/movimientos-inventario/`)
    const resAlquileres = await axios.get(`${API}/alquileres/`)
    const resContactos = await axios.get(`${API}/contactos/`)

    setProductos(resProductos.data)
    setCategorias(resCategorias.data)
    setMovimientos(resMovimientos.data)
    setAlquileres(resAlquileres.data)
    setContactos(resContactos.data)
  }

  const categoriasMap = Object.fromEntries(
    categorias.map((cat) => [cat.id, cat.nombre])
  )

  const productosMap = Object.fromEntries(
    productos.map((producto) => [producto.id, producto.nombre])
  )

  const contactosMap = Object.fromEntries(
    contactos.map((contacto) => [contacto.id, contacto.nombre])
  )

  const formatearNoAlquiler = (id) => String(id).padStart(4, '0')

  const obtenerCantidadPorTipo = (productoId, tipo) => {
    return movimientos
      .filter((m) => m.producto === productoId && m.tipo === tipo)
      .reduce((total, m) => total + m.cantidad, 0)
  }

  const obtenerCantidadPorEstadoAlquiler = (productoId, estado) => {
    return alquileres
      .filter((alquiler) => alquiler.estado === estado)
      .flatMap((alquiler) => alquiler.detalles || [])
      .filter((detalle) => detalle.producto === productoId)
      .reduce((total, detalle) => total + detalle.cantidad, 0)
  }

  const obtenerReservadoActual = (productoId) => {
    return obtenerCantidadPorEstadoAlquiler(productoId, 'confirmado')
  }

  const obtenerEnUsoActual = (productoId) => {
    return obtenerCantidadPorEstadoAlquiler(productoId, 'en_curso')
  }

  const construirFilasInventario = () => {
    const filas = []

    productos.forEach((producto) => {
      const categoria = categoriasMap[producto.categoria] || 'Sin categoría'
      const observaciones = producto.observaciones || 'Sin observaciones'
      const estadoBase = producto.estado || 'disponible'
      const estadoVisual =
        estadoBase === 'danado' || estadoBase === 'fuera_uso'
          ? estadoBase
          : 'disponible'

      const reservado = obtenerReservadoActual(producto.id)
      const enUso = obtenerEnUsoActual(producto.id)
      const danados = obtenerCantidadPorTipo(producto.id, 'danado')

      if (producto.cantidad_disponible > 0) {
        filas.push({
          id: `${producto.id}-disponible`,
          productoId: producto.id,
          producto: producto.nombre,
          categoria,
          cantidad: producto.cantidad_disponible,
          estado: estadoVisual,
          observaciones,
        })
      }

      if (reservado > 0) {
        filas.push({
          id: `${producto.id}-reservado`,
          productoId: producto.id,
          producto: producto.nombre,
          categoria,
          cantidad: reservado,
          estado: 'reservado',
          observaciones,
        })
      }

      if (enUso > 0) {
        filas.push({
          id: `${producto.id}-en-uso`,
          productoId: producto.id,
          producto: producto.nombre,
          categoria,
          cantidad: enUso,
          estado: 'en_uso',
          observaciones,
        })
      }

      if (danados > 0) {
        filas.push({
          id: `${producto.id}-danado`,
          productoId: producto.id,
          producto: producto.nombre,
          categoria,
          cantidad: danados,
          estado: 'danado',
          observaciones,
        })
      }
    })

    return filas
  }

  const filasInventario = construirFilasInventario()

  const filasFiltradas = filasInventario.filter((fila) => {
    const texto = busqueda.toLowerCase()

    const coincideBusqueda =
      fila.producto.toLowerCase().includes(texto) ||
      fila.observaciones.toLowerCase().includes(texto)

    const coincideCategoria =
      filtroCategoria === '' || fila.categoria === categoriasMap[filtroCategoria]

    const coincideEstado =
      filtroEstado === '' || fila.estado === filtroEstado

    return coincideBusqueda && coincideCategoria && coincideEstado
  })

  const movimientosFiltrados = movimientos.filter((movimiento) => {
    const coincideProducto =
      historialFiltro.productoId === '' ||
      movimiento.producto === historialFiltro.productoId

    const coincideTipo =
      historialFiltro.tipo === '' || movimiento.tipo === historialFiltro.tipo

    return coincideProducto && coincideTipo
  })

  const estadoAlquilerDetalle =
    historialFiltro.tipo === 'reservado' ? 'confirmado' : 'en_curso'

  const alquileresRelacionadosFiltrados = alquileres
    .filter((alquiler) => alquiler.estado === estadoAlquilerDetalle)
    .flatMap((alquiler) =>
      (alquiler.detalles || [])
        .filter((detalle) =>
          historialFiltro.productoId === '' ||
          detalle.producto === historialFiltro.productoId
        )
        .map((detalle) => ({
          id: `${alquiler.id}-${detalle.id}`,
          noAlquiler: formatearNoAlquiler(alquiler.id),
          cliente: contactosMap[alquiler.cliente] || 'Cliente no encontrado',
          producto: productosMap[detalle.producto] || 'Producto no encontrado',
          cantidad: detalle.cantidad,
          fecha: alquiler.fecha_inicio || alquiler.fecha_evento,
          responsable: alquiler.responsable || 'Sin responsable',
        }))
    )

  const mostrandoAsignaciones =
    historialFiltro.tipo === 'en_uso' ||
    historialFiltro.tipo === 'reservado'

  const abrirHistorialFiltrado = (productoId, tipo) => {
    setHistorialFiltro({
      productoId,
      tipo,
    })

    setPantalla('historial')
  }

  const textoEstadoProducto = (estado) => {
    if (estado === 'disponible') return 'Disponible'
    if (estado === 'reservado') return 'Reservado'
    if (estado === 'en_uso') return 'En uso'
    if (estado === 'danado') return 'Dañado'
    if (estado === 'fuera_uso') return 'Fuera de uso'
    return 'Sin estado'
  }

  const verDetalleProducto = (productoId) => {
    const producto = productos.find((item) => item.id === productoId)

    if (!producto) return

    setProductoSeleccionado(producto)
    setPantalla('detalle')
  }

  const cambiarEstadoProducto = async (productoId, nuevoEstado) => {
    try {
      await axios.patch(`${API}/productos/${productoId}/`, {
        estado: nuevoEstado,
      })

      setMenuEstadoAbierto(null)
      await cargarInventario()
      alert('Estado del producto actualizado correctamente')
    } catch (error) {
      alert('No se pudo actualizar el estado del producto')
    }
  }

  const disponibles = productos.filter((p) => p.cantidad_disponible > 0).length

  if (pantalla === 'registro') {
    return (
      <ProductForm
        categorias={categorias}
        productoEditando={productoSeleccionado}
        volver={() => {
          setProductoSeleccionado(null)
          setPantalla('listado')
        }}
        onGuardado={cargarInventario}
      />
    )
  }

  if (pantalla === 'movimiento') {
    return (
      <InventoryMovementForm
        productos={productos}
        volver={() => setPantalla('listado')}
        onGuardado={cargarInventario}
      />
    )
  }

  if (pantalla === 'historial') {
    return (
      <>
        <button className="back-btn" onClick={() => setPantalla('listado')}>
          <ArrowLeft size={18} /> Volver al inventario
        </button>

        <div className="page-title">
          <h1>
            {historialFiltro.tipo === 'reservado'
              ? 'Productos Actualmente Reservados'
              : historialFiltro.tipo === 'en_uso'
                ? 'Productos Actualmente en Uso'
                : 'Historial de Movimientos de Inventario'}
          </h1>
        </div>

        {mostrandoAsignaciones && (
          <>
            <p className="history-filter-label">
              {historialFiltro.tipo === 'reservado'
                ? 'Mostrando reservas de alquileres confirmados'
                : 'Mostrando productos de alquileres actualmente en curso'}
            </p>

            <section className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>No. alquiler</th>
                    <th>Cliente</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Fecha inicio</th>
                    <th>Responsable</th>
                  </tr>
                </thead>

                <tbody>
                  {alquileresRelacionadosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty">
                        No hay registros activos para este producto
                      </td>
                    </tr>
                  ) : (
                    alquileresRelacionadosFiltrados.map((item) => (
                      <tr key={item.id}>
                        <td>{item.noAlquiler}</td>
                        <td>{item.cliente}</td>
                        <td>{item.producto}</td>
                        <td>{item.cantidad}</td>
                        <td>{item.fecha}</td>
                        <td>{item.responsable}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}

        {!mostrandoAsignaciones && (
          <section className="table-card">
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
                {movimientosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty">
                      Aún no hay movimientos registrados
                    </td>
                  </tr>
                ) : (
                  movimientosFiltrados.map((movimiento) => (
                    <tr key={movimiento.id}>
                      <td>{productosMap[movimiento.producto] || 'Producto no encontrado'}</td>
                      <td>{movimiento.tipo}</td>
                      <td>{movimiento.cantidad}</td>
                      <td>{movimiento.observaciones || 'Sin observaciones'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        )}
      </>
    )
  }

  if (pantalla === 'detalle') {
    const categoriaProducto =
      categoriasMap[productoSeleccionado?.categoria] || 'Sin categoría'

    return (
      <>
        <button
          className="back-btn"
          onClick={() => {
            setProductoSeleccionado(null)
            setPantalla('listado')
          }}
        >
          <ArrowLeft size={18} /> Volver al inventario
        </button>

        <section className="inventory-detail-layout">
          <article className="inventory-detail-card">
            <div className="inventory-detail-icon">
              <Package size={42} />
            </div>

            <h1>{productoSeleccionado?.nombre}</h1>

            <span className={`inventory-status ${productoSeleccionado?.estado || 'disponible'}`}>
              {textoEstadoProducto(productoSeleccionado?.estado || 'disponible')}
            </span>

            <div className="inventory-detail-grid">
              <div>
                <strong>Categoría</strong>
                <p>{categoriaProducto}</p>
              </div>

              <div>
                <strong>Cantidad disponible</strong>
                <p>{productoSeleccionado?.cantidad_disponible ?? 0}</p>
              </div>

              <div>
                <strong>Estado</strong>
                <p>{textoEstadoProducto(productoSeleccionado?.estado || 'disponible')}</p>
              </div>
            </div>

            <hr />

            <div className="inventory-detail-observations">
              <strong>Observaciones</strong>
              <p>{productoSeleccionado?.observaciones || 'Sin observaciones'}</p>
            </div>
          </article>

          <aside className="inventory-detail-side">
            <h2>Resumen del producto</h2>

            <div className="inventory-detail-summary">
              <p>
                <span>Cantidad disponible</span>
                <strong>{productoSeleccionado?.cantidad_disponible ?? 0}</strong>
              </p>

              <p>
                <span>Categoría</span>
                <strong>{categoriaProducto}</strong>
              </p>
            </div>
          </aside>
        </section>
      </>
    )
  }

  return (
    <>
      <div className="page-title">
        <h1>Listado de Inventario</h1>
      </div>

      <section className="inventory-filters">
        <input
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
          <option value="">Categoría</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>

        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Estado</option>
          <option value="disponible">Disponible</option>
          <option value="reservado">Reservado</option>
          <option value="en_uso">En uso</option>
          <option value="danado">Dañado</option>
          <option value="fuera_uso">Fuera de uso</option>
        </select>

        <button className="movement-btn" onClick={() => setPantalla('movimiento')}>
          <ArrowLeftRight size={18} />
          Registrar movimiento
        </button>

        <button
          className="inventory-primary-btn"
          onClick={() => {
            setProductoSeleccionado(null)
            setPantalla('registro')
          }}
        >
          <Plus size={18} />
          Nuevo producto
        </button>
      </section>

      <section className="cards">
        <div className="card">
          <Package />
          <h3>Total productos</h3>
          <strong>{productos.length}</strong>
        </div>

        <div className="card">
          <Package />
          <h3>Disponibles</h3>
          <strong>{disponibles}</strong>
        </div>

        <div className="card">
          <Package />
          <h3>Categorías</h3>
          <strong>{categorias.length}</strong>
        </div>
      </section>

      <div className="table-header-actions">
        <button
          className="history-btn"
          onClick={() => {
            setHistorialFiltro({ productoId: '', tipo: '' })
            setPantalla('historial')
          }}
        >
          <History size={18} />
          Ver historial de movimientos
        </button>
      </div>

      <section className="table-card">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Cantidad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filasFiltradas.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty">
                  Aún no hay productos registrados
                </td>
              </tr>
            ) : (
              filasFiltradas.map((fila) => (
                <tr key={fila.id}>
                  <td>{fila.producto}</td>
                  <td>{fila.categoria}</td>
                  <td>{fila.cantidad}</td>
                  <td>
                    {fila.estado === 'en_uso' || fila.estado === 'reservado' ? (
                      <button
                        className={`inventory-status ${fila.estado} status-click`}
                        onClick={() =>
                          abrirHistorialFiltrado(fila.productoId, fila.estado)
                        }
                      >
                        {fila.estado === 'en_uso' ? 'En uso +' : 'Reservado +'}
                      </button>
                    ) : (
                      <span className={`inventory-status ${fila.estado}`}>
                        {textoEstadoProducto(fila.estado)}
                      </span>
                    )}
                  </td>
                  <td className="inventory-actions">
                    <button
                      className="icon-action-btn inventory-action-view"
                      data-tooltip="Ver producto"
                      onClick={() => {
                        setMenuEstadoAbierto(null)
                        verDetalleProducto(fila.productoId)
                      }}
                    >
                      <Eye size={18} />
                    </button>

                    <button
                      className="icon-action-btn inventory-action-edit"
                      data-tooltip="Editar producto"
                      onClick={() => {
                        const productoBase = productos.find(
                          (producto) => producto.id === fila.productoId
                        )

                        setMenuEstadoAbierto(null)
                        setProductoSeleccionado(productoBase)
                        setPantalla('registro')
                      }}
                    >
                      <Pencil size={18} />
                    </button>

                    <div className="inventory-more-wrapper">
                      <button
                        className="icon-action-btn inventory-action-more"
                        data-tooltip="Cambiar estado"
                        onClick={() =>
                          setMenuEstadoAbierto(
                            menuEstadoAbierto === fila.id ? null : fila.id
                          )
                        }
                      >
                        <MoreVertical size={18} />
                      </button>

                      {menuEstadoAbierto === fila.id && (
                        <div className="inventory-more-menu">
                          <button
                            type="button"
                            onClick={() =>
                              cambiarEstadoProducto(fila.productoId, 'disponible')
                            }
                          >
                            Disponible
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              cambiarEstadoProducto(fila.productoId, 'danado')
                            }
                          >
                            Dañado
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              cambiarEstadoProducto(fila.productoId, 'fuera_uso')
                            }
                          >
                            Fuera de uso
                          </button>
                        </div>
                      )}
                    </div>
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

export default InventoryList
