import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  SunIcon, 
  MoonIcon,
  WifiIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useTheme } from './ThemeProvider';
import { useAppStore } from '../store/useAppStore';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { apiStatus } = useAppStore();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Logo and Title */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Monday Project Manager
            </span>
            <span className="text-sm text-gray-500 italic -mt-1">
              by Provectio
            </span>
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center space-x-4">
            {/* API Status */}
            <div className="flex items-center space-x-2">
              {apiStatus.isConnected ? (
                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                  <WifiIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">API OK</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Déconnecté</span>
                </div>
              )}
            </div>


            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <SunIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {/* Create Project Button */}
            <Link
              to="/create-project"
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Nouveau Projet</span>
            </Link>
        </div>
      </div>
    </header>
  );
}
