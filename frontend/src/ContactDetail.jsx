import { ArrowLeft, Phone, Mail, MapPin, Building2 } from 'lucide-react'

function ContactDetail({ contacto, categoria, volver }) {
  if (!contacto) return null

  return (
    <section>
      <button className="back-btn" onClick={volver}>
        <ArrowLeft size={18} /> Volver al listado
      </button>

      <div className="page-title">
        <h1>Detalle del Contacto</h1>
      </div>

      <div className="detail-card">
        <div className="avatar-large">
          {contacto.nombre?.slice(0, 2).toUpperCase()}
        </div>

        <h2>{contacto.nombre}</h2>

        <span className={`status ${contacto.estado}`}>
          {contacto.estado}
        </span>

        <div className="detail-grid">
          <p><Phone size={18} /> {contacto.telefono}</p>
          <p><Mail size={18} /> {contacto.correo_electronico || 'Sin correo'}</p>
          <p><MapPin size={18} /> {contacto.direccion || 'Sin dirección'}</p>
          <p><Building2 size={18} /> {contacto.empresa_organizacion || 'Sin empresa'}</p>
        </div>

        <hr />

        <p><strong>Categoría:</strong> {categoria || 'Sin categoría'}</p>
        <p><strong>Medio de contacto:</strong> {contacto.medio_contacto || 'No definido'}</p>
        <p><strong>Responsable:</strong> {contacto.responsable || 'No definido'}</p>
        <p><strong>Observaciones:</strong> {contacto.observaciones || 'Sin observaciones'}</p>
      </div>
    </section>
  )
}

export default ContactDetail