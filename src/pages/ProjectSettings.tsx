import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '../store/useAppStore';
import { useModuleTemplatesStore } from '../store/useModuleTemplatesStore';
import { Project, ModuleType, ModuleStatus, ProjectStatus, TeamType } from '../types';
import TeamModulesManager from '../components/TeamModulesManager';
import Toast from '../components/Toast';


export default function ProjectSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, addModuleToProject, removeModuleFromProject, updateModuleInProject, addSubTaskToTask, updateSubTaskInTask, removeSubTaskFromTask, archiveProject, setError, manualSync, refreshProject } = useAppStore();
  const { templates } = useModuleTemplatesStore();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [newTaskNames, setNewTaskNames] = useState<Record<string, string>>({});
  const [showModuleDeleteConfirm, setShowModuleDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });
  const [modulesBeingAdded, setModulesBeingAdded] = useState<Set<string>>(new Set());
  const [modulesBeingDeleted, setModulesBeingDeleted] = useState<Set<string>>(new Set());

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    const foundProject = projects.find(p => p.id === id);
    if (foundProject) {
      setProject(foundProject);
    } else {
      navigate('/');
    }
  }, [id, projects, navigate]);


  // Sync local project state with store when projects change
  useEffect(() => {
    if (project && projects.length > 0) {
      const updatedProject = projects.find(p => p.id === project.id);
      if (updatedProject) {
        // Only update if the modules have actually changed
        const modulesChanged = JSON.stringify(updatedProject.modules) !== JSON.stringify(project.modules);
        if (modulesChanged) {
          setProject(updatedProject);
        }
      }
    }
  }, [projects, project]);


  const handleAddModule = async (moduleName: string) => {
    if (!project || loading) return;

    const moduleInfo = templates.find(t => t.name === moduleName);
    if (!moduleInfo) return;

    // Check if module already exists
    const existingModule = project.modules.find(m => m.name === moduleInfo.name);
    if (existingModule) {
      return;
    }

    try {
      // Mark module as being added (for UI state)
      setModulesBeingAdded(prev => new Set(prev).add(moduleName));
      
      // Optimistically update the UI immediately
            const newModule = {
              id: `temp_${Date.now()}_${Math.random()}`,
              name: moduleInfo.name,
              type: moduleInfo.name as ModuleType,
              team: moduleInfo.team,
              mondayGroupId: `temp_${Date.now()}_${Math.random()}`,
              color: moduleInfo.color,
              status: 'not_started' as ModuleStatus,
              assignedPerson: '',
              tasks: []
            };

      // Update local state immediately
      setProject(prev => ({
        ...prev!,
        modules: [...prev!.modules, newModule]
      }));

      // Show success message immediately
      showToast(`Module "${moduleInfo.name}" ajouté avec succès !`, 'success');

      // Add module to project with optimistic update and error handling
      try {
        await addModuleToProject(project.id, moduleInfo.name);
        // Success - remove from being added state
        setModulesBeingAdded(prev => {
          const newSet = new Set(prev);
          newSet.delete(moduleName);
          return newSet;
        });
      } catch (error) {
        console.error('Background sync failed:', error);
        
        // Rollback: remove module from UI and show error
        setProject(prev => ({
          ...prev!,
          modules: prev!.modules.filter(m => m.name !== moduleName)
        }));
        
        // Remove from being added state
        setModulesBeingAdded(prev => {
          const newSet = new Set(prev);
          newSet.delete(moduleName);
          return newSet;
        });
        
        // Show error message
        showToast(`Erreur lors de l'ajout du module "${moduleInfo.name}"`, 'error');
      }
      
    } catch (error) {
      setError('Erreur lors de l\'ajout du module');
      console.error('Error adding module:', error);
      
      // Remove from being added state on error
      setModulesBeingAdded(prev => {
        const newSet = new Set(prev);
        newSet.delete(moduleName);
        return newSet;
      });
    }
  };

  const handleRemoveModule = async (moduleId: string) => {
    const module = project?.modules.find(m => m.id === moduleId);
    if (module) {
      setShowModuleDeleteConfirm({ id: moduleId, name: module.name });
    }
  };

  // Functions for TeamModulesManager
  const handleAddTask = async (moduleId: string) => {
    if (!project || !newTaskNames[moduleId]?.trim()) return;

    try {
      const newTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newTaskNames[moduleId].trim(),
        itemId: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        mondayItemId: null,
        status: 'todo' as const,
        assignedPerson: '',
        dueDate: undefined,
        subTasks: []
      };

      await updateModuleInProject(project.id, moduleId, {
        tasks: [...project.modules.find(m => m.id === moduleId)!.tasks, newTask]
      });

      setNewTaskNames(prev => ({ ...prev, [moduleId]: '' }));
    } catch (error) {
      setError('Erreur lors de l\'ajout de la tâche');
      console.error('Error adding task:', error);
    }
  };

  const handleRemoveTask = async (moduleId: string, taskId: string) => {
    if (!project) return;

    try {
      const module = project.modules.find(m => m.id === moduleId);
      if (!module) return;

      await updateModuleInProject(project.id, moduleId, {
        tasks: module.tasks.filter(t => t.id !== taskId)
      });
    } catch (error) {
      setError('Erreur lors de la suppression de la tâche');
      console.error('Error removing task:', error);
    }
  };

  const handleUpdateModule = async (moduleId: string, updates: any) => {
    if (!project) return;

    try {
      await updateModuleInProject(project.id, moduleId, updates);
    } catch (error) {
      setError('Erreur lors de la mise à jour du module');
      console.error('Error updating module:', error);
    }
  };

  const handleAddSubTask = async (moduleId: string, taskId: string, subTask: any) => {
    if (!project) return;
    setLoading(true);
    try {
      await addSubTaskToTask(project.id, moduleId, taskId, subTask);
    } catch (error) {
      setError('Erreur lors de l\'ajout de la sous-tâche');
      console.error('Error adding sub-task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubTask = async (moduleId: string, taskId: string, subTaskId: string, updates: any) => {
    if (!project) return;
    setLoading(true);
    try {
      await updateSubTaskInTask(project.id, moduleId, taskId, subTaskId, updates);
    } catch (error) {
      setError('Erreur lors de la mise à jour de la sous-tâche');
      console.error('Error updating sub-task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubTask = async (moduleId: string, taskId: string, subTaskId: string) => {
    if (!project) return;
    setLoading(true);
    try {
      await removeSubTaskFromTask(project.id, moduleId, taskId, subTaskId);
    } catch (error) {
      setError('Erreur lors de la suppression de la sous-tâche');
      console.error('Error deleting sub-task:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteModule = async () => {
    if (!project || !showModuleDeleteConfirm || deleteConfirmText !== 'DELETE') return;

    const moduleToDelete = showModuleDeleteConfirm;
    const moduleName = moduleToDelete.name;

    try {
      // Mark module as being deleted
      setModulesBeingDeleted(prev => new Set(prev).add(moduleToDelete.id));

      // Optimistically remove module from UI immediately
      setProject(prev => ({
        ...prev!,
        modules: prev!.modules.filter(m => m.id !== moduleToDelete.id)
      }));

      setShowModuleDeleteConfirm(null);
      setDeleteConfirmText('');

      // Show success message immediately
      showToast(`Module "${moduleName}" supprimé avec succès !`, 'error');

      // Remove module from project with optimistic update and error handling
      try {
        await removeModuleFromProject(project.id, moduleToDelete.id);
        // Success - remove from being deleted state
        setModulesBeingDeleted(prev => {
          const newSet = new Set(prev);
          newSet.delete(moduleToDelete.id);
          return newSet;
        });
      } catch (error) {
        console.error('Background sync failed:', error);
        
        // Rollback: add module back to UI
        setProject(prev => ({
          ...prev!,
              modules: [...prev!.modules, {
                id: moduleToDelete.id,
                name: moduleName,
                type: 'Infrastructure' as ModuleType,
                team: 'Infrastructure' as TeamType,
                mondayGroupId: moduleToDelete.id,
                color: '#3B82F6',
                status: 'not_started' as ModuleStatus,
                assignedPerson: '',
                tasks: []
              }]
        }));
        
        // Remove from being deleted state
        setModulesBeingDeleted(prev => {
          const newSet = new Set(prev);
          newSet.delete(moduleToDelete.id);
          return newSet;
        });
        
        // Show error message
        showToast(`Erreur lors de la suppression du module "${moduleName}"`, 'error');
      }
      
    } catch (error) {
      setError('Erreur lors de la suppression du module');
      console.error('Error removing module:', error);
      
      // Remove from being deleted state on error
      setModulesBeingDeleted(prev => {
        const newSet = new Set(prev);
        newSet.delete(moduleToDelete.id);
        return newSet;
      });
    }
  };

  const handleArchiveProject = () => {
    setShowArchiveConfirm(true);
  };

  const confirmArchiveProject = async () => {
    if (!project) return;

    try {
      setLoading(true);
      
      // Close modal and navigate immediately for better UX
      setShowArchiveConfirm(false);
      navigate('/');
      
      // Archive project in background (don't await) - pass mondayBoardId directly
      archiveProject(project.id, project.mondayBoardId).catch(error => {
        console.error('Error archiving project in background:', error);
        // Optionally show a toast notification here
      });
      
    } catch (error) {
      setError('Erreur lors de l\'archivage du projet');
      console.error('Error archiving project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!project) return;
    
    try {
      setIsManualSyncing(true);
      await refreshProject(project.id);
      // Update local project state after sync
      const updatedProject = projects.find(p => p.id === project.id);
      if (updatedProject) {
        setProject(updatedProject);
      }
    } catch (error) {
      setError('Erreur lors de la synchronisation');
      console.error('Error during manual sync:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const getModuleInfo = (moduleName: string) => {
    // Utiliser les templates dynamiques au lieu du tableau statique
    const template = templates.find(t => t.name === moduleName);
    if (template) {
      return {
        type: template.name as ModuleType,
        name: template.name,
        description: template.description,
        color: template.color,
        icon: template.icon
      };
    }
    
    // Fallback vers le premier template si pas trouvé
    const firstTemplate = templates[0];
    return {
      type: firstTemplate?.name as ModuleType || 'Infrastructure',
      name: firstTemplate?.name || 'Infrastructure',
      description: firstTemplate?.description || 'Module par défaut',
      color: firstTemplate?.color || '#3B82F6',
      icon: firstTemplate?.icon || '🏗️'
    };
  };

  const getProjectStatusInfo = (status: ProjectStatus) => {
    const statusMap = {
      'not_started': { text: 'Non démarré', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
      'in_progress': { text: 'En cours', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      'completed': { text: 'Terminé', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      'on_hold': { text: 'En attente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      'archived': { text: 'Archivé', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    };
    
    return statusMap[status] || statusMap['in_progress'];
  };




  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-monday-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gestion des modules et tâches
            </p>
          </div>
        </div>
        
                 <div className="flex items-center space-x-4">
                   {/* Background Operations Indicator */}
                   
                   {/* Manual Sync Button */}
                   <button
                     onClick={handleManualSync}
                     disabled={isManualSyncing || loading}
                     className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     <ArrowPathIcon className={`w-4 h-4 ${isManualSyncing ? 'animate-spin' : ''}`} />
                     <span>{isManualSyncing ? 'Synchronisation...' : 'Synchroniser'}</span>
                   </button>

                   <button
                     onClick={handleArchiveProject}
                     disabled={loading}
                     className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 transition-colors"
                   >
                     <TrashIcon className="w-5 h-5" />
                     <span>Archiver</span>
                   </button>
                 </div>
      </div>

               {/* Project Info */}
               <div className="card p-6 mb-6">
                 <div className="flex items-start justify-between">
                   <div className="flex-1">
                     <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                       Informations du projet
                     </h2>
                     <div className="space-y-3 mt-2">
                       <div className="flex items-center space-x-3">
                         {(() => {
                           const statusInfo = getProjectStatusInfo(project.status || 'in_progress');
                           return (
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                               {statusInfo.text}
                             </span>
                           );
                         })()}
                         <span className="text-gray-600 dark:text-gray-400">
                           {project.modules.length} modules
                         </span>
                       </div>
                       
                       {/* Dates */}
                       <div className="text-sm text-gray-500 dark:text-gray-400">
                         <p>Créé le {new Date(project.createdAt).toLocaleDateString('fr-FR')}</p>
                         <p>Modifié le {new Date(project.updatedAt).toLocaleDateString('fr-FR')}</p>
                       </div>
                     </div>
                   </div>
                   
                   {/* Circular Progress Indicator - Top Right */}
                   <div className="relative ml-4">
                     <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                       <path
                         className="text-gray-200 dark:text-gray-700"
                         stroke="currentColor"
                         strokeWidth="3"
                         fill="none"
                         d="M18 2.0845
                           a 15.9155 15.9155 0 0 1 0 31.831
                           a 15.9155 15.9155 0 0 1 0 -31.831"
                       />
                       <path
                         className={`transition-all duration-300 ${
                           project.progress >= 80 ? 'text-green-500' :
                           project.progress >= 50 ? 'text-orange-500' :
                           'text-red-500'
                         }`}
                         stroke="currentColor"
                         strokeWidth="3"
                         strokeLinecap="round"
                         fill="none"
                         strokeDasharray={`${project.progress}, 100`}
                         d="M18 2.0845
                           a 15.9155 15.9155 0 0 1 0 31.831
                           a 15.9155 15.9155 0 0 1 0 -31.831"
                       />
                     </svg>
                     <div className="absolute inset-0 flex items-center justify-center">
                       <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                         {project.progress}%
                       </span>
                     </div>
                   </div>
                 </div>
               </div>

      {/* Modules Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Modules sélectionnés
          </h2>
        </div>

        {project.modules.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Aucun module
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ajoutez des modules à votre projet.
            </p>
          </div>
        ) : (
          <TeamModulesManager
            project={project}
            onAddTask={handleAddTask}
            onRemoveTask={handleRemoveTask}
            onRemoveModule={handleRemoveModule}
            onUpdateModule={handleUpdateModule}
            onAddModule={handleAddModule}
            onAddSubTask={handleAddSubTask}
            onUpdateSubTask={handleUpdateSubTask}
            onDeleteSubTask={handleDeleteSubTask}
            newTaskNames={newTaskNames}
            setNewTaskNames={setNewTaskNames}
            setShowDeleteConfirm={setShowModuleDeleteConfirm}
            loading={loading}
            modulesBeingAdded={modulesBeingAdded}
            modulesBeingDeleted={modulesBeingDeleted}
          />
        )}
      </div>


      {/* Delete Confirmation Modal */}
      {showModuleDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 w-full"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Supprimer le module
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Êtes-vous sûr de vouloir supprimer le module <strong>{showModuleDeleteConfirm?.name}</strong> ?
              Cette action supprimera également toutes les tâches associées.
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
                  setShowModuleDeleteConfirm(null);
                  setDeleteConfirmText('');
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteModule}
                disabled={deleteConfirmText !== 'DELETE'}
                className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Archiver le projet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cette action est irréversible
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Le projet <strong>{project?.name}</strong> sera retiré immédiatement de cette application.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                L'archivage dans Monday.com se fera en arrière-plan. Pour supprimer définitivement, vous devrez le faire depuis Monday.com.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowArchiveConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmArchiveProject}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
              >
                {loading ? 'Archivage...' : 'Archiver'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Module Delete Confirmation Modal */}
      {showModuleDeleteConfirm && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.8)', 
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModuleDeleteConfirm(null);
              setDeleteConfirmText('');
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Êtes-vous sûr de vouloir supprimer le module <strong>{showModuleDeleteConfirm.name}</strong> ?
              Cette action supprimera définitivement le module et toutes ses données.
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
                onClick={() => {
                  setShowModuleDeleteConfirm(null);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteModule}
                disabled={deleteConfirmText !== 'DELETE'}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Supprimer le module
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={3000}
      />
    </div>
  );
}