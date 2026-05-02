import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  getSettings, updateSettings,
  getProfile, updateProfile, changePassword,
} from '../services/settingsService'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import PageHeader     from '../components/common/PageHeader'
import { getInitials } from '../utils/formatters'
import {
  UserIcon, CogIcon, KeyIcon,
  CreditCardIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline'

const CURRENCIES = ['USD','EUR','GBP','PHP','CAD','AUD','SGD','JPY','INR']
const TABS = [
  { id: 'profile',   label: 'Profile',   icon: UserIcon         },
  { id: 'invoice',   label: 'Invoices',  icon: CogIcon          },
  { id: 'password',  label: 'Password',  icon: KeyIcon          },
  { id: 'plan',      label: 'Plan',      icon: CreditCardIcon   },
]

export default function Settings() {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading,   setLoading]   = useState(true)

  // Forms
  const profileForm  = useForm()
  const settingsForm = useForm()
  const passwordForm = useForm()

  const [savingProfile,  setSavingProfile]  = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // Load initial data
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [profile, settings] = await Promise.all([
          getProfile(),
          getSettings(),
        ])
        profileForm.reset({
          fullName:    profile.fullName    || '',
          companyName: profile.companyName || '',
          phone:       profile.phone       || '',
          address:     profile.address     || '',
          city:        profile.city        || '',
          country:     profile.country     || '',
          taxId:       profile.taxId       || '',
        })
        settingsForm.reset({
          defaultCurrency:       settings.defaultCurrency       || 'USD',
          defaultTaxRate:        settings.defaultTaxRate        || 0,
          defaultPaymentTerms:   settings.defaultPaymentTerms   || '',
          invoiceNumberPrefix:   settings.invoiceNumberPrefix   || 'INV',
          sendPaymentReminders:  settings.sendPaymentReminders  ?? true,
          reminderDaysBefore:    settings.reminderDaysBefore    || 7,
          reminderDaysAfter:     settings.reminderDaysAfter     || 3,
        })
      } catch {
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Save profile
  const handleSaveProfile = async (data) => {
    setSavingProfile(true)
    try {
      const updated = await updateProfile(data)
      updateUser(updated)
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // Save settings
  const handleSaveSettings = async (data) => {
    setSavingSettings(true)
    try {
      await updateSettings(data)
      toast.success('Settings saved!')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  // Change password
  const handleChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setSavingPassword(true)
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword:     data.newPassword,
        confirmPassword: data.confirmPassword,
      })
      toast.success('Password changed successfully!')
      passwordForm.reset()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      <div className="flex flex-col md:flex-row gap-6">

        {/* Sidebar Tabs */}
        <div className="md:w-52 shrink-0">
          <div className="card p-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                            text-sm font-medium transition-all text-left ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ── Profile Tab ──────────────────────────────── */}
          {activeTab === 'profile' && (
            <div className="card">
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center
                                justify-center text-white text-2xl font-bold shrink-0">
                  {getInitials(user?.fullName)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">{user?.fullName}</p>
                  <p className="text-gray-400 text-sm">{user?.email}</p>
                  <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full
                                   text-xs font-medium bg-blue-100 text-blue-700">
                    {user?.subscriptionTier} Plan
                  </span>
                </div>
              </div>

              <h2 className="font-semibold text-gray-900 mb-4">Personal Information</h2>
              <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Full Name *</label>
                    <input className="input-field"
                      {...profileForm.register('fullName', { required: true })} />
                  </div>
                  <div>
                    <label className="form-label">Company Name</label>
                    <input className="input-field"
                      placeholder="Your Company"
                      {...profileForm.register('companyName')} />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input className="input-field"
                      placeholder="+1 234 567 8900"
                      {...profileForm.register('phone')} />
                  </div>
                  <div>
                    <label className="form-label">Tax ID / VAT</label>
                    <input className="input-field"
                      placeholder="Optional"
                      {...profileForm.register('taxId')} />
                  </div>
                  <div>
                    <label className="form-label">City</label>
                    <input className="input-field"
                      placeholder="New York"
                      {...profileForm.register('city')} />
                  </div>
                  <div>
                    <label className="form-label">Country</label>
                    <input className="input-field"
                      placeholder="USA"
                      {...profileForm.register('country')} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="form-label">Address</label>
                    <textarea className="input-field" rows={2}
                      placeholder="Street address..."
                      {...profileForm.register('address')} />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={savingProfile} className="btn-primary">
                    {savingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Invoice Settings Tab ──────────────────────── */}
          {activeTab === 'invoice' && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Invoice Preferences</h2>
              <form onSubmit={settingsForm.handleSubmit(handleSaveSettings)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Currency */}
                  <div>
                    <label className="form-label">Default Currency</label>
                    <select className="input-field"
                      {...settingsForm.register('defaultCurrency')}>
                      {CURRENCIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tax Rate */}
                  <div>
                    <label className="form-label">Default Tax Rate (%)</label>
                    <input
                      type="number" step="0.01" min="0" max="100"
                      className="input-field"
                      placeholder="0.00"
                      {...settingsForm.register('defaultTaxRate')}
                    />
                  </div>

                  {/* Prefix */}
                  <div>
                    <label className="form-label">Invoice Number Prefix</label>
                    <input
                      className="input-field"
                      placeholder="INV"
                      {...settingsForm.register('invoiceNumberPrefix')}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      e.g. "INV" → INV-00001
                    </p>
                  </div>

                  {/* Reminders toggle */}
                  <div className="flex items-center gap-3 pt-5">
                    <input
                      type="checkbox"
                      id="reminders"
                      className="h-4 w-4 rounded text-blue-600 border-gray-300
                                 focus:ring-blue-500 cursor-pointer"
                      {...settingsForm.register('sendPaymentReminders')}
                    />
                    <label htmlFor="reminders"
                      className="text-sm text-gray-700 cursor-pointer">
                      Send automatic payment reminders
                    </label>
                  </div>

                  {/* Remind before */}
                  <div>
                    <label className="form-label">Remind before due (days)</label>
                    <input
                      type="number" min="1" max="30"
                      className="input-field"
                      {...settingsForm.register('reminderDaysBefore')}
                    />
                  </div>

                  {/* Remind after */}
                  <div>
                    <label className="form-label">Remind after due (days)</label>
                    <input
                      type="number" min="1" max="30"
                      className="input-field"
                      {...settingsForm.register('reminderDaysAfter')}
                    />
                  </div>

                  {/* Default terms */}
                  <div className="sm:col-span-2">
                    <label className="form-label">Default Payment Terms</label>
                    <textarea
                      className="input-field" rows={2}
                      placeholder="Payment due within 15 days of invoice date."
                      {...settingsForm.register('defaultPaymentTerms')}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={savingSettings} className="btn-primary">
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Password Tab ──────────────────────────────── */}
          {activeTab === 'password' && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
              <form
                onSubmit={passwordForm.handleSubmit(handleChangePassword)}
                className="space-y-4 max-w-sm"
              >
                <div>
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    {...passwordForm.register('currentPassword', {
                      required: 'Current password is required',
                    })}
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="form-error">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Min 6 characters"
                    {...passwordForm.register('newPassword', {
                      required: 'New password is required',
                      minLength: { value: 6, message: 'Min 6 characters' },
                    })}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="form-error">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Repeat new password"
                    {...passwordForm.register('confirmPassword', {
                      required: 'Please confirm your password',
                    })}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="form-error">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-start pt-2">
                  <button type="submit" disabled={savingPassword} className="btn-primary">
                    {savingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Plan Tab ──────────────────────────────────── */}
          {activeTab === 'plan' && (
            <div className="space-y-4">

              {/* Current Plan */}
              <div className="card border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Current Plan</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">
                      {user?.subscriptionTier}
                    </p>
                    {user?.subscriptionTier === 'FREE' && (
                      <div className="mt-3 space-y-1">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          Up to 5 active clients
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          20 invoices per month
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          PDF generation
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          Basic email reminders
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">$0</p>
                    <p className="text-gray-400 text-sm">/ month</p>
                  </div>
                </div>
              </div>

              {/* Upgrade Options */}
              {user?.subscriptionTier === 'FREE' && (
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-4">Upgrade Your Plan</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Pro Plan */}
                    <div className="border-2 border-blue-200 rounded-xl p-4">
                      <p className="font-bold text-gray-900 text-lg">Pro</p>
                      <p className="text-2xl font-bold text-blue-600 mt-1">
                        $12 <span className="text-sm font-normal text-gray-400">/month</span>
                      </p>
                      <ul className="mt-3 space-y-1.5">
                        {[
                          'Unlimited clients',
                          'Unlimited invoices',
                          'Auto payment reminders',
                          'Recurring invoices',
                          '5 invoice templates',
                          'Multi-currency',
                        ].map(f => (
                          <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-blue-500 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button className="btn-primary w-full mt-4">
                        Upgrade to Pro
                      </button>
                    </div>

                    {/* Premium Plan */}
                    <div className="border-2 border-purple-200 rounded-xl p-4 relative">
                      <span className="absolute -top-3 left-4 bg-purple-600 text-white
                                       text-xs font-bold px-3 py-1 rounded-full">
                        BEST VALUE
                      </span>
                      <p className="font-bold text-gray-900 text-lg">Premium</p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">
                        $29 <span className="text-sm font-normal text-gray-400">/month</span>
                      </p>
                      <ul className="mt-3 space-y-1.5">
                        {[
                          'Everything in Pro',
                          'Expense tracking',
                          'Time tracking',
                          'Client portal',
                          'Tax reports',
                          'API access',
                          'Priority support',
                        ].map(f => (
                          <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-purple-500 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button className="w-full mt-4 bg-purple-600 text-white px-4 py-2
                                         rounded-lg hover:bg-purple-700 transition-colors
                                         font-medium flex items-center justify-center gap-2">
                        Upgrade to Premium
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}