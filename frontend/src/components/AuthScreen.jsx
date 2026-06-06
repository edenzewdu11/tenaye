import { useState } from 'react'
import { api, setStoredToken, setStoredUser } from '../api'

export default function AuthScreen({ onAuth, onGuest }) {
    const [mode, setMode] = useState('landing') // landing | login | register
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            let res
            if (mode === 'register') {
                res = await api.register(email, password, name)
            } else {
                res = await api.login(email, password)
            }
            setStoredToken(res.token)
            setStoredUser({ name: res.name, email: res.email })
            onAuth(res)
        } catch (err) {
            const msg = err.message || ''
            // parse JSON error from backend
            try {
                const json = JSON.parse(msg.replace(/^\d+: /, ''))
                setError(json.error || msg)
            } catch {
                setError(msg)
            }
        } finally {
            setLoading(false)
        }
    }

    if (mode === 'landing') {
        return (
            <div className="auth-overlay">
                <div className="auth-box">
                    <div className="auth-logo">ጤ</div>
                    <h1 className="auth-title">Tena</h1>
                    <p className="auth-sub">Your Ethiopian wellness companion</p>

                    <div className="auth-actions">
                        <button className="btn" onClick={() => setMode('register')}>
                            Create account
                        </button>
                        <button className="btn btn-outline" onClick={() => setMode('login')}>
                            Sign in
                        </button>
                        <button className="auth-guest-btn" onClick={onGuest}>
                            Continue as guest
                        </button>
                    </div>

                    <p className="auth-note">
                        Guest mode is free — your data stays on this device only.
                        Create an account to sync across devices.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-overlay">
            <div className="auth-box">
                <button className="auth-back" onClick={() => { setMode('landing'); setError('') }}>
                    ← Back
                </button>

                <div className="auth-logo">ጤ</div>
                <h2 className="auth-title">
                    {mode === 'register' ? 'Create account' : 'Welcome back'}
                </h2>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <input
                            className="auth-input"
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    )}
                    <input
                        className="auth-input"
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    <input
                        className="auth-input"
                        type="password"
                        placeholder="Password (min 6 chars)"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />

                    {error && <div className="auth-error">{error}</div>}

                    <button className="btn" type="submit" disabled={loading}>
                        {loading ? '...' : mode === 'register' ? 'Create account' : 'Sign in'}
                    </button>
                </form>

                <button
                    className="auth-switch"
                    onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
                >
                    {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
            </div>
        </div>
    )
}
