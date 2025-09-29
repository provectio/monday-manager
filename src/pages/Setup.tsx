import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  KeyIcon, 
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { mondayApi } from '../services/mondayApi';
import { useAppStore } from '../store/useAppStore';
import ErrorMessage from '../components/ErrorMessage';

export default function Setup() {
  const navigate = useNavigate();
  const { setApiStatus, setError, error, clearError } = useAppStore();
  const [apiToken, setApiToken] = useState(localStorage.getItem('monday_api_token') || '');
  const [workspaceId, setWorkspaceId] = useState(localStorage.getItem('monday_workspace_id') || '');
  const [showToken, setShowToken] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleSaveConfiguration = async () => {
    if (!apiToken.trim()) {
      setError('Veuillez entrer votre token API Monday');
      return;
    }

    if (!workspaceId.trim()) {
      setError('Veuillez entrer l\'ID de votre workspace Monday');
      return;
    }

    // Sauvegarder les configurations
    localStorage.setItem('monday_api_token', apiToken);
    localStorage.setItem('monday_workspace_id', workspaceId);

    // Tester la connexion
    setIsTesting(true);
    try {
      // Test Monday.com API connection
      await mondayApi.getBoards();
      setIsConnected(true);
      setApiStatus({
        isConnected: true,
        lastChecked: new Date().toISOString(),
      });
      setError(undefined);
      
      // Rediriger vers le dashboard après 1 seconde
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      setError('Erreur de connexion à Monday.com');
      console.error('Connection error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-monday-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Monday Project Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configurez votre connexion à Monday.com pour commencer
          </p>
        </div>

        <div className="card p-8 space-y-6">
          {/* Error Message */}
          {error && (
            <ErrorMessage message={error} onClose={clearError} />
          )}

          {/* Token API */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Token API Monday
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
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

          {/* Workspace ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ID du Workspace Monday
            </label>
            <input
              type="text"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              placeholder="Entrez l'ID de votre workspace"
              className="input-field"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              L'ID du workspace se trouve dans l'URL de votre workspace Monday
            </p>
          </div>

          {/* Status */}
          {isConnected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg"
            >
              <CheckCircleIcon className="w-5 h-5" />
              <span className="font-medium">Connexion réussie ! Redirection...</span>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex justify-center">
            <button
              onClick={handleSaveConfiguration}
              disabled={!apiToken.trim() || !workspaceId.trim() || isTesting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isTesting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Test de connexion...</span>
                </>
              ) : (
                <>
                  <span>Configurer et continuer</span>
                  <CheckCircleIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Comment obtenir vos informations :
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <div>
                <strong>Token API :</strong>
                <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
                  <li>Connectez-vous à Monday.com</li>
                  <li>Cliquez sur votre avatar → Administration</li>
                  <li>Connexions → Jeton API personnel</li>
                  <li>Copiez votre token</li>
                </ol>
              </div>
              <div>
                <strong>ID Workspace :</strong>
                <p className="ml-4 mt-1">
                  Dans l'URL de votre workspace : <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">monday.com/workspaces/[ID]</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
