import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function Register() {
  const { register: authRegister } = useAuth()
  const navigate  = useNavigate()
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authRegister({
        fullName:        data.fullName,
        email:           data.email,
        password:        data.password,
        confirmPassword: data.confirmPassword,
        companyName:     data.companyName || null,
      })
      toast.success('Account created! Welcome to InvoKit 🎉')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14
                          bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-xl font-bold">IK</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Invo<span className="text-blue-600">Kit</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Create your free account</p>
        </div>

        <div className="card shadow-xl border-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                placeholder="John Doe"
                className="input-field"
                {...register('fullName', { required: 'Full name is required' })}
              />
              {errors.fullName && <p className="form-error">{errors.fullName.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="input-field"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                })}
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            {/* Company */}
            <div>
              <label className="form-label">Company Name (optional)</label>
              <input
                type="text"
                placeholder="Your Company Ltd"
                className="input-field"
                {...register('companyName')}
              />
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password *</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  className="input-field pr-10"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Min 6 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPass ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="form-label">Confirm Password *</label>
              <input
                type="password"
                placeholder="Repeat password"
                className="input-field"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: val => val === password || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-base mt-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30
                                   border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : 'Create Free Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Free plan includes 5 clients & 20 invoices/month
        </p>
      </div>
    </div>
  )
}