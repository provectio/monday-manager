import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '../store/useAppStore';
import { useModuleTemplatesStore } from '../store/useModuleTemplatesStore';
import { useTeamsStore } from '../store/useTeamsStore';
import { TeamType } from '../types';
import TeamSelector from '../components/TeamSelector';
import TeamModulesGrid from '../components/TeamModulesGrid';

export default function CreateProject() {
  const navigate = useNavigate();
  const { createProject } = useAppStore();
  const { templates, getTemplatesByTeam } = useModuleTemplatesStore();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [nameExists, setNameExists] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamType | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projectCreated, setProjectCreated] = useState(false);
  const [creationStep, setCreationStep] = useState('');

  const handleNext = () => {
    if (projectName.trim()) {
      setNameExists(false);
    }
    setCurrentStep(2);
  };

  const getAvailableTemplates = () => {
    if (selectedTeam) {
      return getTemplatesByTeam(selectedTeam);
    }
    return templates;
  };

  const toggleModule = (templateId: string) => {
    setSelectedModules(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleCreateProject = async () => {
    if (selectedModules.length === 0) {
      setError('Veuillez sélectionner au moins un module');
      return;
    }

    setLoading(true);
    setIsCreating(true);
    setError('');

    try {
      const selectedTemplateNames = selectedModules.map(id => {
        const template = templates.find(t => t.id === id);
        return template?.name || id;
      });

            const projectData = {
              name: projectName,
              salesforceNumber: `SF-${Date.now()}`, // Generate a temporary Salesforce number
              description: projectDescription,
              modules: selectedTemplateNames
            };

      // Show success message immediately
      setProjectCreated(true);
      setCreationStep('Projet créé avec succès ! Synchronisation en cours...');

      // Start project creation in background (optimistic update)
      createProject(projectData).catch(error => {
        console.error('Background sync failed:', error);
        // Error handling is done in the store
      });

      // Navigate back after showing success message
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error creating project:', error);
      setError(`Erreur lors de la création du projet: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setCreationStep('');
    } finally {
      setIsCreating(false);
      setLoading(false);
    }
  };


  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Créer un nouveau projet
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configurez votre projet étape par étape
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-monday-500' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 1 ? 'bg-monday-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {currentStep > 1 ? <CheckCircleIcon className="w-5 h-5" /> : '1'}
            </div>
            <span className="text-sm font-medium">Informations</span>
          </div>
          
          <div className={`flex-1 h-0.5 ${currentStep >= 2 ? 'bg-monday-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          
          <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-monday-500' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 2 ? 'bg-monday-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {currentStep > 2 ? <CheckCircleIcon className="w-5 h-5" /> : '2'}
            </div>
            <span className="text-sm font-medium">Modules</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="card p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Informations du projet
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom du projet *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-monday-500 focus:border-transparent"
                  placeholder="Ex: Migration vers le cloud"
                />
                {nameExists && (
                  <p className="text-red-500 text-sm mt-1">Ce nom de projet existe déjà</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-monday-500 focus:border-transparent"
                  placeholder="Décrivez brièvement votre projet..."
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleNext}
                disabled={!projectName.trim()}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Suivant</span>
                <ArrowRightIcon className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="card p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Sélectionner les modules
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Choisissez les modules à inclure dans votre projet
            </p>

            {/* Team Selection */}
            <TeamSelector
              selectedTeam={selectedTeam}
              onTeamSelect={setSelectedTeam}
              className="mb-6"
              selectedModules={selectedModules}
              templates={templates}
            />

            {/* Team Modules Grid */}
            <TeamModulesGrid
              templates={getAvailableTemplates()}
              selectedModules={selectedModules}
              onToggleModule={toggleModule}
              selectedTeam={selectedTeam}
              loading={isCreating}
            />

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Retour</span>
                </button>
                
                <button
                  onClick={handleCreateProject}
                  disabled={selectedModules.length === 0 || isCreating}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Création...</span>
                    </>
                  ) : (
                    <>
                      <span>Créer le projet</span>
                      <CheckCircleIcon className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Success Animation */}
      {projectCreated && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center max-w-md mx-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircleIcon className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Projet créé avec succès !
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {creationStep}
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2 }}
                className="bg-green-500 h-2 rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );

  function handleBack() {
    setCurrentStep(1);
  }
}