import { useState } from 'react'
import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react'
import axios from 'axios'
import logo from './assets/logo.png'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api' 
function LoginPage({ onLogin }) {
    const [correo, setCorreo] = useState('')
    const [password, setPassword] = useState('')
    const [mostrarPassword, setMostrarPassword] = useState(false)
    const [error, setError] = useState('')

    const iniciarSesion = async (e) => {
        e.preventDefault()
        setError('')

        if (!correo || !password) {
            setError('Ingresa tu correo y contraseña.')
            return
        }

        try {
            const res = await axios.post(`${API}/login/`, {
                correo,
                password,
            })

            onLogin(res.data)
        } catch (error) {
            console.error(error)
            setError('No se pudo iniciar sesión. Verifica tu correo y contraseña.')
        }
    }

    return (
        <main className="login-page">
            <section className="login-brand">
                <div className="login-brand-content">
                    <img src={logo} alt="Mobiliario Plus" className="login-logo-img" />
                    <h2>Soluciones para eventos inolvidables</h2>
                </div>
            </section>

            <section className="login-panel">
                <form className="login-card" onSubmit={iniciarSesion}>
                    <h1>Pantalla de Inicio de Sesión</h1>
                    <span>Accede a tu cuenta para continuar</span>

                    {error && <div className="login-error">{error}</div>}

                    <label>
                        Correo electrónico
                        <div className="login-input">
                            <Mail size={19} />
                            <input
                                type="email"
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                                placeholder="Ingresa tu correo electrónico"
                            />
                        </div>
                    </label>

                    <label>
                        Contraseña
                        <div className="login-input">
                            <Lock size={19} />
                            <input
                                type={mostrarPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Ingresa tu contraseña"
                            />

                            <button
                                type="button"
                                className="show-password-btn"
                                onClick={() => setMostrarPassword(!mostrarPassword)}
                            >
                                {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </label>

                    <div className="login-options">
                        <label className="remember-option">
                            <input type="checkbox" />
                            Recordarme
                        </label>

                        <button type="button" className="forgot-btn">
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>

                    <button type="submit" className="login-submit">
                        <LogIn size={19} />
                        Iniciar sesión
                    </button>
                </form>

                <p className="login-help">
                    ¿Necesitas ayuda? <strong>Contacta al administrador</strong>
                </p>

                <p className="login-footer">
                    © 2024 Mobiliario Plus. Todos los derechos reservados.
                </p>
            </section>
        </main>
    )
}

export default LoginPage