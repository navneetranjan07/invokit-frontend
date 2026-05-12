import { NavLink, useNavigate } from 'react-router-dom'
import {
  HomeIcon, DocumentTextIcon, UsersIcon, CreditCardIcon,
  CogIcon, ArrowRightOnRectangleIcon, XMarkIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/formatters'

const NAV_ITEMS = [
  { to: '/dashboard', icon: HomeIcon,         label: 'Dashboard'  },
  { to: '/invoices',  icon: DocumentTextIcon, label: 'Invoices'   },
  { to: '/clients',   icon: UsersIcon,        label: 'Clients'    },
  { to: '/payments',  icon: CreditCardIcon,   label: 'Payments'   },
  { to: '/settings',  icon: CogIcon,          label: 'Settings'   },
]

export default function Sidebar({ onNavClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-gray-900 flex flex-col h-full shrink-0">
      {/* Logo Area */}
      <div className="px-6 py-5 border-b border-gray-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">IK</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">
              Invo<span className="text-blue-400">Kit</span>
            </h1>
          </div>
        </div>
        {/* Mobile Close Button */}
        <button onClick={onNavClick} className="lg:hidden text-gray-400 hover:text-white">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavClick}
            className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      <div className="px-3 py-4 border-t border-gray-700/50">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-semibold">{getInitials(user?.fullName)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.fullName || 'User'}</p>
            <p className="text-gray-400 text-xs truncate">{user?.subscriptionTier || 'FREE'} Plan</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}