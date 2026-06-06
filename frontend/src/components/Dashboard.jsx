import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid,
} from 'recharts'
import { api } from '../api'

const COLORS = { good: '#22c55e', surviving: '#f59e0b', burned: '#ef4444' }
const LABELS = { 1: 'Burned', 2: 'Surviving', 3: 'Good' }

export default function Dashboard({ refreshKey = 0 }) {
  const [data, setData] = useState(null)

  async function refresh() {
    try {
      const d = await api.dashboard()
      setData(d)
    } catch {}
  }

  useEffect(() => { refresh() }, [refreshKey])

  const series = (data?.series || []).map((s) => ({
    ...s,
    day: new Date(s.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' }),
    value: s.score ?? 0,
  }))

  return (
    <>
      <div className="card card-dashboard">
        <h2>Last 7 days</h2>
        <div className="dash-stats">
          <div className="stat"><div className="v">{data?.average ?? '—'}</div><div className="l">Avg</div></div>
          <div className="stat"><div className="v">{data?.streak_days ?? 0}</div><div className="l">Streak</div></div>
          <div className="stat"><div className="v">{data?.total_checkins ?? 0}</div><div className="l">Check-ins</div></div>
        </div>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={series} margin={{ top: 10, right: 8, bottom: 0, left: -28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2a44" vertical={false} />
              <XAxis dataKey="day" stroke="#93a0b8" tick={{ fontSize: 12 }} />
              <YAxis
                domain={[0, 3]} ticks={[1, 2, 3]} stroke="#93a0b8" tick={{ fontSize: 11 }}
                tickFormatter={(v) => LABELS[v] || ''}
              />
              <Tooltip
                contentStyle={{ background: '#0e1830', border: '1px solid #1f2a44', borderRadius: 8 }}
                formatter={(v, _n, p) => [p.payload.mood ? `${LABELS[v]} (${p.payload.mood})` : 'No check-in', 'Mood']}
                labelStyle={{ color: '#93a0b8' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {series.map((s, i) => (
                  <Cell key={i} fill={s.mood ? COLORS[s.mood] : '#1f2a44'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}
