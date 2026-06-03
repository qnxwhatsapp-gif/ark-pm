export default function StatsCard({ label, value, sub, color = 'indigo', alert = false }) {
  const colorMap = {
    indigo:  { bg: 'bg-indigo-600/10',  border: 'border-indigo-500/30',  text: 'text-indigo-400' },
    emerald: { bg: 'bg-emerald-600/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    red:     { bg: 'bg-red-600/10',     border: 'border-red-500/30',     text: 'text-red-400' },
    yellow:  { bg: 'bg-yellow-600/10',  border: 'border-yellow-500/30',  text: 'text-yellow-400' },
  }
  const c = colorMap[alert && value > 0 ? 'red' : color] ?? colorMap.indigo

  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-5`}>
      <div className={`text-3xl font-bold ${c.text}`}>{value}</div>
      <div className="text-white font-medium text-sm mt-1">{label}</div>
      {sub && <div className="text-slate-500 text-xs mt-0.5">{sub}</div>}
    </div>
  )
}