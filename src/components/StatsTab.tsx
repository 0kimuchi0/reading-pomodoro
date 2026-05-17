import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { IconQuestionMark, IconLayoutGrid, IconTrendingUp, IconBooks, IconChartPie, IconFlame, IconCalendar, IconRun, IconChartBar, IconSum } from '@tabler/icons-react'
import type { Book, Session } from '../types'
import HelpModal from './HelpModal'

const STATS_HELP = [
  {
    icon: <IconLayoutGrid size={18} />,
    title: 'サマリーカード',
    desc: '総セッション数・総集中時間・読了冊数・連続日数などを一覧表示します',
    detail: '総セッション数・総集中時間・読了冊数・読書中冊数の4つの基本指標をサマリーカードで表示します。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {[
          { x: 10, y: 10, label: '総セッション', value: '42' },
          { x: 148, y: 10, label: '総集中（分）', value: '1050' },
          { x: 10, y: 88, label: '読了', value: '7' },
          { x: 148, y: 88, label: '連続日数', value: '5' },
        ].map((card) => (
          <g key={`${card.x}-${card.y}`}>
            <rect x={card.x} y={card.y} width="122" height="62" rx="10" fill="#FFFFFF" stroke="#E2E1F0" strokeWidth="1.5" />
            <text x={card.x + 61} y={card.y + 23} textAnchor="middle" dominantBaseline="central" fontSize="20" fontWeight="700" fill="#534AB7" fontFamily="sans-serif">{card.value}</text>
            <text x={card.x + 61} y={card.y + 44} textAnchor="middle" dominantBaseline="central" fontSize="9" fill="#6B6B8A" fontFamily="sans-serif">{card.label}</text>
          </g>
        ))}
      </svg>
    ),
  },
  {
    icon: <IconSum size={18} />,
    title: '平均サマリーカード',
    desc: '1日・週・1冊あたりの平均セッション数や集中時間を表示します',
    detail: '読書習慣の密度を示す4つの平均指標を表示します。「1日平均セッション」「1日平均集中（分）」は読書のあった日だけを対象に計算します。「週平均セッション」は開始週から現在までの全週で平均します。「1冊平均セッション」はセッションが1回以上ある本のみを対象にします。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {[
          { x: 10, y: 10, label: '1日平均セッション', value: '2.5' },
          { x: 148, y: 10, label: '1日平均集中（分）', value: '62' },
          { x: 10, y: 88, label: '週平均セッション', value: '17' },
          { x: 148, y: 88, label: '1冊平均セッション', value: '21' },
        ].map((card) => (
          <g key={`${card.x}-${card.y}`}>
            <rect x={card.x} y={card.y} width="122" height="62" rx="10" fill="#FFFFFF" stroke="#E2E1F0" strokeWidth="1.5" />
            <text x={card.x + 61} y={card.y + 23} textAnchor="middle" dominantBaseline="central" fontSize="20" fontWeight="700" fill="#534AB7" fontFamily="sans-serif">{card.value}</text>
            <text x={card.x + 61} y={card.y + 44} textAnchor="middle" dominantBaseline="central" fontSize="9" fill="#6B6B8A" fontFamily="sans-serif">{card.label}</text>
          </g>
        ))}
      </svg>
    ),
  },
  {
    icon: <IconFlame size={18} />,
    title: '連続読書日数（ストリーク）',
    desc: '何日連続で読書セッションを行ったかを表示します',
    detail: '現在の連続読書日数と過去最長の連続日数をサマリーカードで表示します。毎日読書を続けるモチベーション維持に役立ててください。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        <rect x="55" y="30" width="78" height="90" rx="10" fill="#FFFFFF" stroke="#E2E1F0" strokeWidth="1.5" />
        <text x="94" y="75" textAnchor="middle" fontSize="28" fontWeight="700" fill="#534AB7" fontFamily="sans-serif">5</text>
        <text x="94" y="96" textAnchor="middle" fontSize="9" fill="#6B6B8A" fontFamily="sans-serif">連続日数</text>
        <rect x="147" y="30" width="78" height="90" rx="10" fill="#FFFFFF" stroke="#E2E1F0" strokeWidth="1.5" />
        <text x="186" y="75" textAnchor="middle" fontSize="28" fontWeight="700" fill="#534AB7" fontFamily="sans-serif">12</text>
        <text x="186" y="96" textAnchor="middle" fontSize="9" fill="#6B6B8A" fontFamily="sans-serif">ベスト連続</text>
      </svg>
    ),
  },
  {
    icon: <IconCalendar size={18} />,
    title: '月間読書カレンダー',
    desc: 'セッションのあった日をカレンダー上でハイライト表示します',
    detail: '月ごとのカレンダーでセッションを記録した日を色付きで表示します。セッション数に応じて色の濃さが変わるヒートマップ表示で、読書習慣のパターンを視覚的に把握できます。日付にマウスオーバーすると読んだ本・セッション数・集中時間が確認できます。◀▶ボタンで月を移動できます。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {['日','月','火','水','木','金','土'].map((d, i) => (
          <text key={d} x={30 + i * 34} y="30" textAnchor="middle" fontSize="10" fill="#6B6B8A" fontFamily="sans-serif">{d}</text>
        ))}
        {Array.from({ length: 28 }, (_, i) => {
          const col = i % 7
          const row = Math.floor(i / 7)
          // 0=none, 1=intensity-1, 2=intensity-2, 3=intensity-3
          const level = [2,6,13,20].includes(i) ? 3 : [3,7,12,21].includes(i) ? 2 : [9,14].includes(i) ? 1 : 0
          const fill = level === 3 ? '#534AB7' : level === 2 ? '#7C75D4' : level === 1 ? '#A8A3E3' : '#FFFFFF'
          const stroke = level === 0 ? '#E2E1F0' : 'none'
          return (
            <g key={i}>
              <rect x={13 + col * 34} y={40 + row * 28} width="22" height="22" rx="5"
                fill={fill} stroke={stroke} strokeWidth="1" />
              <text x={24 + col * 34} y={55 + row * 28} textAnchor="middle" fontSize="9"
                fill={level > 0 ? 'white' : '#6B6B8A'} fontFamily="sans-serif">{i + 1}</text>
            </g>
          )
        })}
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
        {[30, 60, 90, 120].map(y => (
          <line key={y} x1="40" y1={y} x2="260" y2={y} stroke="#E2E1F0" strokeWidth="1" strokeDasharray="4 3" />
        ))}
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
    icon: <IconChartBar size={18} />,
    title: '月別集中時間',
    desc: '月ごとの合計集中時間（分）を棒グラフで表示します',
    detail: 'アプリ開始から現在までの月別合計集中時間を棒グラフで表示します。長期的な読書習慣の推移を把握するのに役立ちます。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {[
          { x: 30, h: 60 }, { x: 65, h: 80 }, { x: 100, h: 50 },
          { x: 135, h: 100 }, { x: 170, h: 90 }, { x: 205, h: 70 },
        ].map((bar, i) => (
          <g key={i}>
            <rect x={bar.x} y={130 - bar.h} width="26" height={bar.h} rx="3"
              fill={i === 3 ? '#534AB7' : '#A8A3E3'} />
          </g>
        ))}
        <line x1="20" y1="130" x2="260" y2="130" stroke="#E2E1F0" strokeWidth="1" />
      </svg>
    ),
  },
  {
    icon: <IconTrendingUp size={18} />,
    title: 'アプリ開始からの累計セッション',
    desc: '開始から現在までの累計セッション数の推移を折れ線グラフで表示します',
    detail: 'アプリを使い始めてからの累計セッション数の推移を折れ線グラフで可視化します。記録期間に応じて粒度が自動切り替えされます（12週以下: 週次 / 13〜52週: 月次 / 53週超: 四半期）。チャートタイトル横のバッジで現在の粒度を確認できます。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {(() => {
          const pts = [
            { x: 40, y: 120 }, { x: 80, y: 105 }, { x: 120, y: 85 },
            { x: 160, y: 60 }, { x: 200, y: 45 }, { x: 240, y: 30 }
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
            </>
          )
        })()}
        <line x1="30" y1="130" x2="260" y2="130" stroke="#E2E1F0" strokeWidth="1" />
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
    icon: <IconRun size={18} />,
    title: '読書ペース',
    desc: '本ごとの読書速度（ページ/分）を棒グラフで表示します',
    detail: '各本の現在ページ数と総セッション時間から読書ペース（ページ/分）を計算して表示します。セッションが1回以上ありページが記録されている本が対象です。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {/* Y軸ラベル */}
        <text x="6" y="13" fontSize="8" fill="#9999AA" fontFamily="sans-serif">ページ/分</text>
        {/* グリッドライン & Y軸目盛り */}
        {[{ y: 20, val: '2.0' }, { y: 45, val: '1.5' }, { y: 70, val: '1.0' }, { y: 95, val: '0.5' }].map(tick => (
          <g key={tick.y}>
            <line x1="44" y1={tick.y} x2="264" y2={tick.y} stroke="#E2E1F0" strokeWidth="1" strokeDasharray="4 3" />
            <text x="40" y={tick.y + 3} textAnchor="end" dominantBaseline="central" fontSize="8" fill="#9999AA" fontFamily="sans-serif">{tick.val}</text>
          </g>
        ))}
        {/* X軸 */}
        <line x1="44" y1="120" x2="264" y2="120" stroke="#C8C4E8" strokeWidth="1.5" />
        {/* 縦棒 */}
        {[
          { x: 66, h: 90, val: '1.8', label: '吾輩は猫…' },
          { x: 132, h: 65, val: '1.3', label: '坊っちゃん' },
          { x: 198, h: 40, val: '0.8', label: 'Clean Code' },
        ].map((bar, i) => (
          <g key={i}>
            <rect x={bar.x} y={120 - bar.h} width="45" height={bar.h} rx="4"
              fill={i === 0 ? '#534AB7' : i === 1 ? '#7C75D4' : '#A8A3E3'} />
            <text x={bar.x + 22} y={120 - bar.h - 6} textAnchor="middle" dominantBaseline="central"
              fontSize="9" fontWeight="700" fill={i === 0 ? '#534AB7' : i === 1 ? '#7C75D4' : '#A8A3E3'}
              fontFamily="sans-serif">{bar.val}</text>
            <text x={bar.x + 22} y="136" textAnchor="middle" dominantBaseline="central"
              fontSize="9" fill="#6B6B8A" fontFamily="sans-serif">{bar.label}</text>
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
        <path d="M110 80 L110 30 A50 50 0 0 1 153 105 Z" fill="#534AB7" />
        <path d="M110 80 L153 105 A50 50 0 0 1 68 110 Z" fill="#7C75D4" />
        <path d="M110 80 L68 110 A50 50 0 0 1 72 45 Z" fill="#A8A3E3" />
        <path d="M110 80 L72 45 A50 50 0 0 1 110 30 Z" fill="#D4D1F5" />
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
  if (percent < 0.15) return null
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
  payload?: Array<{ name: string; value: number; color?: string; payload?: Record<string, unknown> }>
  label?: string
}
function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  const displayLabel = (payload[0]?.payload?.fullName as string | undefined) ?? label
  return (
    <div className="chart-tooltip">
      {displayLabel && <p className="chart-tooltip-label">{displayLabel}</p>}
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

function calcStreak(sessions: Session[]): { current: number; best: number } {
  if (sessions.length === 0) return { current: 0, best: 0 }
  const dates = new Set(sessions.map(s => s.date))

  // current streak (from today backwards)
  let current = 0
  const todayBase = new Date()
  todayBase.setHours(0, 0, 0, 0)
  for (let i = 0; ; i++) {
    const d = new Date(todayBase)
    d.setDate(todayBase.getDate() - i)
    if (dates.has(toLocalDate(d))) {
      current++
    } else {
      break
    }
  }

  // best streak
  const sorted = Array.from(dates).sort()
  let best = 0
  let run = 0
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      run = 1
    } else {
      const prev = new Date(sorted[i - 1])
      prev.setDate(prev.getDate() + 1)
      run = toLocalDate(prev) === sorted[i] ? run + 1 : 1
    }
    if (run > best) best = run
  }
  return { current, best }
}

function getMonthlyData(sessions: Session[]): { month: string; 集中時間: number }[] {
  if (sessions.length === 0) return []
  const months = sessions.map(s => s.date.slice(0, 7)).sort()
  const minMonth = months[0]
  const maxMonth = toLocalDate(new Date()).slice(0, 7)
  const result: { month: string; 集中時間: number }[] = []
  let [y, m] = minMonth.split('-').map(Number)
  const [ey, em] = maxMonth.split('-').map(Number)
  while (y < ey || (y === ey && m <= em)) {
    const key = `${y}-${String(m).padStart(2, '0')}`
    const total = sessions.filter(s => s.date.startsWith(key)).reduce((sum, s) => sum + s.duration, 0)
    result.push({ month: `${y}/${m}`, 集中時間: total })
    m++
    if (m > 12) { m = 1; y++ }
  }
  return result
}

type CumulativeGranularity = 'weekly' | 'monthly' | 'quarterly'

function getCumulativeGranularity(firstDateStr: string): CumulativeGranularity {
  const totalWeeks = Math.ceil(
    (Date.now() - new Date(firstDateStr).getTime()) / (7 * 24 * 60 * 60 * 1000)
  )
  if (totalWeeks <= 12) return 'weekly'
  if (totalWeeks <= 52) return 'monthly'
  return 'quarterly'
}

function getCumulativeData(sessions: Session[]): { label: string; 累計セッション: number; granularity: CumulativeGranularity } [] {
  if (sessions.length === 0) return []
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))
  const firstDateStr = sorted[0].date
  const granularity = getCumulativeGranularity(firstDateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const result: { label: string; 累計セッション: number; granularity: CumulativeGranularity }[] = []
  let cumulative = 0

  if (granularity === 'weekly') {
    // Monday of first week
    const getWeekStart = (dateStr: string): Date => {
      const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1))
      return d
    }
    const cur = getWeekStart(firstDateStr)
    const curWeekStart = getWeekStart(toLocalDate(now))
    while (cur <= curWeekStart) {
      const ws = toLocalDate(cur)
      const next = new Date(cur); next.setDate(next.getDate() + 7)
      cumulative += sessions.filter(s => s.date >= ws && s.date < toLocalDate(next)).length
      result.push({ label: `${cur.getMonth() + 1}/${cur.getDate()}`, 累計セッション: cumulative, granularity })
      cur.setDate(cur.getDate() + 7)
    }
  } else if (granularity === 'monthly') {
    let [y, m] = firstDateStr.slice(0, 7).split('-').map(Number)
    const ey = now.getFullYear(), em = now.getMonth() + 1
    while (y < ey || (y === ey && m <= em)) {
      const key = `${y}-${String(m).padStart(2, '0')}`
      cumulative += sessions.filter(s => s.date.startsWith(key)).length
      result.push({ label: `${y}/${m}`, 累計セッション: cumulative, granularity })
      m++; if (m > 12) { m = 1; y++ }
    }
  } else {
    // quarterly: Jan, Apr, Jul, Oct
    let [y, m] = firstDateStr.slice(0, 7).split('-').map(Number)
    m = Math.floor((m - 1) / 3) * 3 + 1 // round down to quarter start
    const ey = now.getFullYear(), em = now.getMonth() + 1
    while (y < ey || (y === ey && m <= em)) {
      const qEnd = new Date(y, m + 2, 1) // exclusive end of quarter
      const qEndStr = toLocalDate(qEnd)
      const qStartStr = `${y}-${String(m).padStart(2, '0')}-01`
      cumulative += sessions.filter(s => s.date >= qStartStr && s.date < qEndStr).length
      result.push({ label: `${y}Q${Math.ceil(m / 3)}`, 累計セッション: cumulative, granularity })
      m += 3; if (m > 12) { m = m - 12; y++ }
    }
  }
  return result
}

function MonthCalendar({ sessions }: { sessions: Session[] }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-indexed
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  // Map date -> Session[]
  const sessionsByDate = new Map<string, Session[]>()
  sessions.forEach(s => {
    const arr = sessionsByDate.get(s.date) ?? []
    arr.push(s)
    sessionsByDate.set(s.date, arr)
  })

  const today = toLocalDate(new Date())

  const firstDow = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }
  const canGoNext = new Date(year, month + 1, 1) <= now

  // Monthly stats
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthSessions = sessions.filter(s => s.date.startsWith(monthKey))
  const monthMinutes = monthSessions.reduce((sum, s) => sum + s.duration, 0)
  const monthDays = new Set(monthSessions.map(s => s.date)).size

  const intensityClass = (count: number) => {
    if (count === 0) return ''
    if (count === 1) return 'intensity-1'
    if (count === 2) return 'intensity-2'
    return 'intensity-3'
  }

  return (
    <div className="cal-wrap">
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
        <span className="cal-nav-label">{year}年{month + 1}月</span>
        <button className="cal-nav-btn" onClick={nextMonth} disabled={!canGoNext}>›</button>
      </div>
      <div className="cal-grid">
        {['日', '月', '火', '水', '木', '金', '土'].map(d => (
          <div key={d} className="cal-dow">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} className="cal-empty" />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const daySessions = sessionsByDate.get(dateStr) ?? []
          const count = daySessions.length
          const isToday = dateStr === today
          const ic = intensityClass(count)
          const isHovered = hoveredDate === dateStr
          // deduplicated book titles for tooltip
          const books = [...new Set(daySessions.map(s => s.bookTitle))]
          const dayMinutes = daySessions.reduce((sum, s) => sum + s.duration, 0)
          return (
            <div
              key={day}
              className={`cal-day${ic ? ` has-session ${ic}` : ''}${isToday ? ' is-today' : ''}${count > 0 ? ' cal-day-hover' : ''}`}
              onMouseEnter={() => { if (count > 0) setHoveredDate(dateStr) }}
              onMouseLeave={() => setHoveredDate(null)}
            >
              {day}
              {isHovered && count > 0 && (
                <div className="cal-tooltip">
                  <div className="cal-tooltip-count">{count}セッション / {dayMinutes}分</div>
                  {books.map(title => (
                    <div key={title} className="cal-tooltip-book">{title}</div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Monthly stats */}
      <div className="cal-stats">
        <span className="cal-stat"><strong>{monthDays}</strong>日 読書</span>
        <span className="cal-stat"><strong>{monthSessions.length}</strong>セッション</span>
        <span className="cal-stat"><strong>{monthMinutes}</strong>分 集中</span>
      </div>

      {/* Intensity legend */}
      <div className="cal-legend">
        <span className="cal-legend-label">セッション数:</span>
        <span className="cal-legend-item intensity-1">1</span>
        <span className="cal-legend-item intensity-2">2</span>
        <span className="cal-legend-item intensity-3">3+</span>
      </div>
    </div>
  )
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

  // Weekly
  const last7 = getLast7Days()
  const weeklyData = last7.map(date => ({
    date: date.slice(5).split('-').map(Number).join('/'),
    セッション: sessions.filter(s => s.date === date).length,
  }))

  // Per-book sessions
  const titleLimit = isMobile ? 6 : 7
  const bookSessionData = books
    .filter(b => b.sessions > 0)
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 8)
    .map(b => ({ name: b.title.length > titleLimit ? b.title.slice(0, titleLimit) + '…' : b.title, fullName: b.title, セッション: b.sessions }))

  // Genre distribution
  const genreMap: Record<string, number> = {}
  books.filter(b => b.status === 'done').forEach(b => {
    genreMap[b.genre] = (genreMap[b.genre] ?? 0) + 1
  })
  const genreData = Object.entries(genreMap).map(([name, value]) => ({ name, value }))

  // Summary
  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0)
  const doneBooks = books.filter(b => b.status === 'done').length
  const readingBooks = books.filter(b => b.status === 'reading').length
  const { current: streakCurrent, best: streakBest } = calcStreak(sessions)

  // Averages
  const activeDays = new Set(sessions.map(s => s.date)).size
  const avgSessionsPerDay = activeDays > 0 ? Math.round((totalSessions / activeDays) * 10) / 10 : 0
  const avgMinutesPerDay = activeDays > 0 ? Math.round((totalMinutes / activeDays) * 10) / 10 : 0
  const firstDate = sessions.length > 0 ? sessions.map(s => s.date).sort()[0] : null
  const weeksSinceFirst = firstDate
    ? Math.max(1, Math.ceil((Date.now() - new Date(firstDate).getTime()) / (7 * 24 * 60 * 60 * 1000)))
    : 1
  const avgSessionsPerWeek = sessions.length > 0 ? Math.round((totalSessions / weeksSinceFirst) * 10) / 10 : 0
  const booksWithSessions = books.filter(b => b.sessions > 0).length
  const avgSessionsPerBook = booksWithSessions > 0 ? Math.round((totalSessions / booksWithSessions) * 10) / 10 : 0

  // Monthly focus time
  const monthlyData = getMonthlyData(sessions)

  // Cumulative sessions
  const cumulativeData = getCumulativeData(sessions)

  // Reading pace (pages/min per book)
  const bookPaceData = books
    .filter(b => b.currentPage > 0)
    .map(b => {
      const bookSessions = sessions.filter(s => s.bookId === b.id)
      const totalMins = bookSessions.reduce((sum, s) => sum + s.duration, 0)
      const pace = totalMins > 0 ? Math.round((b.currentPage / totalMins) * 10) / 10 : 0
      return {
        name: b.title.length > titleLimit ? b.title.slice(0, titleLimit) + '…' : b.title,
        fullName: b.title,
        'ページ/分': pace,
      }
    })
    .filter(b => b['ページ/分'] > 0)
    .sort((a, b) => b['ページ/分'] - a['ページ/分'])
    .slice(0, 8)

  return (
    <div className="stats-tab">
      {showHelp && createPortal(
        <HelpModal title="統計の見方" items={STATS_HELP} onClose={() => setShowHelp(false)} />,
        document.body
      )}
      <div className="tab-help-row">
        <button className="help-btn" onClick={() => setShowHelp(true)}>
          <IconQuestionMark size={15} />
          使い方
        </button>
      </div>

      {/* Summary cards */}
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
        <div className="summary-card">
          <span className="summary-value summary-streak">
            {streakCurrent}<IconFlame size={20} />
          </span>
          <span className="summary-label">連続日数</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{streakBest}</span>
          <span className="summary-label">ベスト連続</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{avgSessionsPerDay}</span>
          <span className="summary-label">1日平均セッション</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{avgMinutesPerDay}</span>
          <span className="summary-label">1日平均集中（分）</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{avgSessionsPerWeek}</span>
          <span className="summary-label">週平均セッション</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{avgSessionsPerBook}</span>
          <span className="summary-label">1冊平均セッション</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="chart-card chart-card-wide">
        <h3>月間読書カレンダー</h3>
        <MonthCalendar sessions={sessions} />
      </div>

      {/* Weekly sessions */}
      <div className="chart-card">
        <h3>週間セッション数</h3>
        <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
          <LineChart data={weeklyData} margin={{ top: 5, right: 16, left: 4, bottom: isMobile ? 24 : 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={isMobile ? { fontSize: 11, fill: 'var(--color-text-muted)', angle: -45, textAnchor: 'end', dy: 4 } : { fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} height={isMobile ? 44 : 30} padding={{ left: 20, right: 20 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={34} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="セッション" stroke="#534AB7" strokeWidth={2} dot={{ r: 4, fill: '#534AB7' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly focus time */}
      <div className="chart-card">
        <h3>月別集中時間（分）</h3>
        {monthlyData.length === 0 ? (
          <p className="chart-empty">セッションを記録すると表示されます</p>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 16, left: 4, bottom: isMobile ? 24 : 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={isMobile ? { fontSize: 10, fill: 'var(--color-text-muted)', angle: -45, textAnchor: 'end', dy: 4 } : { fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} height={isMobile ? 44 : 30} padding={{ left: 8, right: 8 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="集中時間" fill="#534AB7" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Cumulative sessions */}
      <div className="chart-card chart-card-wide">
        <h3>アプリ開始からの累計セッション
          {cumulativeData.length > 1 && (
            <span className="chart-granularity-badge">
              {cumulativeData[0].granularity === 'weekly' ? '週次' : cumulativeData[0].granularity === 'monthly' ? '月次' : '四半期'}
            </span>
          )}
        </h3>
        {cumulativeData.length <= 1 ? (
          <p className="chart-empty">セッションを記録すると表示されます</p>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
            <LineChart data={cumulativeData} margin={{ top: 5, right: 16, left: 4, bottom: isMobile ? 24 : 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                interval={cumulativeData.length > 16 ? Math.ceil(cumulativeData.length / 8) - 1 : cumulativeData.length > 8 ? 1 : 0}
                tick={isMobile ? { fontSize: 10, fill: 'var(--color-text-muted)', angle: -45, textAnchor: 'end', dy: 4 } : { fontSize: 12, fill: 'var(--color-text-muted)' }}
                axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} height={isMobile ? 44 : 30}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="累計セッション" stroke="#7C75D4" strokeWidth={2} dot={cumulativeData.length > 20 ? false : { r: 3, fill: '#7C75D4' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Per-book sessions */}
      <div className="chart-card chart-card-wide">
        <h3>本別セッション数</h3>
        {bookSessionData.length === 0 ? (
          <p className="chart-empty">セッションを記録すると表示されます</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bookSessionData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
              <YAxis dataKey="name" type="category" width={isMobile ? 76 : 110} tick={{ fontSize: isMobile ? 11 : 12, fill: 'var(--color-text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="セッション" fill="#534AB7" radius={[0, 4, 4, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Reading pace */}
      <div className="chart-card">
        <h3>読書ペース（ページ/分）</h3>
        {bookPaceData.length === 0 ? (
          <p className="chart-empty">ページ数を記録するとペースが表示されます</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bookPaceData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
              <YAxis dataKey="name" type="category" width={isMobile ? 76 : 110} tick={{ fontSize: isMobile ? 11 : 12, fill: 'var(--color-text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ページ/分" fill="#7C75D4" radius={[0, 4, 4, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Genre distribution */}
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
