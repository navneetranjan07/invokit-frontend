import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { getDashboardStats, getRevenueChart } from '../services/dashboardService'
import {
  formatCurrency, formatDate,
  getStatusBadgeClass, getStatusLabel,
} from '../utils/formatters'
import LoadingSpinner from '../components/common/LoadingSpinner'
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ title, value, sub, icon: Icon, color, trend }) {
  const styles = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100'   },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-100'  },
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    border: 'border-red-100'    },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
  }
  const s = styles[color] || styles.blue

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
          {sub && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              {trend === 'up'   && <ArrowTrendingUpIcon   className="h-3 w-3 text-green-500" />}
              {trend === 'down' && <ArrowTrendingDownIcon className="h-3 w-3 text-red-500"   />}
              {sub}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${s.bg} ${s.border} border ml-3 shrink-0`}>
          <Icon className={`h-6 w-6 ${s.icon}`} />
        </div>
      </div>
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-blue-600">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function Dashboard() {
  const [stats,   setStats]   = useState(null)
  const [chart,   setChart]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardStats(), getRevenueChart(6)])
      .then(([s, c]) => { setStats(s); setChart(c) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  const chartData = chart?.monthlyData?.map(d => ({
    month:   d.month,
    revenue: parseFloat(d.revenue || 0),
  })) || []

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Your business overview at a glance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue)}
          sub={`${formatCurrency(stats?.revenueThisMonth)} this month`}
          icon={CurrencyDollarIcon}
          color="green"
          trend="up"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats?.totalOutstanding)}
          sub={`${stats?.sentInvoices || 0} unpaid invoices`}
          icon={DocumentTextIcon}
          color="blue"
        />
        <StatCard
          title="Overdue"
          value={formatCurrency(stats?.overdueAmount)}
          sub={`${stats?.overdueInvoices || 0} overdue`}
          icon={ExclamationCircleIcon}
          color="red"
          trend="down"
        />
        <StatCard
          title="Active Clients"
          value={stats?.activeClients || 0}
          sub={`${stats?.totalClients || 0} total clients`}
          icon={UsersIcon}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Revenue Chart */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-gray-900">Revenue Overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 6 months</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">
                {formatCurrency(chart?.totalRevenue)}
              </p>
              <p className="text-xs text-gray-400">Total</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563EB"
                strokeWidth={2.5}
                fill="url(#revGradient)"
                dot={{ r: 3, fill: '#2563EB', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#2563EB', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Invoice Summary */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Invoice Status</h2>
          <div className="space-y-3">
            {[
              { label: 'Draft',     count: stats?.draftInvoices,     dot: 'bg-gray-400',   pct: stats?.totalInvoices },
              { label: 'Sent',      count: stats?.sentInvoices,      dot: 'bg-blue-500',   pct: stats?.totalInvoices },
              { label: 'Paid',      count: stats?.paidInvoices,      dot: 'bg-green-500',  pct: stats?.totalInvoices },
              { label: 'Overdue',   count: stats?.overdueInvoices,   dot: 'bg-red-500',    pct: stats?.totalInvoices },
              { label: 'Cancelled', count: stats?.cancelledInvoices, dot: 'bg-orange-400', pct: stats?.totalInvoices },
            ].map(({ label, count, dot, pct }) => {
              const percent = pct > 0 ? Math.round(((count || 0) / pct) * 100) : 0
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${dot}`} />
                      <span className="text-sm text-gray-600">{label}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {count || 0}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${dot} rounded-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">Total Invoices</span>
            <span className="font-bold text-gray-900">{stats?.totalInvoices || 0}</span>
          </div>
        </div>
      </div>

      {/* Recent Invoices + Recent Payments */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Recent Invoices */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Invoices</h2>
            <Link to="/invoices"
              className="text-sm text-blue-600 hover:underline font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.recentInvoices?.length > 0 ? (
              stats.recentInvoices.map(inv => (
                <div key={inv.id}
                  className="flex items-center justify-between py-2.5 px-3
                             rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {inv.invoiceNumber}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {inv.clientName} · Due {formatDate(inv.dueDate)}
                    </p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(inv.totalAmount, inv.currency)}
                    </p>
                    <span className={getStatusBadgeClass(inv.status)}>
                      {getStatusLabel(inv.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">
                No invoices yet
              </p>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Payments</h2>
            <Link to="/payments"
              className="text-sm text-blue-600 hover:underline font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.recentPayments?.length > 0 ? (
              stats.recentPayments.map(p => (
                <div key={p.id}
                  className="flex items-center justify-between py-2.5 px-3
                             rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {p.invoiceNumber}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.paymentMethod || 'Payment'} · {formatDate(p.paymentDate)}
                    </p>
                  </div>
                  <div className="ml-3 shrink-0">
                    <span className="text-sm font-bold text-green-600">
                      +{formatCurrency(p.amount)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">
                No payments yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}