import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../components/ThemeProvider';
import ApiConfig from '../components/ApiConfig';
import TeamManagement from '../components/TeamManagement';
import { 
  CogIcon, 
  UserGroupIcon, 
  ServerIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function Administration() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('api');

  const tabs = [
    { id: 'api', name: 'Configuration API', icon: ServerIcon },
    { id: 'teams', name: 'Gestion des équipes', icon: UserGroupIcon },
    { id: 'appearance', name: 'Apparence', icon: CogIcon },
    { id: 'about', name: 'À propos', icon: InformationCircleIcon },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Administration
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configurez votre application
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-monday-500 text-monday-600 dark:text-monday-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'api' && (
          <div>
            <ApiConfig />
          </div>
        )}

        {activeTab === 'teams' && (
          <div>
            <TeamManagement />
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="card p-6">
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
          </div>
        )}

        {activeTab === 'about' && (
          <div className="card p-6">
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
              <p>Application web pour gérer vos projets Monday.com</p>
              <p>Développé Olivier ACHIN sous React, TypeScript et Tailwind CSS</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
