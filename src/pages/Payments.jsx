import { useState, useEffect, useCallback, Fragment } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, Transition } from '@headlessui/react'
import toast from 'react-hot-toast'
import { getPayments, recordPayment, deletePayment } from '../services/paymentService'
import { getInvoices } from '../services/invoiceService'
import PageHeader     from '../components/common/PageHeader'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState     from '../components/common/EmptyState'
import ConfirmModal   from '../components/common/ConfirmModal'
import Pagination     from '../components/common/Pagination'
import { formatCurrency, formatDate } from '../utils/formatters'
import {
  PlusIcon, CreditCardIcon, TrashIcon, XMarkIcon,
} from '@heroicons/react/24/outline'

const PAYMENT_METHODS = [
  'Bank Transfer', 'Credit Card', 'Debit Card',
  'PayPal', 'Cash', 'Check', 'Crypto', 'Other',
]

// ─── Record Payment Modal ─────────────────────────────────────
function RecordPaymentModal({ isOpen, onClose, onSave, invoices }) {
  const {
    register, handleSubmit, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm()

  const selectedInvoiceId = watch('invoiceId')
  const selectedInvoice = invoices.find(i => String(i.id) === String(selectedInvoiceId))

  useEffect(() => {
    if (isOpen) reset({
      invoiceId: '',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      referenceNumber: '',
      notes: '',
    })
  }, [isOpen, reset])

  const onSubmit = async (data) => {
    await onSave({
      invoiceId:       parseInt(data.invoiceId),
      amount:          parseFloat(data.amount),
      paymentDate:     data.paymentDate,
      paymentMethod:   data.paymentMethod  || null,
      referenceNumber: data.referenceNumber || null,
      notes:           data.notes          || null,
    })
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">

                <div className="flex items-center justify-between mb-5">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Record Payment
                  </Dialog.Title>
                  <button onClick={onClose}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                  {/* Invoice */}
                  <div>
                    <label className="form-label">Invoice *</label>
                    <select className="input-field"
                      {...register('invoiceId', { required: 'Please select an invoice' })}>
                      <option value="">— Select an invoice —</option>
                      {invoices.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} · {inv.clientName} ·{' '}
                          {formatCurrency(inv.balanceDue, inv.currency)} due
                        </option>
                      ))}
                    </select>
                    {errors.invoiceId && (
                      <p className="form-error">{errors.invoiceId.message}</p>
                    )}
                    {selectedInvoice && (
                      <p className="text-xs text-blue-600 mt-1">
                        Balance due: {formatCurrency(selectedInvoice.balanceDue, selectedInvoice.currency)}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="form-label">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="input-field"
                      placeholder="0.00"
                      {...register('amount', {
                        required: 'Amount is required',
                        min: { value: 0.01, message: 'Amount must be > 0' },
                      })}
                    />
                    {errors.amount && <p className="form-error">{errors.amount.message}</p>}
                  </div>

                  {/* Date */}
                  <div>
                    <label className="form-label">Payment Date *</label>
                    <input
                      type="date"
                      className="input-field"
                      {...register('paymentDate', { required: 'Date is required' })}
                    />
                  </div>

                  {/* Method */}
                  <div>
                    <label className="form-label">Payment Method</label>
                    <select className="input-field" {...register('paymentMethod')}>
                      <option value="">— Select method —</option>
                      {PAYMENT_METHODS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Reference */}
                  <div>
                    <label className="form-label">Reference / Transaction ID</label>
                    <input
                      className="input-field"
                      placeholder="e.g. TXN-12345"
                      {...register('referenceNumber')}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="form-label">Notes</label>
                    <textarea className="input-field" rows={2}
                      placeholder="Optional notes..."
                      {...register('notes')} />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="btn-success">
                      {isSubmitting ? 'Recording...' : 'Record Payment'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function Payments() {
  const [payments,      setPayments]      = useState([])
  const [unpaidInvoices, setUnpaidInvoices] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [modalOpen,     setModalOpen]     = useState(false)
  const [deleteModal,   setDeleteModal]   = useState({ open: false, payment: null })
  const [actionLoading, setActionLoading] = useState(false)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPayments({ page, size: 10 })
      setPayments(data.content          || [])
      setTotalPages(data.totalPages     || 0)
      setTotalElements(data.totalElements || 0)
    } catch {
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }, [page])

  const fetchUnpaidInvoices = useCallback(async () => {
    try {
      const [sent, overdue] = await Promise.all([
        getInvoices({ status: 'SENT',    size: 100 }),
        getInvoices({ status: 'OVERDUE', size: 100 }),
      ])
      const all = [
        ...(sent.content    || []),
        ...(overdue.content || []),
      ].filter(inv => parseFloat(inv.balanceDue) > 0)
      setUnpaidInvoices(all)
    } catch {
      // fail silently
    }
  }, [])

  useEffect(() => { fetchPayments()       }, [fetchPayments])
  useEffect(() => { fetchUnpaidInvoices() }, [fetchUnpaidInvoices])

  const handleRecord = async (data) => {
    try {
      await recordPayment(data)
      toast.success('Payment recorded!')
      setModalOpen(false)
      fetchPayments()
      fetchUnpaidInvoices()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record payment')
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await deletePayment(deleteModal.payment.id)
      toast.success('Payment deleted')
      setDeleteModal({ open: false, payment: null })
      fetchPayments()
    } catch {
      toast.error('Failed to delete payment')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle={`${totalElements} payment record${totalElements !== 1 ? 's' : ''}`}
        actions={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Record Payment
          </button>
        }
      />

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner text="Loading payments..." />
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={<CreditCardIcon className="h-16 w-16" />}
            title="No payments yet"
            description="Record your first payment when a client pays an invoice"
            action={
              <button className="btn-primary" onClick={() => setModalOpen(true)}>
                <PlusIcon className="h-4 w-4" />
                Record Payment
              </button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="table-header">Invoice</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Method</th>
                    <th className="table-header">Reference</th>
                    <th className="table-header text-right">Amount</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="table-cell">
                        <p className="font-semibold text-gray-900">{p.invoiceNumber}</p>
                      </td>
                      <td className="table-cell text-gray-500 text-sm">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="table-cell">
                        {p.paymentMethod ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full
                                           text-xs font-medium bg-gray-100 text-gray-700">
                            {p.paymentMethod}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="table-cell text-gray-400 text-sm font-mono">
                        {p.referenceNumber || '—'}
                      </td>
                      <td className="table-cell text-right">
                        <span className="text-lg font-bold text-green-600">
                          +{formatCurrency(p.amount)}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <button
                          onClick={() => setDeleteModal({ open: true, payment: p })}
                          className="p-2 text-gray-400 hover:text-red-600
                                     hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
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

      <RecordPaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleRecord}
        invoices={unpaidInvoices}
      />

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, payment: null })}
        onConfirm={handleDelete}
        loading={actionLoading}
        title="Delete Payment"
        message="Are you sure you want to delete this payment record? The invoice balance will be restored."
        confirmText="Delete Payment"
      />
    </div>
  )
}