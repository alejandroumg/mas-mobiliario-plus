import { useState } from 'react'
import axios from 'axios'
import { ArrowLeft, Save } from 'lucide-react'

const API = 'http://127.0.0.1:8000/api'

function InventoryMovementForm({ productos, volver, onGuardado }) {
    const [form, setForm] = useState({
        producto: '',
        tipo: 'salida',
        cantidad: '',
        observaciones: '',
    })

    const cambiar = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const guardar = async (e) => {
        e.preventDefault()

        if (!form.producto || !form.cantidad) {
            alert('Producto y cantidad son obligatorios')
            return
        }

        try {
            await axios.post(`${API}/movimientos-inventario/`, {
                producto: Number(form.producto),
                tipo: form.tipo,
                cantidad: Number(form.cantidad),
                observaciones: form.observaciones,
            })

            await onGuardado()
            alert('Movimiento registrado correctamente')
            volver()
        } catch (error) {
            const data = error.response?.data

            let mensaje = 'No se pudo registrar el movimiento'

            if (Array.isArray(data)) {
                mensaje = data[0]
            } else if (typeof data === 'string') {
                mensaje = data
            } else if (data?.detail) {
                mensaje = data.detail
            } else if (data?.non_field_errors) {
                mensaje = data.non_field_errors[0]
            }

            alert(mensaje)
        }
    }

    return (
        <section>
            <button className="back-btn" onClick={volver}>
                <ArrowLeft size={18} /> Volver al inventario
            </button>

            <div className="page-title">
                <h1>Registrar Movimiento de Inventario</h1>
            </div>

            <form className="form-card" onSubmit={guardar}>
                <h3>Movimiento por cantidad</h3>

                <div className="form-grid">
                    <select name="producto" value={form.producto} onChange={cambiar}>
                        <option value="">Selecciona un producto</option>
                        {productos.map((producto) => (
                            <option key={producto.id} value={producto.id}>
                                {producto.nombre} - Disponible: {producto.cantidad_disponible}
                            </option>
                        ))}
                    </select>

                    <select name="tipo" value={form.tipo} onChange={cambiar}>
                        <option value="salida">Salida / En alquiler</option>
                        <option value="devolucion">Devolución</option>
                        <option value="danado">Dañado</option>
                        <option value="perdido">Perdido</option>
                        <option value="fuera_uso">Fuera de uso</option>
                        <option value="entrada">Entrada</option>
                    </select>

                    <input
                        name="cantidad"
                        type="number"
                        value={form.cantidad}
                        placeholder="Cantidad *"
                        onChange={cambiar}
                    />
                </div>

                <textarea
                    name="observaciones"
                    value={form.observaciones}
                    placeholder="Observaciones del movimiento"
                    onChange={cambiar}
                />

                <div className="form-actions">
                    <button type="button" className="secondary-btn" onClick={volver}>
                        Cancelar
                    </button>

                    <button type="submit" className="primary-btn">
                        <Save size={18} /> Guardar movimiento
                    </button>
                </div>
            </form>
        </section>
    )
}

export default InventoryMovementForm