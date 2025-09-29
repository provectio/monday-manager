import { motion } from 'framer-motion';
import { useTheme } from '../components/ThemeProvider';
import ApiConfig from '../components/ApiConfig';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Paramètres
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configurez votre application
        </p>
      </div>

      {/* API Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ApiConfig />
      </motion.div>

      {/* Theme Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Apparence
        </h2>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              Thème
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choisissez entre le thème clair et sombre
            </p>
          </div>
          
          <button
            onClick={toggleTheme}
            className="btn-secondary flex items-center space-x-2"
          >
            <span>Basculer vers le thème {theme === 'light' ? 'sombre' : 'clair'}</span>
          </button>
        </div>
      </motion.div>

      {/* About */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          À propos
        </h2>
        
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
            <p><strong>Monday Project Manager</strong> <em className="text-gray-500">by Provectio</em> v1.2.0</p>
          </div>
          <p className="text-xs text-gray-400">Dernière mise à jour: {new Date().toLocaleString()}</p>
          <p>Application web pour gérer vos projets Monday.com</p>
          <p>Développé Olivier ACHIN sous React, TypeScript et Tailwind CSS</p>
        </div>
      </motion.div>
    </div>
  );
}

