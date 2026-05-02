import { useState, useEffect, useCallback, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Transition } from '@headlessui/react'
import toast from 'react-hot-toast'
import {
  getInvoices, deleteInvoice, sendInvoice,
  markInvoicePaid, cancelInvoice, duplicateInvoice, downloadInvoicePdf,
} from '../services/invoiceService'
import PageHeader    from '../components/common/PageHeader'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState    from '../components/common/EmptyState'
import ConfirmModal  from '../components/common/ConfirmModal'
import Pagination    from '../components/common/Pagination'
import {
  formatCurrency, formatDate,
  getStatusBadgeClass, getStatusLabel,
} from '../utils/formatters'
import {
  PlusIcon, DocumentTextIcon, MagnifyingGlassIcon,
  EyeIcon, PencilIcon, TrashIcon, PaperAirplaneIcon,
  CheckCircleIcon, DocumentDuplicateIcon,
  ArrowDownTrayIcon, XCircleIcon, EllipsisVerticalIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const STATUS_FILTERS = [
  { value: '',          label: 'All'        },
  { value: 'DRAFT',     label: 'Draft'      },
  { value: 'SENT',      label: 'Sent'       },
  { value: 'PAID',      label: 'Paid'       },
  { value: 'OVERDUE',   label: 'Overdue'    },
  { value: 'CANCELLED', label: 'Cancelled'  },
]

// ─── Action Dropdown Menu ─────────────────────────────────────
function InvoiceMenu({ invoice, onRefresh, onDelete }) {
  const navigate = useNavigate()

  const handle = async (action) => {
    try {
      switch (action) {
        case 'send':
          await sendInvoice(invoice.id)
          toast.success('Invoice sent successfully!')
          onRefresh()
          break
        case 'paid':
          await markInvoicePaid(invoice.id)
          toast.success('Marked as paid!')
          onRefresh()
          break
        case 'duplicate':
          await duplicateInvoice(invoice.id)
          toast.success('Invoice duplicated!')
          onRefresh()
          break
        case 'cancel':
          await cancelInvoice(invoice.id)
          toast.success('Invoice cancelled')
          onRefresh()
          break
        case 'pdf': {
          const blob = await downloadInvoicePdf(invoice.id)
          const url  = URL.createObjectURL(blob)
          const a    = document.createElement('a')
          a.href     = url
          a.download = `Invoice-${invoice.invoiceNumber}.pdf`
          a.click()
          URL.revokeObjectURL(url)
          break
        }
        default: break
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed')
    }
  }

  const MenuItem = ({ onClick, icon: Icon, label, className = 'text-gray-700' }) => (
    <Menu.Item>
      {({ active }) => (
        <button
          onClick={onClick}
          className={`${active ? 'bg-gray-50' : ''} ${className}
                      flex items-center gap-2.5 w-full px-4 py-2 text-sm`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      )}
    </Menu.Item>
  )

  return (
    <Menu as="div" className="relative inline-block">
      <Menu.Button className="p-1.5 text-gray-400 hover:text-gray-600
                               hover:bg-gray-100 rounded-lg transition-colors">
        <EllipsisVerticalIcon className="h-5 w-5" />
      </Menu.Button>

      <Transition as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-20 mt-1 w-52 bg-white rounded-xl
                               shadow-lg border border-gray-100 py-1 focus:outline-none">
          <MenuItem
            onClick={() => navigate(`/invoices/${invoice.id}`)}
            icon={EyeIcon}
            label="View Details"
          />
          {invoice.status === 'DRAFT' && (
            <MenuItem
              onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
              icon={PencilIcon}
              label="Edit Invoice"
            />
          )}
          {invoice.status === 'DRAFT' && (
            <MenuItem
              onClick={() => handle('send')}
              icon={PaperAirplaneIcon}
              label="Send to Client"
              className="text-blue-600"
            />
          )}
          {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
            <MenuItem
              onClick={() => handle('paid')}
              icon={CheckCircleIcon}
              label="Mark as Paid"
              className="text-green-600"
            />
          )}
          <MenuItem
            onClick={() => handle('pdf')}
            icon={ArrowDownTrayIcon}
            label="Download PDF"
          />
          <MenuItem
            onClick={() => handle('duplicate')}
            icon={DocumentDuplicateIcon}
            label="Duplicate Invoice"
          />
          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <MenuItem
                onClick={() => handle('cancel')}
                icon={XCircleIcon}
                label="Cancel Invoice"
                className="text-orange-600"
              />
            </>
          )}
          {invoice.status === 'DRAFT' && (
            <MenuItem
              onClick={() => onDelete(invoice)}
              icon={TrashIcon}
              label="Delete Invoice"
              className="text-red-600"
            />
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function Invoices() {
  const navigate = useNavigate()

  const [invoices,      setInvoices]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [statusFilter,  setStatusFilter]  = useState('')
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [deleteModal,   setDeleteModal]   = useState({ open: false, invoice: null })
  const [actionLoading, setActionLoading] = useState(false)

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, size: 10, sort: 'createdAt', direction: 'desc' }
      if (search)       params.search = search
      if (statusFilter) params.status = statusFilter
      const data = await getInvoices(params)
      setInvoices(data.content          || [])
      setTotalPages(data.totalPages     || 0)
      setTotalElements(data.totalElements || 0)
    } catch {
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await deleteInvoice(deleteModal.invoice.id)
      toast.success('Invoice deleted!')
      setDeleteModal({ open: false, invoice: null })
      fetchInvoices()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={`${totalElements} invoice${totalElements !== 1 ? 's' : ''} total`}
        actions={
          <button className="btn-primary" onClick={() => navigate('/invoices/new')}>
            <PlusIcon className="h-4 w-4" />
            New Invoice
          </button>
        }
      />

      {/* Filters */}
      <div className="card mb-4 py-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by invoice # or client name..."
              className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setPage(0) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === f.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner text="Loading invoices..." />
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<DocumentTextIcon className="h-16 w-16" />}
            title={search || statusFilter ? 'No invoices found' : 'No invoices yet'}
            description={
              search || statusFilter
                ? 'Try adjusting your filters'
                : 'Create your first invoice to get started'
            }
            action={
              !search && !statusFilter && (
                <button className="btn-primary"
                  onClick={() => navigate('/invoices/new')}>
                  <PlusIcon className="h-4 w-4" />
                  Create Invoice
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="table-header">Invoice</th>
                    <th className="table-header">Client</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Issue Date</th>
                    <th className="table-header">Due Date</th>
                    <th className="table-header text-right">Amount</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map(inv => (
                    <tr key={inv.id}
                      className="hover:bg-gray-50/70 transition-colors">

                      {/* Invoice # */}
                      <td className="table-cell">
                        <p className="font-semibold text-gray-900">{inv.invoiceNumber}</p>
                        {inv.title && (
                          <p className="text-xs text-gray-400 truncate max-w-[150px]">
                            {inv.title}
                          </p>
                        )}
                      </td>

                      {/* Client */}
                      <td className="table-cell">
                        <p className="text-gray-800 font-medium">{inv.clientName}</p>
                        {inv.clientCompanyName && (
                          <p className="text-xs text-gray-400">{inv.clientCompanyName}</p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="table-cell">
                        <span className={getStatusBadgeClass(inv.status)}>
                          {getStatusLabel(inv.status)}
                        </span>
                        {inv.isOverdue && inv.daysOverdue > 0 && (
                          <p className="text-xs text-red-500 mt-0.5">
                            {inv.daysOverdue}d overdue
                          </p>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="table-cell text-gray-400 text-xs">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className={`table-cell text-xs font-medium ${
                        inv.isOverdue ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        {formatDate(inv.dueDate)}
                      </td>

                      {/* Amount */}
                      <td className="table-cell text-right">
                        <p className="font-bold text-gray-900">
                          {formatCurrency(inv.totalAmount, inv.currency)}
                        </p>
                        {inv.isPartiallyPaid && (
                          <p className="text-xs text-orange-500">
                            {formatCurrency(inv.balanceDue)} due
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="table-cell text-right">
                        <InvoiceMenu
                          invoice={inv}
                          onRefresh={fetchInvoices}
                          onDelete={(inv) => setDeleteModal({ open: true, invoice: inv })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 pb-2">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalElements={totalElements}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, invoice: null })}
        onConfirm={handleDelete}
        loading={actionLoading}
        title="Delete Invoice"
        message={`Delete invoice "${deleteModal.invoice?.invoiceNumber}"? This action cannot be undone.`}
        confirmText="Delete Invoice"
      />
    </div>
  )
}