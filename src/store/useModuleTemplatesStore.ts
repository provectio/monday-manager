import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TeamType, SubTask } from '../types';

export interface ModuleTemplate {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  team: TeamType;
  tasks: { 
    name: string;
    dueDate?: string;
    subTasks?: SubTask[];
  }[];
}

interface ModuleTemplatesStore {
  templates: ModuleTemplate[];
  addTemplate: (template: Omit<ModuleTemplate, 'id'>) => void;
  updateTemplate: (id: string, updates: Partial<ModuleTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getTemplatesByTeam: (team: TeamType) => ModuleTemplate[];
  addSubTaskToTemplate: (templateId: string, taskIndex: number, subTask: Omit<SubTask, 'id' | 'mondaySubItemId'>) => void;
  updateSubTaskInTemplate: (templateId: string, taskIndex: number, subTaskIndex: number, updates: Partial<SubTask>) => void;
  removeSubTaskFromTemplate: (templateId: string, taskIndex: number, subTaskIndex: number) => void;
  reorderSubTasksInTemplate: (templateId: string, taskIndex: number, sourceIndex: number, destinationIndex: number) => void;
  resetTemplates: () => void;
  ensureDefaultTemplates: () => void;
}

const DEFAULT_TEMPLATES: ModuleTemplate[] = [
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    description: 'Serveurs, réseaux, équipements',
    color: '#579bfc', // Bleu (Monday.com compatible)
    icon: '🏗️',
    team: 'Infrastructure',
    tasks: [
      { name: 'Audit de l\'infrastructure existante' },
      { name: 'Planification des équipements' },
      { name: 'Installation et configuration' },
      { name: 'Tests de fonctionnement' },
    ]
  },
  {
    id: 'telecom',
    name: 'Télécom',
    description: 'Télécommunications et connectivité',
    color: '#00c875', // Vert (Monday.com compatible)
    icon: '📡',
    team: 'Télécom',
    tasks: [
      { name: 'Analyse des besoins télécom' },
      { name: 'Sélection des fournisseurs' },
      { name: 'Installation des équipements' },
      { name: 'Tests de connectivité' },
    ]
  },
  {
    id: 'cloud',
    name: 'Cloud',
    description: 'Services cloud et virtualisation',
    color: '#784bd1', // Violet (Monday.com compatible)
    icon: '☁️',
    team: 'Cloud',
    tasks: [
      { name: 'Audit de l\'infrastructure cloud' },
      { name: 'Migration des services' },
      { name: 'Configuration de la sécurité' },
      { name: 'Formation des équipes' },
    ]
  },
  {
    id: 'cybersecurite',
    name: 'Cybersécurité',
    description: 'Sécurité informatique et protection',
    color: '#e2445c', // Rouge (Monday.com compatible)
    icon: '🔒',
    team: 'Cybersécurité',
    tasks: [
      { name: 'Audit de sécurité' },
      { name: 'Mise en place des protections' },
      { name: 'Formation à la sécurité' },
      { name: 'Tests de pénétration' },
    ]
  },
  {
    id: 'infogerance',
    name: 'Infogérance',
    description: 'Gestion et maintenance IT',
    color: '#ff642e', // Orange (Monday.com compatible)
    icon: '⚙️',
    team: 'Infogérance',
    tasks: [
      { name: 'Audit des systèmes' },
      { name: 'Planification de la maintenance' },
      { name: 'Mise en place des outils' },
      { name: 'Formation des équipes' },
    ]
  },
  {
    id: 'conformite',
    name: 'Conformité',
    description: 'Module de conformité',
    color: '#a25dff', // Violet clair (Monday.com compatible)
    icon: '📋',
    team: 'Conformité & Qualité',
    tasks: [
      { name: 'Audit de conformité' },
      { name: 'Mise en conformité' },
      { name: 'Documentation' },
      { name: 'Formation' },
    ]
  },
  {
    id: 'gouvernance',
    name: 'Gouvernance',
    description: 'Stratégie et pilotage',
    color: '#bb3354', // Rouge foncé (Monday.com compatible)
    icon: '🎯',
    team: 'Gouvernance',
    tasks: [
      { name: 'Définition de la stratégie' },
      { name: 'Mise en place du pilotage' },
      { name: 'Formation des dirigeants' },
      { name: 'Suivi et reporting' },
    ]
  }
];

export const useModuleTemplatesStore = create<ModuleTemplatesStore>()(
  persist(
    (set, get) => ({
      templates: DEFAULT_TEMPLATES,

      addTemplate: (template) => {
        const newTemplate: ModuleTemplate = {
          ...template,
          id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        set((state) => ({ templates: [...state.templates, newTemplate] }));
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((template) =>
            template.id === id ? { ...template, ...updates } : template
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((template) => template.id !== id),
        }));
      },

      getTemplatesByTeam: (team) => {
        return get().templates.filter((template) => template.team === team);
      },

      resetTemplates: () => {
        set({ templates: DEFAULT_TEMPLATES });
      },

      // Fonction pour s'assurer que tous les templates par défaut sont présents
      ensureDefaultTemplates: () => {
        const currentTemplates = get().templates;
        
        // Vérifier si les templates existants ont la propriété team
        const templatesWithoutTeam = currentTemplates.filter(t => !t.team);
        
        if (templatesWithoutTeam.length > 0) {
          set({ templates: DEFAULT_TEMPLATES });
          return;
        }
        
        const missingTemplates = DEFAULT_TEMPLATES.filter(
          defaultTemplate => !currentTemplates.some(t => t.id === defaultTemplate.id)
        );
        
        if (missingTemplates.length > 0) {
          set((state) => ({
            templates: [...state.templates, ...missingTemplates]
          }));
        }
      },

      // Add sub-task to template task
      addSubTaskToTemplate: (templateId, taskIndex, subTask) => {
        console.log('🔍 Adding sub-task to template:', { templateId, taskIndex, subTask });
        set((state) => ({
          templates: state.templates.map((template) => {
            if (template.id === templateId) {
              const newSubTask = {
                ...subTask,
                id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                mondaySubItemId: null
              };
              
              const updatedTasks = [...template.tasks];
              if (!updatedTasks[taskIndex].subTasks) {
                updatedTasks[taskIndex].subTasks = [];
              }
              updatedTasks[taskIndex].subTasks.push(newSubTask);
              
              console.log('✅ Sub-task added:', newSubTask);
              console.log('📋 Updated tasks:', updatedTasks[taskIndex]);
              
              return {
                ...template,
                tasks: updatedTasks
              };
            }
            return template;
          })
        }));
      },

      // Update sub-task in template task
      updateSubTaskInTemplate: (templateId, taskIndex, subTaskIndex, updates) => {
        console.log('🔄 Updating sub-task:', { templateId, taskIndex, subTaskIndex, updates });
        set((state) => ({
          templates: state.templates.map((template) => {
            if (template.id === templateId) {
              const updatedTasks = [...template.tasks];
              if (updatedTasks[taskIndex].subTasks) {
                updatedTasks[taskIndex].subTasks = updatedTasks[taskIndex].subTasks.map((subTask, index) => {
                  if (index === subTaskIndex) {
                    const updated = { ...subTask, ...updates };
                    console.log('✅ Sub-task updated:', updated);
                    return updated;
                  }
                  return subTask;
                });
              }
              
              return {
                ...template,
                tasks: updatedTasks
              };
            }
            return template;
          })
        }));
      },

      // Remove sub-task from template task
      removeSubTaskFromTemplate: (templateId, taskIndex, subTaskIndex) => {
        console.log('🗑️ Removing sub-task:', { templateId, taskIndex, subTaskIndex });
        set((state) => ({
          templates: state.templates.map((template) => {
            if (template.id === templateId) {
              const updatedTasks = [...template.tasks];
              if (updatedTasks[taskIndex].subTasks) {
                const removedSubTask = updatedTasks[taskIndex].subTasks[subTaskIndex];
                console.log('✅ Sub-task removed:', removedSubTask);
                updatedTasks[taskIndex].subTasks = updatedTasks[taskIndex].subTasks.filter((_, index) => index !== subTaskIndex);
              }
              
              return {
                ...template,
                tasks: updatedTasks
              };
            }
            return template;
          })
        }));
      },

      // Reorder sub-tasks in template task
      reorderSubTasksInTemplate: (templateId, taskIndex, sourceIndex, destinationIndex) => {
        set((state) => ({
          templates: state.templates.map((template) => {
            if (template.id === templateId) {
              const updatedTasks = [...template.tasks];
              if (updatedTasks[taskIndex].subTasks) {
                const subTasks = Array.from(updatedTasks[taskIndex].subTasks);
                const [reorderedSubTask] = subTasks.splice(sourceIndex, 1);
                subTasks.splice(destinationIndex, 0, reorderedSubTask);
                updatedTasks[taskIndex].subTasks = subTasks;
              }
              
              return {
                ...template,
                tasks: updatedTasks
              };
            }
            return template;
          })
        }));
      },

    }),
    {
      name: 'module-templates-storage',
      getStorage: () => localStorage,
    }
  )
);