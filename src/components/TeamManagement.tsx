import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Team, TeamType } from '../types';
import { useTeamsStore } from '../store/useTeamsStore';
import { useModuleTemplatesStore } from '../store/useModuleTemplatesStore';
import { useAppStore } from '../store/useAppStore';
import TeamStats from './TeamStats';

const AVAILABLE_ICONS = [
  '🏗️', '🔒', '📡', '☁️', '⚙️', '📋', '🎯', '💻', '🔧', '📊', 
  '🛡️', '🌐', '📱', '💾', '🔍', '📈', '🎨', '⚡', '🔐', '📝'
];

const AVAILABLE_COLORS = [
  '#579bfc', '#e2445c', '#00c875', '#784bd1', '#ff642e', 
  '#9c27b0', '#607d8b', '#f44336', '#4caf50', '#ff9800',
  '#2196f3', '#9c27b0', '#795548', '#607d8b', '#ff5722'
];

export default function TeamManagement() {
  const { teams, addTeam, updateTeam, deleteTeam, resetTeams } = useTeamsStore();
  const { templates, updateTemplate } = useModuleTemplatesStore();
  const { projects, updateProject } = useAppStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Team | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showStats, setShowStats] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#579bfc',
    icon: '🏗️'
  });

  const handleAddTeam = () => {
    if (!formData.name.trim()) return;
    
    addTeam({
      name: formData.name as TeamType,
      description: formData.description,
      color: formData.color,
      icon: formData.icon
    });
    
    setFormData({
      name: '',
      description: '',
      color: '#579bfc',
      icon: '🏗️'
    });
    setShowAddForm(false);
  };

  const handleEditTeam = () => {
    if (!editingTeam || !formData.name.trim()) return;
    
    const oldTeamName = editingTeam.name;
    const newTeamName = formData.name as TeamType;
    
    // Mettre à jour l'équipe
    updateTeam(editingTeam.id, {
      name: newTeamName,
      description: formData.description,
      color: formData.color,
      icon: formData.icon
    });
    
    // Si le nom a changé, synchroniser les templates et modules
    if (oldTeamName !== newTeamName) {
      console.log(`🔄 Synchronisation: ${oldTeamName} -> ${newTeamName}`);
      
      // Mettre à jour tous les templates qui appartiennent à l'ancienne équipe
      templates.forEach(template => {
        if (template.team === oldTeamName) {
          console.log(`📝 Mise à jour template: ${template.name} (${template.team} -> ${newTeamName})`);
          updateTemplate(template.id, { team: newTeamName });
        }
      });
      
      // Mettre à jour tous les modules dans les projets qui appartiennent à l'ancienne équipe
      projects.forEach(project => {
        const updatedModules = project.modules.map(module => {
          if (module.team === oldTeamName) {
            console.log(`🏗️ Mise à jour module: ${module.name} dans projet ${project.name} (${module.team} -> ${newTeamName})`);
            return { ...module, team: newTeamName };
          }
          return module;
        });
        
        if (updatedModules.some((module, index) => module.team !== project.modules[index].team)) {
          updateProject(project.id, { modules: updatedModules });
        }
      });
      
      console.log('✅ Synchronisation terminée');
    }
    
    setEditingTeam(null);
    setShowAddForm(false);
    setFormData({
      name: '',
      description: '',
      color: '#579bfc',
      icon: '🏗️'
    });
  };

  const handleDeleteTeam = () => {
    if (!showDeleteConfirm || deleteConfirmText !== 'DELETE') return;
    
    deleteTeam(showDeleteConfirm.id);
    setShowDeleteConfirm(null);
    setDeleteConfirmText('');
  };

  const startEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description,
      color: team.color,
      icon: team.icon
    });
    setShowAddForm(true);
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingTeam(null);
    setFormData({
      name: '',
      description: '',
      color: '#579bfc',
      icon: '🏗️'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des équipes
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez les équipes et leurs modules
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className="btn-secondary flex items-center space-x-2"
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>{showStats ? 'Masquer les statistiques' : 'Afficher les statistiques'}</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Ajouter une équipe</span>
          </button>
          <button
            onClick={resetTeams}
            className="btn-danger flex items-center space-x-2"
          >
            <XMarkIcon className="w-5 h-5" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6"
        >
          <TeamStats />
        </motion.div>
      )}

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {teams.map((team) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Team Header */}
              <div 
                className="p-4 text-white"
                style={{ backgroundColor: team.color }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{team.icon}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{team.name}</h3>
                      <p className="text-sm opacity-90">{team.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEdit(team)}
                      className="p-1.5 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
                      title="Modifier l'équipe"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(team)}
                      className="p-1.5 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
                      title="Supprimer l'équipe"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Team Info */}
              <div className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Couleur</span>
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: team.color }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Icône</span>
                    <span className="text-lg">{team.icon}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl mx-4 w-full max-h-[80vh] overflow-y-auto"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingTeam ? 'Modifier l\'équipe' : 'Ajouter une équipe'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom de l'équipe
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Infrastructure"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de l'équipe..."
                  rows={3}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Couleur
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Icône
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg ${
                        formData.icon === icon ? 'border-monday-500 bg-monday-50 dark:bg-monday-900' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={cancelForm}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={editingTeam ? handleEditTeam : handleAddTeam}
                disabled={!formData.name.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingTeam ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 w-full"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Supprimer l'équipe
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Êtes-vous sûr de vouloir supprimer l'équipe <strong>{showDeleteConfirm.name}</strong> ?
              Cette action est irréversible.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tapez <strong>DELETE</strong> pour confirmer :
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="DELETE"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(null);
                  setDeleteConfirmText('');
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteTeam}
                disabled={deleteConfirmText !== 'DELETE'}
                className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
