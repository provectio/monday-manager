import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  KeyIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { mondayApi } from '../services/mondayApi';
import { useAppStore } from '../store/useAppStore';

export default function ApiConfig() {
  const { apiStatus, setApiStatus, setError } = useAppStore();
  const [token, setToken] = useState(localStorage.getItem('monday_api_token') || '');
  const [showToken, setShowToken] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleSaveToken = () => {
    if (!token.trim()) {
      setError('Veuillez entrer un token API');
      return;
    }

    localStorage.setItem('monday_api_token', token);
    setApiStatus({
      isConnected: false,
      lastChecked: new Date().toISOString(),
    });
    testConnection();
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      // Test Monday.com API connection
      await mondayApi.getBoards();
      setApiStatus({
        isConnected: true,
        lastChecked: new Date().toISOString(),
        error: undefined,
      });
    } catch (error) {
      setApiStatus({
        isConnected: false,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erreur de connexion',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRemoveToken = () => {
    localStorage.removeItem('monday_api_token');
    setToken('');
    setApiStatus({
      isConnected: false,
      lastChecked: new Date().toISOString(),
    });
  };

  return (
    <div className="card p-6">
      <div className="flex items-center space-x-3 mb-4">
        <KeyIcon className="w-6 h-6 text-monday-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Configuration API Monday
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Token API Monday
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Entrez votre token API Monday"
              className="input-field pr-10"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showToken ? (
                <EyeSlashIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <EyeIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Vous pouvez obtenir votre token dans les paramètres de votre compte Monday
          </p>
        </div>

        {/* Status Display */}
        <div className="flex items-center space-x-2">
          {apiStatus.isConnected ? (
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Connecté</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Déconnecté</span>
            </div>
          )}
          {apiStatus.error && (
            <span className="text-sm text-red-600 dark:text-red-400">
              - {apiStatus.error}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveToken}
            disabled={!token.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sauvegarder
          </button>
          
          <button
            onClick={testConnection}
            disabled={!token.trim() || isTesting}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isTesting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span>Test...</span>
              </>
            ) : (
              <span>Tester la connexion</span>
            )}
          </button>

          {token && (
            <button
              onClick={handleRemoveToken}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
            >
              Supprimer
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Comment obtenir votre token API :
          </h3>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Connectez-vous à votre compte Monday.com</li>
            <li>Cliquez sur votre avatar en haut à droite</li>
            <li>Sélectionnez "Administration"</li>
            <li>Cliquez sur "Connexions" dans le menu de gauche</li>
            <li>Dans le menu déroulant, cliquez sur "Jeton API personnel"</li>
            <li>Copiez votre token et collez-le ci-dessus</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
