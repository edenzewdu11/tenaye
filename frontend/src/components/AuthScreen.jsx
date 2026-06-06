import { useState } from 'react'
import { api, setStoredToken, setStoredUser } from '../api'

const INTERESTS = [
    { key: 'stress', label: '😤 Stress & Anxiety' },
    { key: 'sleep', label: '😴 Sleep & Rest' },
    { key: 'relationships', label: '❤️ Relationships' },
    { key: 'work', label: '💼 Work & Career' },
    { key: 'family', label: '👨‍👩‍👧 Family' },
    { key: 'faith', label: '🙏 Faith & Spirituality' },
    { key: 'grief', label: '💙 Grief & Loss' },
    { key: 'selfcare', label: '🌿 Self-care' },
    { key: 'motivation', label: '🔥 Motivation' },
    { key: 'finance', label: '💸 Financial Stress' },
]

export default function AuthScreen({ onAuth, onGuest }) {
    const [mode, setMode] = useState('landing') // landing | login | register | interests
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [selected, setSelected] = useState([])
    const [pendingData, setPendingData] = useState(null) // holds register response before interests
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    function toggleInterest(key) {
        setSelected(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key])
    }

    async function handleRegister(e) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await api.register(email, password, name)
            setPendingData(res)
            setMode('interests')
        } catch (err) {
            const msg = err.message || ''
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

    async function handleLogin(e) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await api.login(email, password)
            setStoredToken(res.token)
            setStoredUser({ name: res.name, email: res.email, interests: res.interests || [] })
            onAuth(res)
        } catch (err) {
            const msg = err.message || ''
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

    function handleFinishInterests() {
        const res = { ...pendingData, interests: selected }
        setStoredToken(res.token)
        setStoredUser({ name: res.name, email: res.email, interests: selected })
        onAuth(res)
    }

    if (mode === 'landing') {
        return (
            <div className="auth-overlay">
                <div className="auth-box">
                    <div className="auth-logo">ጤ</div>
                    <h1 className="auth-title">Tena</h1>
                    <p className="auth-sub">Your Ethiopian wellness companion</p>

                    <div className="auth-actions">
                        <button className="btn" onClick={() => setMode('register')}>Create account</button>
                        <button className="btn btn-outline" onClick={() => setMode('login')}>Sign in</button>
                        <button className="auth-guest-btn" onClick={onGuest}>Continue as guest</button>
                    </div>

                    <p className="auth-note">
                        Guest mode is free — your data stays on this device only.
                        Create an account to sync across devices.
                    </p>
                </div>
            </div>
        )
    }

    if (mode === 'interests') {
        return (
            <div className="auth-overlay">
                <div className="auth-box">
                    <div className="auth-logo">ጤ</div>
                    <h2 className="auth-title">What matters to you?</h2>
                    <p className="auth-sub">Pick the topics you'd like Tena to focus on. You can change this later.</p>

                    <div className="interests-grid">
                        {INTERESTS.map(({ key, label }) => (
                            <button
                                key={key}
                                className={`interest-chip ${selected.includes(key) ? 'selected' : ''}`}
                                onClick={() => toggleInterest(key)}
                                type="button"
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <button className="btn" style={{ width: '100%', marginTop: '1rem' }} onClick={handleFinishInterests}>
                        {selected.length === 0 ? 'Skip for now' : 'Start my journey'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-overlay">
            <div className="auth-box">
                <button className="auth-back" onClick={() => { setMode('landing'); setError('') }}>← Back</button>

                <div className="auth-logo">ጤ</div>
                <h2 className="auth-title">
                    {mode === 'register' ? 'Create account' : 'Welcome back'}
                </h2>

                <form className="auth-form" onSubmit={mode === 'register' ? handleRegister : handleLogin}>
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
                        {loading ? '...' : mode === 'register' ? 'Continue' : 'Sign in'}
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
