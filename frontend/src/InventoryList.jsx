import { useEffect, useState } from 'react'
import axios from 'axios'
import { Package, Plus, ArrowLeftRight, History, ArrowLeft } from 'lucide-react'
import ProductForm from './ProductForm'
import InventoryMovementForm from './InventoryMovementForm'

const API = 'http://127.0.0.1:8000/api'

function InventoryList() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [alquileres, setAlquileres] = useState([])
  const [pantalla, setPantalla] = useState('listado')

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

    setProductos(resProductos.data)
    setCategorias(resCategorias.data)
    setMovimientos(resMovimientos.data)
    setAlquileres(resAlquileres.data)
  }

  const categoriasMap = Object.fromEntries(
    categorias.map((cat) => [cat.id, cat.nombre])
  )

  const productosMap = Object.fromEntries(
    productos.map((producto) => [producto.id, producto.nombre])
  )

  const formatearNoAlquiler = (id) => String(id).padStart(4, '0')

  const obtenerCantidadPorTipo = (productoId, tipo) => {
    return movimientos
      .filter((m) => m.producto === productoId && m.tipo === tipo)
      .reduce((total, m) => total + m.cantidad, 0)
  }

  const obtenerEnUsoActual = (productoId) => {
    return alquileres
      .filter((alquiler) => alquiler.estado === 'confirmado')
      .flatMap((alquiler) => alquiler.detalles || [])
      .filter((detalle) => detalle.producto === productoId)
      .reduce((total, detalle) => total + detalle.cantidad, 0)
  }

  const construirFilasInventario = () => {
    const filas = []

    productos.forEach((producto) => {
      const categoria = categoriasMap[producto.categoria] || 'Sin categoría'
      const observaciones = producto.observaciones || 'Sin observaciones'

      const enUso = obtenerEnUsoActual(producto.id)
      const danados = obtenerCantidadPorTipo(producto.id, 'danado')

      if (producto.cantidad_disponible > 0) {
        filas.push({
          id: `${producto.id}-disponible`,
          productoId: producto.id,
          producto: producto.nombre,
          categoria,
          cantidad: producto.cantidad_disponible,
          estado: 'disponible',
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

  const alquileresEnUsoFiltrados = alquileres
    .filter((alquiler) => alquiler.estado === 'confirmado')
    .flatMap((alquiler) =>
      (alquiler.detalles || [])
        .filter((detalle) =>
          historialFiltro.productoId === '' ||
          detalle.producto === historialFiltro.productoId
        )
        .map((detalle) => ({
          id: `${alquiler.id}-${detalle.id}`,
          noAlquiler: formatearNoAlquiler(alquiler.id),
          producto: productosMap[detalle.producto] || 'Producto no encontrado',
          cantidad: detalle.cantidad,
          fecha: alquiler.fecha_evento,
          responsable: alquiler.responsable || 'Sin responsable',
        }))
    )

  const abrirHistorialFiltrado = (productoId, tipo) => {
    setHistorialFiltro({
      productoId,
      tipo,
    })

    setPantalla('historial')
  }

  const disponibles = productos.filter((p) => p.cantidad_disponible > 0).length

  if (pantalla === 'registro') {
    return (
      <ProductForm
        categorias={categorias}
        volver={() => setPantalla('listado')}
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
            {historialFiltro.tipo === 'en_uso'
              ? 'Productos Actualmente en Uso'
              : 'Historial de Movimientos de Inventario'}
          </h1>
        </div>

        {historialFiltro.tipo === 'en_uso' && (
          <>
            <p className="history-filter-label">
              Mostrando alquileres activos confirmados
            </p>

            <section className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>No. alquiler</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Fecha evento</th>
                    <th>Responsable</th>
                  </tr>
                </thead>

                <tbody>
                  {alquileresEnUsoFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty">
                        No hay productos actualmente en uso
                      </td>
                    </tr>
                  ) : (
                    alquileresEnUsoFiltrados.map((item) => (
                      <tr key={item.id}>
                        <td>{item.noAlquiler}</td>
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

        {historialFiltro.tipo !== 'en_uso' && (
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

  return (
    <>
      <div className="page-title">
        <h1>Pantalla de Listado de Inventario</h1>
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
          <option value="en_uso">En uso</option>
          <option value="danado">Dañado</option>
        </select>

        <button className="movement-btn" onClick={() => setPantalla('movimiento')}>
          <ArrowLeftRight size={18} />
          Registrar movimiento
        </button>

        <button className="inventory-primary-btn" onClick={() => setPantalla('registro')}>
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
              <th>Observaciones</th>
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
                    {fila.estado === 'en_uso' ? (
                      <button
                        className="inventory-status en_uso status-click"
                        onClick={() => abrirHistorialFiltrado(fila.productoId, 'en_uso')}
                      >
                        En uso +
                      </button>
                    ) : (
                      <span className={`inventory-status ${fila.estado}`}>
                        {fila.estado === 'disponible' && 'Disponible'}
                        {fila.estado === 'danado' && 'Dañado'}
                      </span>
                    )}
                  </td>
                  <td>{fila.observaciones}</td>
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