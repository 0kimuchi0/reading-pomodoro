import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { IconQuestionMark, IconLayoutGrid, IconTrendingUp, IconBooks, IconChartPie } from '@tabler/icons-react'
import type { Book, Session } from '../types'
import HelpModal from './HelpModal'

const STATS_HELP = [
  { icon: <IconLayoutGrid size={18} />,  title: 'サマリーカード',   desc: '総セッション数・総集中時間・読了冊数・読書中冊数を一覧表示します' },
  { icon: <IconTrendingUp size={18} />,  title: '週間セッション数', desc: '過去7日間のセッション数の推移を折れ線グラフで確認できます' },
  { icon: <IconBooks size={18} />,       title: '本別セッション数', desc: 'セッションを記録した本ごとの回数をランキング形式で表示します' },
  { icon: <IconChartPie size={18} />,    title: '読了ジャンル分布', desc: '読了した本のジャンル内訳を円グラフで可視化します' },
]

const COLORS = ['#534AB7', '#7C75D4', '#A8A3E3', '#D4D1F5', '#6C63C4', '#9B94D8']

interface Props {
  books: Book[]
  sessions: Session[]
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

export default function StatsTab({ books, sessions }: Props) {
  const [showHelp, setShowHelp] = useState(false)
  const last7 = getLast7Days()
  const weeklyData = last7.map(date => ({
    date: date.slice(5),
    セッション: sessions.filter(s => s.date === date).length,
  }))

  const bookSessionData = books
    .filter(b => b.sessions > 0)
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 8)
    .map(b => ({ name: b.title.length > 10 ? b.title.slice(0, 10) + '…' : b.title, セッション: b.sessions }))

  const genreMap: Record<string, number> = {}
  books.filter(b => b.status === 'done').forEach(b => {
    genreMap[b.genre] = (genreMap[b.genre] ?? 0) + 1
  })
  const genreData = Object.entries(genreMap).map(([name, value]) => ({ name, value }))

  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0)
  const doneBooks = books.filter(b => b.status === 'done').length
  const readingBooks = books.filter(b => b.status === 'reading').length

  return (
    <div className="stats-tab">
      {showHelp && <HelpModal title="統計の見方" items={STATS_HELP} onClose={() => setShowHelp(false)} />}
      <div className="tab-help-row">
        <button className="help-btn" onClick={() => setShowHelp(true)}>
          <IconQuestionMark size={15} />
          使い方
        </button>
      </div>
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-value">{totalSessions}</span>
          <span className="summary-label">総セッション</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{totalMinutes}</span>
          <span className="summary-label">総集中（分）</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{doneBooks}</span>
          <span className="summary-label">読了</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{readingBooks}</span>
          <span className="summary-label">読書中</span>
        </div>
      </div>

      <div className="chart-card">
        <h3>週間セッション数</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="セッション" stroke="#534AB7" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {bookSessionData.length > 0 && (
        <div className="chart-card">
          <h3>本別セッション数</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bookSessionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="セッション" fill="#534AB7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {genreData.length > 0 && (
        <div className="chart-card">
          <h3>読了ジャンル分布</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={genreData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {genreData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {sessions.length === 0 && books.length === 0 && (
        <p className="empty-msg">まだデータがありません。本を登録してセッションを始めましょう！</p>
      )}
    </div>
  )
}
