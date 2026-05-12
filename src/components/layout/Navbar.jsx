import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/formatters'
import { BellIcon, Bars3Icon } from '@heroicons/react/24/outline'

export default function Navbar({ onMenuOpen }) {
  const { user } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 h-16 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        {/* Hamburger Menu */}
        <button 
          onClick={onMenuOpen}
          className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <div className="hidden sm:block">
          <p className="text-sm text-gray-500">
            Welcome, <span className="font-semibold text-gray-800">{user?.fullName?.split(' ')[0] || 'User'}</span>! 👋
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {user?.subscriptionTier === 'FREE' && (
          <span className="hidden xs:inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
            Free Plan
          </span>
        )}
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg relative">
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white" />
        </button>
        <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-semibold">{getInitials(user?.fullName)}</span>
        </div>
      </div>
    </header>
  )
}