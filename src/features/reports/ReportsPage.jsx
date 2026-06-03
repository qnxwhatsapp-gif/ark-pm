import { useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useReports, useAllProjects } from './useReports'

const STATUS_COLORS = {
  planning:  'border-slate-500 text-slate-400',
  active:    'border-emerald-500 text-emerald-400',
  on_hold:   'border-yellow-500 text-yellow-400',
  completed: 'border-blue-500 text-blue-400',
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
]

export default function ReportsPage() {
  const reportRef = useRef(null)
  const [filters, setFilters] = useState({ projectId: '', status: '' })
  const { data, loading } = useReports(filters)
  const allProjects = useAllProjects()
  const [exporting, setExporting] = useState(false)

  function updateFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value === 'all' ? '' : value }))
  }

  async function handleExportPDF() {
    setExporting(true)
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])
      const element = reportRef.current
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#0f172a' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
      pdf.save(`ark-design-report-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    }
    setExporting(false)
  }

  const totalTasks = data.reduce((s, p) => s + p.totalTasks, 0)
  const totalDone = data.reduce((s, p) => s + p.doneTasks, 0)
  const totalOverdue = data.reduce((s, p) => s + p.overdueTasks, 0)

  const chartData = data.slice(0, 8).map(p => ({
    name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name,
    progress: p.progress,
  }))

  if (loading) return <div className="p-8 text-slate-400">Loading reports…</div>

  return (
    <div className="p-8 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-slate-400 text-sm mt-1">{data.length} project{data.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={handleExportPDF} disabled={exporting} className="bg-indigo-600 hover:bg-indigo-700">
          {exporting ? 'Exporting…' : '⬇ Export PDF'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select value={filters.status || 'all'} onValueChange={v => updateFilter('status', v)}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s.value || 'all'} value={s.value || 'all'} className="text-white">{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.projectId || 'all'} onValueChange={v => updateFilter('projectId', v)}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-52">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">All projects</SelectItem>
            {allProjects.map(p => (
              <SelectItem key={p.id} value={p.id} className="text-white">{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Report content (captured for PDF) */}
      <div ref={reportRef}>
        {/* Summary stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-indigo-400">{data.length}</div>
            <div className="text-white text-sm mt-1">Projects</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-emerald-400">{totalDone}</div>
            <div className="text-white text-sm mt-1">Tasks Completed</div>
            <div className="text-slate-500 text-xs">{totalTasks} total</div>
          </div>
          <div className={`border rounded-xl p-4 text-center ${totalOverdue > 0 ? 'bg-red-900/20 border-red-800' : 'bg-slate-900 border-slate-800'}`}>
            <div className={`text-3xl font-bold ${totalOverdue > 0 ? 'text-red-400' : 'text-white'}`}>{totalOverdue}</div>
            <div className="text-white text-sm mt-1">Overdue Tasks</div>
          </div>
        </div>

        {/* Progress chart */}
        {chartData.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
            <h2 className="text-white font-semibold mb-4">Project Progress (%)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(val) => [`${val}%`, 'Progress']}
                />
                <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.progress >= 75 ? '#10b981' : entry.progress >= 40 ? '#6366f1' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Project</th>
                <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Client</th>
                <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Status</th>
                <th className="text-center px-4 py-3 text-slate-400 text-sm font-medium">Progress</th>
                <th className="text-center px-4 py-3 text-slate-400 text-sm font-medium">Tasks</th>
                <th className="text-center px-4 py-3 text-slate-400 text-sm font-medium">Phases</th>
                <th className="text-center px-4 py-3 text-slate-400 text-sm font-medium">Overdue</th>
                <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 text-sm">No projects match the selected filters.</td>
                </tr>
              ) : data.map(project => (
                <tr key={project.id} className="border-b border-slate-800 last:border-0">
                  <td className="px-4 py-3 text-white font-medium text-sm">{project.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{project.clients?.organization ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[project.status]}`}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${project.progress}%` }} />
                      </div>
                      <span className="text-slate-300 text-xs w-8">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-300 text-sm">{project.doneTasks}/{project.totalTasks}</td>
                  <td className="px-4 py-3 text-center text-slate-300 text-sm">{project.completedPhases}/{project.phaseCount}</td>
                  <td className="px-4 py-3 text-center">
                    {project.overdueTasks > 0
                      ? <span className="text-red-400 text-sm font-medium">{project.overdueTasks}</span>
                      : <span className="text-slate-600 text-sm">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {project.deadline
                      ? new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
