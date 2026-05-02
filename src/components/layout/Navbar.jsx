import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/formatters'
import { BellIcon } from '@heroicons/react/24/outline'

export default function Navbar() {
  const { user } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-6 h-16
                        flex items-center justify-between shrink-0">
      {/* Left: Page greeting */}
      <div>
        <p className="text-sm text-gray-500">
          Welcome back,{' '}
          <span className="font-semibold text-gray-800">
            {user?.fullName?.split(' ')[0] || 'User'}
          </span>
          ! 👋
        </p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Subscription badge */}
        {user?.subscriptionTier === 'FREE' && (
          <span className="hidden sm:inline-flex items-center px-3 py-1
                           bg-blue-50 text-blue-700 text-xs font-medium rounded-full
                           border border-blue-200">
            Free Plan · <span className="ml-1 font-semibold">Upgrade →</span>
          </span>
        )}

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600
                           hover:bg-gray-100 rounded-lg transition-colors">
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500
                           rounded-full border border-white" />
        </button>

        {/* Avatar */}
        <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center
                        justify-center cursor-pointer">
          <span className="text-white text-sm font-semibold">
            {getInitials(user?.fullName)}
          </span>
        </div>
      </div>
    </header>
  )
}