// ─── Currency ────────────────────────────────────────────────
export function formatCurrency(amount, currency = 'USD') {
  if (amount == null || isNaN(amount)) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style:    'currency',
    currency: currency,
  }).format(amount)
}

// ─── Date ────────────────────────────────────────────────────
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', {
    year:   'numeric',
    month:  'short',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

export function toInputDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0]
}

// ─── Invoice Status ──────────────────────────────────────────
export function getStatusBadgeClass(status) {
  const map = {
    DRAFT:     'badge-draft',
    SENT:      'badge-sent',
    PAID:      'badge-paid',
    OVERDUE:   'badge-overdue',
    CANCELLED: 'badge-cancelled',
  }
  return map[status] || 'badge-draft'
}

export function getStatusLabel(status) {
  const map = {
    DRAFT:     'Draft',
    SENT:      'Sent',
    PAID:      'Paid',
    OVERDUE:   'Overdue',
    CANCELLED: 'Cancelled',
  }
  return map[status] || status
}

// ─── Numbers ─────────────────────────────────────────────────
export function formatNumber(num) {
  if (num == null) return '0'
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatPercent(num) {
  if (num == null) return '0%'
  return `${parseFloat(num).toFixed(1)}%`
}

// ─── Initials ────────────────────────────────────────────────
export function getInitials(name) {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}