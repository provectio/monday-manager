import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
  ListBulletIcon,
  ExclamationTriangleIcon,
  TagIcon,
  ArrowPathIcon,
  CogIcon,
  Squares2X2Icon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { useModuleTemplatesStore, ModuleTemplate } from '../store/useModuleTemplatesStore';
import { useTeamsStore } from '../store/useTeamsStore';
import { TeamType, SubTask } from '../types';
import ColorPicker from '../components/ColorPicker';
import SubTaskModal from '../components/SubTaskModal';

// Composant sortable pour les tâches
function SortableTaskItem({ 
  task, 
  index, 
  template, 
  setTemplate, 
  onUpdateTask, 
  onRemoveTask, 
  onShowSubTaskModal 
}: {
  task: { name: string; subTasks?: SubTask[] };
  index: number;
  template: ModuleTemplate;
  setTemplate: (template: ModuleTemplate) => void;
  onUpdateTask: (template: ModuleTemplate, setTemplate: (template: ModuleTemplate) => void, index: number, value: string) => void;
  onRemoveTask: (template: ModuleTemplate, setTemplate: (template: ModuleTemplate) => void, index: number) => void;
  onShowSubTaskModal: (templateId: string, taskIndex: number, taskName: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `task-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-2 p-2 rounded-lg border ${
        isDragging 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 shadow-lg' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
      }`}
    >
      <div 
        {...attributes}
        {...listeners}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab"
      >
        <Bars3Icon className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={task.name}
        onChange={(e) => onUpdateTask(template, setTemplate, index, e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-monday-500 focus:border-transparent"
        placeholder={`Tâche ${index + 1}`}
      />
      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onShowSubTaskModal(template.id, index, task.name);
          }}
          className="relative p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          title="Gérer les sous-tâches"
        >
          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold ${
            (task.subTasks?.length || 0) > 0 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-400 text-white'
          }`}>
            {task.subTasks?.length || 0}
          </div>
          <Squares2X2Icon className="w-4 h-4" />
        </button>
        {template.tasks.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveTask(template, setTemplate, index);
            }}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function ModuleTemplates() {
  const { templates, addTemplate, updateTemplate, deleteTemplate, addSubTaskToTemplate, updateSubTaskInTemplate, removeSubTaskFromTemplate, reorderSubTasksInTemplate, ensureDefaultTemplates } = useModuleTemplatesStore();
  const { teams } = useTeamsStore();
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [showEditTemplate, setShowEditTemplate] = useState<ModuleTemplate | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ModuleTemplate | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [newTaskNames, setNewTaskNames] = useState<Record<string, string>>({});
  const [newTemplateData, setNewTemplateData] = useState({
    name: '',
    description: '',
    color: '#579bfc', // Bleu (Monday.com compatible)
    icon: '🏗️',
    team: 'Infrastructure' as TeamType,
    tasks: [{ name: '' }]
  });
  const [nameError, setNameError] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<TeamType | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'tasks'>('settings');
  const [showSubTaskModal, setShowSubTaskModal] = useState<{ templateId: string; taskIndex: number; taskName: string } | null>(null);

  // Capteurs pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // S'assurer que tous les templates par défaut sont présents
  useEffect(() => {
    ensureDefaultTemplates();
    console.log('Templates loaded:', templates);
    console.log('Teams loaded:', teams);
  }, [ensureDefaultTemplates, templates, teams]);

  const handleAddTemplate = (templateData: {
    name: string;
    description: string;
    color: string;
    icon: string;
    team: TeamType;
    tasks: { name: string }[];
  }) => {
    // Vérifier si le nom existe déjà
    const nameExists = templates.some(template => 
      template.name.toLowerCase() === templateData.name.toLowerCase()
    );
    
    if (nameExists) {
      setNameError('Un modèle avec ce nom existe déjà');
      return;
    }

    addTemplate(templateData);
    setShowAddTemplate(false);
    setNewTemplateData({
      name: '',
      description: '',
      color: '#579bfc',
      icon: '🏗️',
      team: 'Infrastructure' as TeamType,
      tasks: [{ name: '' }]
    });
    setNameError('');
  };

  const handleEditTemplate = (templateData: {
    name: string;
    description: string;
    color: string;
    icon: string;
    team: TeamType;
    tasks: { name: string }[];
  }) => {
    if (!showEditTemplate) return;

    // Vérifier si le nom existe déjà (sauf pour le template en cours d'édition)
    const nameExists = templates.some(template => 
      template.id !== showEditTemplate.id && 
      template.name.toLowerCase() === templateData.name.toLowerCase()
    );

    if (nameExists) {
      setNameError('Un modèle avec ce nom existe déjà');
      return;
    }

    updateTemplate(showEditTemplate.id, templateData);
    setShowEditTemplate(null);
    setNameError('');
  };

  const handleDeleteTemplate = () => {
    if (!showDeleteConfirm || deleteConfirmText !== 'DELETE') return;
    
    deleteTemplate(showDeleteConfirm.id);
    setShowDeleteConfirm(null);
    setDeleteConfirmText('');
  };

  const handleTeamClick = (teamName: TeamType) => {
    setSelectedTeam(teamName);
  };

  const handleShowAllTeams = () => {
    setSelectedTeam(null);
  };

  const handleOpenAddTemplate = () => {
    setNewTemplateData({
      name: '',
      description: '',
      color: '#579bfc',
      icon: '🏗️',
      team: 'Infrastructure' as TeamType,
      tasks: [{ name: '' }]
    });
    setShowAddTemplate(true);
    setNameError('');
  };

  const handleOpenEditTemplate = (template: ModuleTemplate) => {
    setShowEditTemplate(template);
    setNameError('');
    setActiveTab('settings'); // Reset to settings tab
  };


  const addTask = (templateData: any, setTemplateData: any) => {
    setTemplateData({
      ...templateData,
      tasks: [...templateData.tasks, { name: '' }]
    });
  };

  const handleAddSubTask = (templateId: string, taskIndex: number, subTask: Omit<SubTask, 'id' | 'mondaySubItemId'>) => {
    addSubTaskToTemplate(templateId, taskIndex, subTask);
  };

  const handleUpdateSubTask = (templateId: string, taskIndex: number, subTaskIndex: number, updates: Partial<SubTask>) => {
    updateSubTaskInTemplate(templateId, taskIndex, subTaskIndex, updates);
  };

  const handleDeleteSubTask = (templateId: string, taskIndex: number, subTaskIndex: number) => {
    removeSubTaskFromTemplate(templateId, taskIndex, subTaskIndex);
  };

  const handleReorderSubTasks = (templateId: string, taskIndex: number, sourceIndex: number, destinationIndex: number) => {
    reorderSubTasksInTemplate(templateId, taskIndex, sourceIndex, destinationIndex);
  };

  // Fonction pour gérer le drag & drop des tâches
  const handleTaskDragEnd = (event: DragEndEvent, templateId: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const oldIndex = template.tasks.findIndex((_, index) => `task-${index}` === active.id);
    const newIndex = template.tasks.findIndex((_, index) => `task-${index}` === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newTasks = arrayMove(template.tasks, oldIndex, newIndex);
      updateTemplate(templateId, { tasks: newTasks });
    }
  };

  const removeTask = (templateData: any, setTemplateData: any, index: number) => {
    if (templateData.tasks.length > 1) {
      setTemplateData({
        ...templateData,
        tasks: templateData.tasks.filter((_: any, i: number) => i !== index)
      });
    }
  };

  const updateTask = (templateData: any, setTemplateData: any, index: number, value: string) => {
    const newTasks = [...templateData.tasks];
    newTasks[index] = { name: value };
    setTemplateData({
      ...templateData,
      tasks: newTasks
    });
  };

  const filteredTemplates = selectedTeam 
    ? templates.filter(t => t.team === selectedTeam)
    : templates;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Modèles de modules
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérez les modèles de modules et leurs tâches par défaut
          </p>
        </div>
        <div className="flex items-center space-x-3">
        <button
          onClick={handleOpenAddTemplate}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nouveau modèle</span>
        </button>
        </div>
      </div>

      {/* Teams Overview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {selectedTeam ? `Modules de l'équipe ${selectedTeam}` : 'Équipes disponibles'}
          </h2>
          {selectedTeam && (
            <button
              onClick={handleShowAllTeams}
              className="btn-secondary flex items-center space-x-2"
            >
              <span>← Voir toutes les équipes</span>
            </button>
          )}
        </div>
        
        {!selectedTeam ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {teams.map((team) => {
              const teamTemplates = templates.filter(t => t.team === team.name);
              console.log(`Team ${team.name}: ${teamTemplates.length} templates`, teamTemplates);
              return (
                <div
                  key={team.id}
                  onClick={() => handleTeamClick(team.name)}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="text-2xl mb-2">{team.icon}</div>
                  <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                    {team.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {teamTemplates.length} module(s)
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">
                {teams.find(t => t.name === selectedTeam)?.icon}
              </span>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  {selectedTeam}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {filteredTemplates.length} module(s) disponible(s)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Templates Grid */}
      {selectedTeam ? (
        filteredTemplates.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-6 h-full flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {template.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span 
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: template.color }}
                      >
                        {template.team}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <ListBulletIcon className="w-4 h-4" />
                      <span>{template.tasks.length} tâche(s) par défaut</span>
                    </div>
                    <div className="flex items-center space-x-1">
                    <button
                        onClick={() => handleOpenEditTemplate(template)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Modifier"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(template)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Aucun module
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Aucun module n'est disponible pour cette équipe.
            </p>
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Sélectionnez une équipe
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Cliquez sur une équipe ci-dessus pour voir ses modules
          </p>
      </div>
      )}

      {/* Add Template Modal */}
      {showAddTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl mx-4 w-full max-h-[80vh] overflow-y-auto"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Nouveau modèle
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom du modèle *
                </label>
                <input
                  type="text"
                  value={newTemplateData.name}
                  onChange={(e) => setNewTemplateData({ ...newTemplateData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-monday-500 focus:border-transparent"
                  placeholder="Ex: Infrastructure Cloud"
                />
                {nameError && (
                  <p className="text-red-500 text-sm mt-1">{nameError}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newTemplateData.description}
                  onChange={(e) => setNewTemplateData({ ...newTemplateData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-monday-500 focus:border-transparent"
                  placeholder="Décrivez le modèle..."
                />
              </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Équipe *
                </label>
                <select
                  value={newTemplateData.team}
                  onChange={(e) => setNewTemplateData({ ...newTemplateData, team: e.target.value as TeamType })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-monday-500 focus:border-transparent"
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.name}>
                      {team.name}
                    </option>
                  ))}
                </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Icône
                  </label>
                  <input
                    type="text"
                  value={newTemplateData.icon}
                  onChange={(e) => setNewTemplateData({ ...newTemplateData, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-monday-500 focus:border-transparent"
                    placeholder="🏗️"
                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Couleur
                </label>
                <ColorPicker
                  color={newTemplateData.color}
                  onChange={(color) => setNewTemplateData({ ...newTemplateData, color })}
                />
              </div>

              {/* Tâches par défaut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tâches par défaut
                </label>
                <div className="space-y-2">
                  {newTemplateData.tasks.map((task, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) => updateTask(newTemplateData, setNewTemplateData, index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-monday-500 focus:border-transparent"
                        placeholder={`Tâche ${index + 1}`}
                      />
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setShowSubTaskModal({ 
                            templateId: 'new_template', 
                            taskIndex: index, 
                            taskName: task.name 
                          })}
                          className="relative p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Gérer les sous-tâches"
                        >
                          {/* Badge pour le nombre de sous-tâches */}
                          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold ${
                            (task.subTasks?.length || 0) > 0 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-400 text-white'
                          }`}>
                            {task.subTasks?.length || 0}
                          </div>
                          <Squares2X2Icon className="w-4 h-4" />
                        </button>
                        {newTemplateData.tasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTask(newTemplateData, setNewTemplateData, index)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addTask(newTemplateData, setNewTemplateData)}
                    className="flex items-center space-x-2 text-monday-500 hover:text-monday-600 text-sm"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Ajouter une tâche</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddTemplate(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={() => handleAddTemplate(newTemplateData)}
                disabled={!newTemplateData.name.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Créer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Template Modal with Tabs */}
      {showEditTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl mx-4 w-full max-h-[80vh] overflow-y-auto"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Modifier le modèle
            </h3>
            
            {/* Tabs */}
            <div className="flex space-x-1 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'settings'
                    ? 'border-monday-500 text-monday-600 dark:text-monday-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CogIcon className="w-4 h-4" />
                  <span>Paramètres du module</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'tasks'
                    ? 'border-monday-500 text-monday-600 dark:text-monday-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ListBulletIcon className="w-4 h-4" />
                  <span>Tâches</span>
                </div>
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'settings' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Équipe *
                  </label>
                  <select
                    value={showEditTemplate.team}
                    onChange={(e) => setShowEditTemplate({ ...showEditTemplate, team: e.target.value as TeamType })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-monday-500 focus:border-transparent"
                  >
                    {teams.map((team) => (
                      <option key={team.id} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom du modèle *
                </label>
                <input
                  type="text"
                    value={showEditTemplate.name}
                    onChange={(e) => setShowEditTemplate({ ...showEditTemplate, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-monday-500 focus:border-transparent"
                />
                {nameError && (
                    <p className="text-red-500 text-sm mt-1">{nameError}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                    value={showEditTemplate.description}
                    onChange={(e) => setShowEditTemplate({ ...showEditTemplate, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-monday-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Icône
                  </label>
                  <input
                    type="text"
                    value={showEditTemplate.icon}
                    onChange={(e) => setShowEditTemplate({ ...showEditTemplate, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-monday-500 focus:border-transparent"
                />
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Couleur
                  </label>
                <ColorPicker
                    color={showEditTemplate.color}
                    onChange={(color) => setShowEditTemplate({ ...showEditTemplate, color })}
                />
                </div>
              </div>
            )}
              
            {activeTab === 'tasks' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tâches par défaut
                </label>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleTaskDragEnd(event, showEditTemplate.id)}
                >
                  <SortableContext
                    items={showEditTemplate.tasks.map((_, index) => `task-${index}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {showEditTemplate.tasks.map((task, index) => (
                        <SortableTaskItem
                          key={index}
                          task={task}
                          index={index}
                          template={showEditTemplate}
                          setTemplate={setShowEditTemplate}
                          onUpdateTask={updateTask}
                          onRemoveTask={removeTask}
                          onShowSubTaskModal={(templateId: string, taskIndex: number, taskName: string) => {
                            setShowSubTaskModal({ templateId, taskIndex, taskName });
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <button
                  type="button"
                  onClick={() => addTask(showEditTemplate, setShowEditTemplate)}
                  className="flex items-center space-x-2 text-monday-500 hover:text-monday-600 text-sm mt-3"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Ajouter une tâche</span>
                </button>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditTemplate(null)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={() => handleEditTemplate(showEditTemplate)}
                disabled={!showEditTemplate.name.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sauvegarder
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
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Êtes-vous sûr de vouloir supprimer le modèle <strong>{showDeleteConfirm.name}</strong> ?
              Cette action supprimera définitivement le modèle et toutes ses données.
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              ⚠️ Cette action est irréversible et supprimera toutes les tâches associées.
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
                onClick={() => setShowDeleteConfirm(null)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteTemplate}
                disabled={deleteConfirmText !== 'DELETE'}
                className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* SubTask Modal */}
      {showSubTaskModal && (
        <SubTaskModal
          isOpen={true}
          onClose={() => setShowSubTaskModal(null)}
          taskId={`task_${showSubTaskModal.taskIndex}`}
          taskName={showSubTaskModal.taskName}
          subTasks={(() => {
            if (showSubTaskModal.templateId === 'new_template') {
              const task = newTemplateData.tasks[showSubTaskModal.taskIndex];
              return task?.subTasks || [];
            }
            const template = templates.find(t => t.id === showSubTaskModal.templateId);
            const task = template?.tasks[showSubTaskModal.taskIndex];
            return task?.subTasks || [];
          })()}
          onAddSubTask={(taskId, subTask) => {
            if (showSubTaskModal.templateId === 'new_template') {
              // Handle new template case
              const updatedTasks = [...newTemplateData.tasks];
              if (!updatedTasks[showSubTaskModal.taskIndex].subTasks) {
                updatedTasks[showSubTaskModal.taskIndex].subTasks = [];
              }
              updatedTasks[showSubTaskModal.taskIndex].subTasks.push({
                ...subTask,
                id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                mondaySubItemId: null
              });
              setNewTemplateData({ ...newTemplateData, tasks: updatedTasks });
            } else {
              handleAddSubTask(showSubTaskModal.templateId, showSubTaskModal.taskIndex, subTask);
            }
          }}
          onUpdateSubTask={(taskId, subTaskId, updates) => {
            if (showSubTaskModal.templateId === 'new_template') {
              // Handle new template case
              const updatedTasks = [...newTemplateData.tasks];
              const currentSubTasks = updatedTasks[showSubTaskModal.taskIndex].subTasks || [];
              const subTaskIndex = currentSubTasks.findIndex(st => st.id === subTaskId);
              if (subTaskIndex !== -1 && updatedTasks[showSubTaskModal.taskIndex].subTasks) {
                updatedTasks[showSubTaskModal.taskIndex].subTasks = updatedTasks[showSubTaskModal.taskIndex].subTasks.map((st, index) => {
                  if (index === subTaskIndex) {
                    return { ...st, ...updates };
                  }
                  return st;
                });
              }
              setNewTemplateData({ ...newTemplateData, tasks: updatedTasks });
            } else {
              const template = templates.find(t => t.id === showSubTaskModal.templateId);
              const task = template?.tasks[showSubTaskModal.taskIndex];
              const subTaskIndex = task?.subTasks?.findIndex(st => st.id === subTaskId) || -1;
              if (subTaskIndex !== -1) {
                handleUpdateSubTask(showSubTaskModal.templateId, showSubTaskModal.taskIndex, subTaskIndex, updates);
              }
            }
          }}
          onDeleteSubTask={(taskId, subTaskId) => {
            if (showSubTaskModal.templateId === 'new_template') {
              // Handle new template case
              const updatedTasks = [...newTemplateData.tasks];
              const currentSubTasks = updatedTasks[showSubTaskModal.taskIndex].subTasks || [];
              const subTaskIndex = currentSubTasks.findIndex(st => st.id === subTaskId);
              if (subTaskIndex !== -1 && updatedTasks[showSubTaskModal.taskIndex].subTasks) {
                updatedTasks[showSubTaskModal.taskIndex].subTasks = updatedTasks[showSubTaskModal.taskIndex].subTasks.filter((_, index) => index !== subTaskIndex);
              }
              setNewTemplateData({ ...newTemplateData, tasks: updatedTasks });
            } else {
              const template = templates.find(t => t.id === showSubTaskModal.templateId);
              const task = template?.tasks[showSubTaskModal.taskIndex];
              const subTaskIndex = task?.subTasks?.findIndex(st => st.id === subTaskId) || -1;
              if (subTaskIndex !== -1) {
                handleDeleteSubTask(showSubTaskModal.templateId, showSubTaskModal.taskIndex, subTaskIndex);
              }
            }
          }}
          onReorderSubTasks={(taskId, sourceIndex, destinationIndex) => {
            if (showSubTaskModal.templateId === 'new_template') {
              // Handle new template case
              const updatedTasks = [...newTemplateData.tasks];
              if (updatedTasks[showSubTaskModal.taskIndex].subTasks) {
                const subTasks = Array.from(updatedTasks[showSubTaskModal.taskIndex].subTasks);
                const [reorderedSubTask] = subTasks.splice(sourceIndex, 1);
                subTasks.splice(destinationIndex, 0, reorderedSubTask);
                updatedTasks[showSubTaskModal.taskIndex].subTasks = subTasks;
              }
              setNewTemplateData({ ...newTemplateData, tasks: updatedTasks });
            } else {
              handleReorderSubTasks(showSubTaskModal.templateId, showSubTaskModal.taskIndex, sourceIndex, destinationIndex);
            }
          }}
          loading={false}
        />
      )}
    </div>
  );
}