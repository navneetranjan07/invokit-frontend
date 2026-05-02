import { useState, useEffect, useCallback, Fragment } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, Transition } from '@headlessui/react'
import toast from 'react-hot-toast'
import {
  getClients, createClient, updateClient,
  deleteClient, deactivateClient, activateClient,
} from '../services/clientService'
import PageHeader    from '../components/common/PageHeader'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState    from '../components/common/EmptyState'
import ConfirmModal  from '../components/common/ConfirmModal'
import Pagination    from '../components/common/Pagination'
import { formatDate, getInitials } from '../utils/formatters'
import {
  PlusIcon, PencilIcon, TrashIcon,
  MagnifyingGlassIcon, UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

// ─── Client Modal ─────────────────────────────────────────────
function ClientModal({ isOpen, onClose, onSave, client }) {
  const isEdit = !!client
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  useEffect(() => {
    if (isOpen) reset(client || {
      name: '', email: '', phone: '',
      companyName: '', city: '', country: '', taxId: '', notes: '',
    })
  }, [isOpen, client, reset])

  const onSubmit = async (data) => {
    await onSave(data)
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
              <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    {isEdit ? 'Edit Client' : 'Add New Client'}
                  </Dialog.Title>
                  <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="col-span-2">
                      <label className="form-label">Full Name *</label>
                      <input className="input-field" placeholder="John Doe"
                        {...register('name', { required: 'Name is required' })} />
                      {errors.name && <p className="form-error">{errors.name.message}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="form-label">Email</label>
                      <input className="input-field" type="email" placeholder="client@email.com"
                        {...register('email')} />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="form-label">Phone</label>
                      <input className="input-field" placeholder="+1 234 567 8900"
                        {...register('phone')} />
                    </div>

                    {/* Company */}
                    <div className="col-span-2">
                      <label className="form-label">Company Name</label>
                      <input className="input-field" placeholder="Company Ltd"
                        {...register('companyName')} />
                    </div>

                    {/* City */}
                    <div>
                      <label className="form-label">City</label>
                      <input className="input-field" placeholder="New York"
                        {...register('city')} />
                    </div>

                    {/* Country */}
                    <div>
                      <label className="form-label">Country</label>
                      <input className="input-field" placeholder="USA"
                        {...register('country')} />
                    </div>

                    {/* Tax ID */}
                    <div className="col-span-2">
                      <label className="form-label">Tax ID / VAT Number</label>
                      <input className="input-field" placeholder="Optional"
                        {...register('taxId')} />
                    </div>

                    {/* Notes */}
                    <div className="col-span-2">
                      <label className="form-label">Notes</label>
                      <textarea className="input-field" rows={2}
                        placeholder="Any additional notes..."
                        {...register('notes')} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="btn-primary">
                      {isSubmitting
                        ? 'Saving...'
                        : isEdit ? 'Save Changes' : 'Add Client'
                      }
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
export default function Clients() {
  const [clients,        setClients]        = useState([])
  const [loading,        setLoading]        = useState(true)
  const [search,         setSearch]         = useState('')
  const [page,           setPage]           = useState(0)
  const [totalPages,     setTotalPages]     = useState(0)
  const [totalElements,  setTotalElements]  = useState(0)
  const [modalOpen,      setModalOpen]      = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [deleteModal,    setDeleteModal]    = useState({ open: false, client: null })
  const [actionLoading,  setActionLoading]  = useState(false)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, size: 10, sort: 'createdAt', direction: 'desc' }
      if (search) params.search = search
      const data = await getClients(params)
      setClients(data.content        || [])
      setTotalPages(data.totalPages  || 0)
      setTotalElements(data.totalElements || 0)
    } catch {
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchClients() }, [fetchClients])

  // Open Add modal
  const handleAdd = () => {
    setSelectedClient(null)
    setModalOpen(true)
  }

  // Open Edit modal
  const handleEdit = (client) => {
    setSelectedClient(client)
    setModalOpen(true)
  }

  // Save (create or update)
  const handleSave = async (data) => {
    setActionLoading(true)
    try {
      if (selectedClient) {
        await updateClient(selectedClient.id, data)
        toast.success('Client updated!')
      } else {
        await createClient(data)
        toast.success('Client added!')
      }
      setModalOpen(false)
      fetchClients()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save client')
    } finally {
      setActionLoading(false)
    }
  }

  // Delete
  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await deleteClient(deleteModal.client.id)
      toast.success('Client deleted!')
      setDeleteModal({ open: false, client: null })
      fetchClients()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete client with invoices')
    } finally {
      setActionLoading(false)
    }
  }

  // Toggle Active
  const handleToggle = async (client) => {
    try {
      if (client.isActive) {
        await deactivateClient(client.id)
        toast.success('Client deactivated')
      } else {
        await activateClient(client.id)
        toast.success('Client activated')
      }
      fetchClients()
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${totalElements} client${totalElements !== 1 ? 's' : ''} total`}
        actions={
          <button className="btn-primary" onClick={handleAdd}>
            <PlusIcon className="h-4 w-4" />
            Add Client
          </button>
        }
      />

      {/* Search Bar */}
      <div className="card mb-4 py-3">
        <div className="flex items-center gap-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email or company..."
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
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner text="Loading clients..." />
          </div>
        ) : clients.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="h-16 w-16" />}
            title={search ? 'No clients found' : 'No clients yet'}
            description={
              search
                ? `No results for "${search}"`
                : 'Add your first client to start creating invoices'
            }
            action={
              !search && (
                <button className="btn-primary" onClick={handleAdd}>
                  <PlusIcon className="h-4 w-4" />
                  Add First Client
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="table-header">Client</th>
                    <th className="table-header">Contact</th>
                    <th className="table-header">Company</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Added</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clients.map(client => (
                    <tr key={client.id}
                      className="hover:bg-gray-50/70 transition-colors">

                      {/* Name + Avatar */}
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br
                                          from-blue-400 to-blue-600 flex items-center
                                          justify-center shrink-0">
                            <span className="text-white text-xs font-bold">
                              {getInitials(client.name)}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {client.name}
                          </span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="table-cell">
                        <p className="text-gray-700">{client.email || '—'}</p>
                        <p className="text-xs text-gray-400">{client.phone || ''}</p>
                      </td>

                      {/* Company */}
                      <td className="table-cell text-gray-500">
                        {client.companyName || '—'}
                      </td>

                      {/* Status */}
                      <td className="table-cell">
                        <button
                          onClick={() => handleToggle(client)}
                          title="Click to toggle"
                          className={`inline-flex items-center px-2.5 py-1 rounded-full
                                      text-xs font-medium cursor-pointer transition-all ${
                            client.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                            client.isActive ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          {client.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Added */}
                      <td className="table-cell text-gray-400 text-xs">
                        {formatDate(client.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(client)}
                            title="Edit"
                            className="p-2 text-gray-400 hover:text-blue-600
                                       hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, client })}
                            title="Delete"
                            className="p-2 text-gray-400 hover:text-red-600
                                       hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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

      {/* Modals */}
      <ClientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        client={selectedClient}
      />

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, client: null })}
        onConfirm={handleDelete}
        loading={actionLoading}
        title="Delete Client"
        message={`Are you sure you want to delete "${deleteModal.client?.name}"? This cannot be undone.`}
        confirmText="Delete Client"
      />
    </div>
  )
}