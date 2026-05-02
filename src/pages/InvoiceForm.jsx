import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  createInvoice, updateInvoice, getInvoiceById,
} from '../services/invoiceService'
import { getActiveClients }    from '../services/clientService'
import { getSettings }         from '../services/settingsService'
import LoadingSpinner          from '../components/common/LoadingSpinner'
import { formatCurrency }      from '../utils/formatters'
import {
  ArrowLeftIcon, PlusIcon, TrashIcon,
} from '@heroicons/react/24/outline'

const DEFAULT_ITEM = { description: '', quantity: 1, unitPrice: '', sortOrder: 0 }

export default function InvoiceForm() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const isEdit   = !!id

  const [clients,   setClients]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)

  const {
    register, control, handleSubmit,
    watch, setValue, formState: { errors },
  } = useForm({
    defaultValues: {
      clientId:       '',
      title:          '',
      issueDate:      new Date().toISOString().split('T')[0],
      dueDate:        '',
      currency:       'USD',
      taxRate:        0,
      discountAmount: 0,
      notes:          '',
      terms:          '',
      isRecurring:    false,
      items:          [DEFAULT_ITEM],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  // Watch for live totals
  const watchItems    = watch('items')
  const watchTaxRate  = watch('taxRate')
  const watchDiscount = watch('discountAmount')
  const watchCurrency = watch('currency')

  // Calculate totals
  const subtotal = (watchItems || []).reduce((sum, item) => {
    const qty   = parseFloat(item.quantity)   || 0
    const price = parseFloat(item.unitPrice)  || 0
    return sum + qty * price
  }, 0)
  const taxAmt  = subtotal * ((parseFloat(watchTaxRate)  || 0) / 100)
  const disc    = parseFloat(watchDiscount) || 0
  const total   = subtotal + taxAmt - disc

  // Load data
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [activeClients, settings] = await Promise.all([
          getActiveClients(),
          getSettings(),
        ])
        setClients(activeClients || [])

        if (isEdit) {
          const inv = await getInvoiceById(id)
          setValue('clientId',       inv.clientId)
          setValue('title',          inv.title          || '')
          setValue('issueDate',      inv.issueDate)
          setValue('dueDate',        inv.dueDate)
          setValue('currency',       inv.currency       || 'USD')
          setValue('taxRate',        inv.taxRate        || 0)
          setValue('discountAmount', inv.discountAmount || 0)
          setValue('notes',          inv.notes          || '')
          setValue('terms',          inv.terms          || '')
          setValue('isRecurring',    inv.isRecurring    || false)
          setValue('recurringFrequency', inv.recurringFrequency || '')
          setValue('items', inv.items.length > 0
            ? inv.items.map(i => ({
                description: i.description,
                quantity:    i.quantity,
                unitPrice:   i.unitPrice,
                sortOrder:   i.sortOrder,
              }))
            : [DEFAULT_ITEM]
          )
        } else {
          // Apply defaults from settings
          setValue('currency', settings?.defaultCurrency || 'USD')
          setValue('taxRate',  settings?.defaultTaxRate  || 0)
          setValue('terms',    settings?.defaultPaymentTerms || '')
        }
      } catch {
        toast.error('Failed to load form data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, isEdit, setValue])

  const onSubmit = async (data) => {
    if (!data.items || data.items.length === 0) {
      toast.error('Please add at least one line item')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...data,
        clientId:       parseInt(data.clientId),
        taxRate:        parseFloat(data.taxRate)        || 0,
        discountAmount: parseFloat(data.discountAmount) || 0,
        items: data.items.map((item, idx) => ({
          description: item.description,
          quantity:    parseFloat(item.quantity)  || 1,
          unitPrice:   parseFloat(item.unitPrice) || 0,
          sortOrder:   idx,
        })),
      }

      if (isEdit) {
        await updateInvoice(id, payload)
        toast.success('Invoice updated!')
      } else {
        await createInvoice(payload)
        toast.success('Invoice created!')
      }
      navigate('/invoices')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save invoice')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/invoices')}
          className="p-2 text-gray-500 hover:text-gray-700
                     hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Invoice' : 'Create Invoice'}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {isEdit ? 'Update the invoice details below' : 'Fill in the details to create a new invoice'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Section 1: Invoice Details ─────────────────── */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Invoice Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Client */}
            <div className="md:col-span-2">
              <label className="form-label">Client *</label>
              <select
                className="input-field"
                {...register('clientId', { required: 'Please select a client' })}
              >
                <option value="">— Select a client —</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.companyName ? ` · ${c.companyName}` : ''}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="form-error">{errors.clientId.message}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="form-label">Invoice Title</label>
              <input
                className="input-field"
                placeholder="e.g. Web Design Project"
                {...register('title')}
              />
            </div>

            {/* Currency */}
            <div>
              <label className="form-label">Currency</label>
              <select className="input-field" {...register('currency')}>
                <option value="USD">🇺🇸 USD — US Dollar</option>
                <option value="INR">🇮🇳 INR — Indian Rupee</option>
                <option value="EUR">🇪🇺 EUR — Euro</option>
                <option value="GBP">🇬🇧 GBP — British Pound</option>
                <option value="PHP">🇵🇭 PHP — Philippine Peso</option>
                <option value="CAD">🇨🇦 CAD — Canadian Dollar</option>
                <option value="AUD">🇦🇺 AUD — Australian Dollar</option>
                <option value="SGD">🇸🇬 SGD — Singapore Dollar</option>
                <option value="JPY">🇯🇵 JPY — Japanese Yen</option>
              </select>
            </div>

            {/* Issue Date */}
            <div>
              <label className="form-label">Issue Date *</label>
              <input
                type="date"
                className="input-field"
                {...register('issueDate', { required: 'Issue date is required' })}
              />
              {errors.issueDate && (
                <p className="form-error">{errors.issueDate.message}</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                className="input-field"
                {...register('dueDate', { required: 'Due date is required' })}
              />
              {errors.dueDate && (
                <p className="form-error">{errors.dueDate.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 2: Line Items ──────────────────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Line Items</h2>
            <button
              type="button"
              onClick={() => append({ ...DEFAULT_ITEM })}
              className="btn-secondary text-sm px-3 py-1.5"
            >
              <PlusIcon className="h-4 w-4" />
              Add Item
            </button>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-12 gap-2 mb-2 px-1">
            <div className="col-span-6 text-xs font-semibold text-gray-400 uppercase">
              Description
            </div>
            <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase text-center">
              Qty
            </div>
            <div className="col-span-3 text-xs font-semibold text-gray-400 uppercase text-right">
              Unit Price
            </div>
            <div className="col-span-1" />
          </div>

          {/* Items */}
          <div className="space-y-2">
            {fields.map((field, index) => {
              const qty   = parseFloat(watchItems?.[index]?.quantity)  || 0
              const price = parseFloat(watchItems?.[index]?.unitPrice) || 0
              const lineTotal = qty * price

              return (
                <div key={field.id}>
                  <div className="grid grid-cols-12 gap-2 items-start">
                    {/* Description */}
                    <div className="col-span-6">
                      <input
                        className="input-field"
                        placeholder="Description of service / product"
                        {...register(`items.${index}.description`, {
                          required: 'Description required',
                        })}
                      />
                    </div>

                    {/* Qty */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="input-field text-center"
                        placeholder="1"
                        {...register(`items.${index}.quantity`, {
                          min: { value: 0.01, message: 'Must be > 0' },
                        })}
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input-field text-right"
                        placeholder="0.00"
                        {...register(`items.${index}.unitPrice`, {
                          min: { value: 0, message: 'Must be ≥ 0' },
                        })}
                      />
                    </div>

                    {/* Remove */}
                    <div className="col-span-1 flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="p-1 text-gray-300 hover:text-red-500
                                   disabled:opacity-30 disabled:cursor-not-allowed
                                   transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Line total */}
                  {lineTotal > 0 && (
                    <p className="text-xs text-gray-400 text-right pr-8 mt-0.5">
                      = {formatCurrency(lineTotal, watchCurrency)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
            <div className="w-80 space-y-3">
              {/* Subtotal */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(subtotal, watchCurrency)}
                </span>
              </div>

              {/* Tax */}
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Tax</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-16 border border-gray-200 rounded-lg px-2 py-1
                               text-xs text-center focus:outline-none focus:ring-1
                               focus:ring-blue-500"
                    {...register('taxRate')}
                  />
                  <span className="text-gray-400 text-xs">%</span>
                </div>
                <span className="font-medium text-gray-900">
                  +{formatCurrency(taxAmt, watchCurrency)}
                </span>
              </div>

              {/* Discount */}
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Discount</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-20 border border-gray-200 rounded-lg px-2 py-1
                               text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                    {...register('discountAmount')}
                  />
                </div>
                <span className="font-medium text-green-600">
                  -{formatCurrency(disc, watchCurrency)}
                </span>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-3
                              border-t-2 border-gray-200">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(total, watchCurrency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: Notes & Terms ───────────────────── */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Notes & Terms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="form-label">Notes to Client</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Thank you for your business! ..."
                {...register('notes')}
              />
            </div>
            <div>
              <label className="form-label">Terms & Conditions</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Payment due within 15 days..."
                {...register('terms')}
              />
            </div>
          </div>
        </div>

        {/* ── Actions ───────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-8"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30
                                 border-t-white rounded-full animate-spin" />
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEdit ? 'Update Invoice' : 'Create Invoice'
            )}
          </button>
        </div>

      </form>
    </div>
  )
}