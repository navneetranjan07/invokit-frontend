import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getDashboardStats, getRevenueChart } from '../services/dashboardService'
import { formatCurrency, formatDate, getStatusBadgeClass, getStatusLabel } from '../utils/formatters'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { CurrencyDollarIcon, DocumentTextIcon, ExclamationCircleIcon, UsersIcon } from '@heroicons/react/24/outline'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [chart, setChart] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardStats(), getRevenueChart(6)])
      .then(([s, c]) => { setStats(s); setChart(c) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Loading InvoKit..." /></div>

  const chartData = chart?.monthlyData?.map(d => ({
    month: d.month,
    revenue: parseFloat(d.revenue || 0),
  })) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">Business overview at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(stats?.totalRevenue)} icon={CurrencyDollarIcon} color="green" sub="This Month" />
        <StatCard title="Outstanding" value={formatCurrency(stats?.totalOutstanding)} icon={DocumentTextIcon} color="blue" sub="Unpaid Invoices" />
        <StatCard title="Overdue" value={formatCurrency(stats?.overdueAmount)} icon={ExclamationCircleIcon} color="red" sub="Overdue total" />
        <StatCard title="Active Clients" value={stats?.activeClients || 0} icon={UsersIcon} color="purple" sub="Total database" />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card xl:col-span-2 overflow-hidden">
          <h2 className="font-semibold mb-4">Revenue Overview</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} tickFormatter={(v) => `$${v}`} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Invoice Status</h2>
          <div className="space-y-4">
            <StatusProgress label="Paid" count={stats?.paidInvoices} total={stats?.totalInvoices} color="bg-green-500" />
            <StatusProgress label="Sent" count={stats?.sentInvoices} total={stats?.totalInvoices} color="bg-blue-500" />
            <StatusProgress label="Overdue" count={stats?.overdueInvoices} total={stats?.totalInvoices} color="bg-red-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, sub }) {
  const colors = {
    green: 'bg-green-50 text-green-600 border-green-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  }
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl border ${colors[color]}`}><Icon className="h-6 w-6" /></div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{title}</p>
        <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

function StatusProgress({ label, count, total, color }) {
  const percent = total > 0 ? (count / total) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{count || 0}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}