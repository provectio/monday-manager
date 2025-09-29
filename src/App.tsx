import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import ProjectSettings from './pages/ProjectSettings';
import ModuleTemplates from './pages/ModuleTemplates';
import Settings from './pages/Settings';
import Administration from './pages/Administration';
import ThemeProvider from './components/ThemeProvider';

function App() {
  const { setApiStatus, loadProjectsFromMonday } = useAppStore();
  const [isConfigured, setIsConfigured] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkConfiguration = async () => {
      setIsChecking(true);
      
      try {
        // Test Monday.com API connection
        const token = import.meta.env.VITE_MONDAY_API_TOKEN;
        const isConnected = !!token;
        
        setApiStatus({
          isConnected,
          lastChecked: new Date().toISOString(),
        });
        
        if (isConnected) {
          // Load projects from Monday.com
          await loadProjectsFromMonday();
          setIsConfigured(true);
        } else {
          setIsConfigured(false);
        }
      } catch (error) {
        console.error('Monday.com API connection failed:', error);
        setApiStatus({
          isConnected: false,
          lastChecked: new Date().toISOString(),
          error: 'Impossible de se connecter à Monday.com. Vérifiez votre token API.',
        });
        setIsConfigured(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkConfiguration();
  }, [setApiStatus, loadProjectsFromMonday]);

  // Afficher un loader pendant la vérification
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-monday-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Vérification de la configuration...</p>
        </div>
      </div>
    );
  }

      // Si pas configuré, afficher la page de configuration
      if (!isConfigured) {
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 dark:text-blue-400 text-2xl">⚙️</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Configuration requise
              </h1>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-left">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Token API Monday.com manquant
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Pour utiliser cette application, vous devez configurer votre token API Monday.com.
                </p>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <pre className="text-sm text-gray-800 dark:text-gray-200">
    {`# Configuration dans .env.local :
    VITE_MONDAY_API_TOKEN=votre_token_ici
    VITE_MONDAY_API_ENDPOINT=https://api.monday.com/v2
    VITE_MONDAY_API_VERSION=2025-10
    VITE_MONDAY_WORKSPACE_ID=votre_workspace_id`}
                  </pre>
                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>1.</strong> Ouvrez le fichier <code>.env.local</code> dans votre éditeur</p>
                  <p><strong>2.</strong> Remplacez <code>your_api_token_here</code> par votre vrai token API Monday</p>
                  <p><strong>3.</strong> Sauvegardez le fichier</p>
                  <p><strong>4.</strong> L'application se rechargera automatiquement</p>
                </div>
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Comment obtenir votre token :
                  </h3>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                    <li>Connectez-vous à Monday.com</li>
                    <li>Cliquez sur votre avatar → Administration</li>
                    <li>Connexions → Jeton API personnel</li>
                    <li>Copiez votre token</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        );
      }

  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create-project" element={<CreateProject />} />
            <Route path="/project/:id/settings" element={<ProjectSettings />} />
            <Route path="/module-templates" element={<ModuleTemplates />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/administration" element={<Administration />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
