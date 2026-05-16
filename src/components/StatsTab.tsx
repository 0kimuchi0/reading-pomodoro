import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { IconQuestionMark, IconLayoutGrid, IconTrendingUp, IconBooks, IconChartPie } from '@tabler/icons-react'
import type { Book, Session } from '../types'
import HelpModal from './HelpModal'

const STATS_HELP = [
  {
    icon: <IconLayoutGrid size={18} />,
    title: 'サマリーカード',
    desc: '総セッション数・総集中時間・読了冊数・読書中冊数を一覧表示します',
    detail: '画面上部に総セッション数・総集中時間・読了冊数・読書中冊数の4つのサマリーカードを表示します。すべての期間のデータを集計した累計値です。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {/* カード4枚 */}
        {[
          { x: 6,   label: '総セッション', value: '42' },
          { x: 74,  label: '総集中（分）', value: '1050' },
          { x: 142, label: '読了', value: '7' },
          { x: 210, label: '読書中', value: '2' },
        ].map((card) => (
          <g key={card.x}>
            <rect x={card.x} y="30" width="62" height="80" rx="10" fill="#FFFFFF" stroke="#E2E1F0" strokeWidth="1.5" />
            <text x={card.x + 31} y="68" textAnchor="middle" fontSize="18" fontWeight="700" fill="#534AB7" fontFamily="sans-serif">{card.value}</text>
            <text x={card.x + 31} y="90" textAnchor="middle" fontSize="9" fill="#6B6B8A" fontFamily="sans-serif">{card.label}</text>
          </g>
        ))}
        <text x="140" y="130" textAnchor="middle" fontSize="10" fill="#6B6B8A" fontFamily="sans-serif">全期間の累計</text>
      </svg>
    ),
  },
  {
    icon: <IconTrendingUp size={18} />,
    title: '週間セッション数',
    desc: '過去7日間のセッション数の推移を折れ線グラフで確認できます',
    detail: '過去7日間のセッション数の推移を折れ線グラフで表示します。読書習慣が視覚的に確認でき、継続のモチベーション維持に役立ちます。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {/* グリッド */}
        {[30, 60, 90, 120].map(y => (
          <line key={y} x1="40" y1={y} x2="260" y2={y} stroke="#E2E1F0" strokeWidth="1" strokeDasharray="4 3" />
        ))}
        {/* 折れ線データ（7点） */}
        {(() => {
          const pts = [
            { x: 50, y: 110 }, { x: 83, y: 95 }, { x: 116, y: 80 },
            { x: 150, y: 65 }, { x: 183, y: 50 }, { x: 216, y: 70 }, { x: 250, y: 45 }
          ]
          return (
            <>
              <polyline
                points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none" stroke="#534AB7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              />
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="4" fill="#534AB7" stroke="#FFFFFF" strokeWidth="2" />
              ))}
              {/* x軸ラベル */}
              {['月', '火', '水', '木', '金', '土', '日'].map((d, i) => (
                <text key={d} x={pts[i].x} y="140" textAnchor="middle" fontSize="10" fill="#6B6B8A" fontFamily="sans-serif">{d}</text>
              ))}
            </>
          )
        })()}
      </svg>
    ),
  },
  {
    icon: <IconBooks size={18} />,
    title: '本別セッション数',
    desc: 'セッションを記録した本ごとの回数をランキング形式で表示します',
    detail: 'セッションを記録した本ごとの回数を棒グラフで表示します。どの本に最も時間を使ったかを把握できます。本棚に登録した本のうちセッションが1回以上あるものが表示されます。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {/* 水平棒グラフ */}
        {[
          { label: '吾輩は猫…', w: 160, val: '8' },
          { label: '坊っちゃん', w: 120, val: '6' },
          { label: '走れメロス', w: 80, val: '4' },
          { label: 'こころ', w: 50, val: '2' },
        ].map((bar, i) => (
          <g key={i}>
            <text x="100" y={32 + i * 32} textAnchor="end" fontSize="10" fill="#6B6B8A" fontFamily="sans-serif">{bar.label}</text>
            <rect x="106" y={18 + i * 32} width={bar.w} height="18" rx="4"
              fill={i === 0 ? '#534AB7' : i === 1 ? '#7C75D4' : i === 2 ? '#A8A3E3' : '#C8C4F0'} />
            <text x={112 + bar.w} y={31 + i * 32} fontSize="10" fill="#6B6B8A" fontFamily="sans-serif">{bar.val}</text>
          </g>
        ))}
      </svg>
    ),
  },
  {
    icon: <IconChartPie size={18} />,
    title: '読了ジャンル分布',
    desc: '読了した本のジャンル内訳を円グラフで可視化します',
    detail: '読了した本のジャンル内訳を円グラフで可視化します。どのジャンルを多く読んでいるかを把握できます。読了ステータスの本のみが集計対象です。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {/* 円グラフ（4セクター） */}
        {/* 小説 40% */}
        <path d="M110 80 L110 30 A50 50 0 0 1 153 105 Z" fill="#534AB7" />
        {/* ビジネス 30% */}
        <path d="M110 80 L153 105 A50 50 0 0 1 68 110 Z" fill="#7C75D4" />
        {/* 技術 20% */}
        <path d="M110 80 L68 110 A50 50 0 0 1 72 45 Z" fill="#A8A3E3" />
        {/* その他 10% */}
        <path d="M110 80 L72 45 A50 50 0 0 1 110 30 Z" fill="#D4D1F5" />
        {/* 凡例 */}
        {[
          { color: '#534AB7', label: '小説 40%' },
          { color: '#7C75D4', label: 'ビジネス 30%' },
          { color: '#A8A3E3', label: '技術 20%' },
          { color: '#D4D1F5', label: 'その他 10%' },
        ].map((item, i) => (
          <g key={i}>
            <rect x="180" y={35 + i * 26} width="12" height="12" rx="3" fill={item.color} />
            <text x="198" y={46 + i * 26} fontSize="11" fill="#6B6B8A" fontFamily="sans-serif">{item.label}</text>
          </g>
        ))}
      </svg>
    ),
  },
]

const COLORS = ['#534AB7', '#7C75D4', '#A8A3E3', '#D4D1F5', '#6C63C4', '#9B94D8']

const RADIAN = Math.PI / 180
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number
  innerRadius: number; outerRadius: number; percent: number
}) {
  if (percent < 0.08) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color?: string }>
  label?: string
}
function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      {label && <p className="chart-tooltip-label">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="chart-tooltip-row">
          <span className="chart-tooltip-dot" style={{ background: p.color ?? '#534AB7' }} />
          <span className="chart-tooltip-name">{p.name}</span>
          <span className="chart-tooltip-value">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

interface Props {
  books: Book[]
  sessions: Session[]
}

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return toLocalDate(d)
  })
}

export default function StatsTab({ books, sessions }: Props) {
  const [showHelp, setShowHelp] = useState(false)
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth)
  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  const isMobile = windowWidth < 480

  const last7 = getLast7Days()
  const weeklyData = last7.map(date => ({
    date: date.slice(5).split('-').map(Number).join('/'),
    セッション: sessions.filter(s => s.date === date).length,
  }))

  const titleLimit = isMobile ? 7 : 10
  const bookSessionData = books
    .filter(b => b.sessions > 0)
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 8)
    .map(b => ({ name: b.title.length > titleLimit ? b.title.slice(0, titleLimit) + '…' : b.title, セッション: b.sessions }))

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
        <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
          <LineChart data={weeklyData} margin={{ top: 5, right: 30, left: 0, bottom: isMobile ? 24 : 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={isMobile ? { fontSize: 11, fill: 'var(--color-text-muted)', angle: -45, textAnchor: 'end', dy: 4 } : { fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} height={isMobile ? 44 : 30} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={30} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="セッション" stroke="#534AB7" strokeWidth={2} dot={{ r: 4, fill: '#534AB7' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>本別セッション数</h3>
        {bookSessionData.length === 0 ? (
          <p className="chart-empty">セッションを記録すると表示されます</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bookSessionData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
              <YAxis dataKey="name" type="category" width={isMobile ? 68 : 90} tick={{ fontSize: isMobile ? 10 : 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="セッション" fill="#534AB7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="chart-card">
        <h3>読了ジャンル分布</h3>
        {genreData.length === 0 ? (
          <p className="chart-empty">読了した本が登録されると表示されます</p>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 240 : 220}>
            <PieChart>
              <Pie data={genreData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={isMobile ? 60 : 80} label={PieLabel} labelLine={false}>
                {genreData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {sessions.length === 0 && books.length === 0 && (
        <p className="empty-msg">まだデータがありません。本を登録してセッションを始めましょう！</p>
      )}
    </div>
  )
}
