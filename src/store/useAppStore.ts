import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Project, Module, Task, SubTask, ApiStatus, Theme, ModuleType, ModuleStatus, TaskStatus, ProjectStatus } from '../types';
import { mondayApi } from '../services/mondayApi';
import { useModuleTemplatesStore } from './useModuleTemplatesStore';

// Utility function to calculate project progress based on task statuses
const calculateProjectProgress = (modules: Module[]): number => {
  const allTasks = modules.flatMap(module => module.tasks);
  
  if (allTasks.length === 0) return 0;
  
  let totalProgress = 0;
  
  allTasks.forEach(task => {
    switch (task.status) {
      case 'done':
        totalProgress += 100;
        break;
      case 'in_progress':
        totalProgress += 50;
        break;
      case 'todo':
      default:
        totalProgress += 0;
        break;
    }
  });
  
  return Math.round(totalProgress / allTasks.length);
};

interface AppStore extends AppState {
  // Cache state
  projectsCache: Project[] | null;
  lastCacheUpdate: number | null;
  isRefreshing: boolean;
  syncInterval: any;
  
  // Actions
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  setApiStatus: (status: ApiStatus) => void;
  setTheme: (theme: Theme) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  loadProjectsFromMonday: (useCache?: boolean) => Promise<void>;
  refreshProjectsInBackground: () => Promise<void>;
  invalidateCache: () => void;
  forceSync: () => Promise<void>;
  createProject: (projectData: {
    name: string;
    salesforceNumber: string;
    description?: string;
    modules: string[];
  }) => Promise<any>;
  addModuleToProject: (projectId: string, moduleName: string) => Promise<void>;
  removeModuleFromProject: (projectId: string, moduleId: string) => Promise<void>;
  updateModuleInProject: (projectId: string, moduleId: string, updates: Partial<Module>) => Promise<void>;
  addSubTaskToTask: (projectId: string, moduleId: string, taskId: string, subTask: Omit<import('../types').SubTask, 'id' | 'mondaySubItemId'>) => Promise<void>;
  updateSubTaskInTask: (projectId: string, moduleId: string, taskId: string, subTaskId: string, updates: Partial<import('../types').SubTask>) => Promise<void>;
  removeSubTaskFromTask: (projectId: string, moduleId: string, taskId: string, subTaskId: string) => Promise<void>;
  refreshProject: (projectId: string) => Promise<void>;
  archiveProject: (projectId: string) => Promise<void>;
  startAutoSync: () => void;
  stopAutoSync: () => void;
  manualSync: () => Promise<void>;
}

// Helper function to get default tasks for a module from templates
const getDefaultTasksForModule = (moduleName: string): { name: string; dueDate?: string; subTasks?: SubTask[] }[] => {
  // Get templates from the module templates store
  const templates = useModuleTemplatesStore.getState().templates;
  
  // Find the template that matches the module name
  const template = templates.find(t => t.name === moduleName);
  
  if (template) {
    return template.tasks.map(task => ({ 
      name: task.name,
      dueDate: task.dueDate,
      subTasks: task.subTasks || []
    }));
  }
  
  // Fallback to default tasks if template not found
  return [
    { name: 'Tâche 1', subTasks: [] },
    { name: 'Tâche 2', subTasks: [] },
    { name: 'Tâche 3', subTasks: [] },
  ];
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
               // Initial state
               projects: [],
               projectsCache: null,
               lastCacheUpdate: null,
               isRefreshing: false,
               syncInterval: null,
               apiStatus: {
                 isConnected: false,
                 lastChecked: new Date().toISOString(),
               },
               theme: {
                 mode: 'light',
               },
               isLoading: false,
               error: null,

      // Actions
      setProjects: (projects) => set({ projects }),
      
      addProject: (project) => set((state) => ({
        projects: [...state.projects, project]
      })),
      
      updateProject: (projectId, updates) => set((state) => ({
        projects: state.projects.map(project =>
          project.id === projectId ? { ...project, ...updates } : project
        )
      })),
      
      deleteProject: (projectId) => set((state) => ({
        projects: state.projects.filter(project => project.id !== projectId)
      })),
      
      setApiStatus: (apiStatus) => set({ apiStatus }),
      
      setTheme: (theme) => set({ theme }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),

      // Load projects from Monday.com with cache support
      loadProjectsFromMonday: async (useCache = true) => {
        const state = get();
        const now = Date.now();
        const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache
        
        // If cache is valid and useCache is true, return cached data immediately
        if (useCache && state.projectsCache && state.lastCacheUpdate && 
            (now - state.lastCacheUpdate) < CACHE_DURATION) {
          set({ projects: state.projectsCache, isLoading: false });
          
          // Start background refresh if cache is older than 2 minutes
          if ((now - state.lastCacheUpdate) > 2 * 60 * 1000) {
            state.refreshProjectsInBackground();
          }
          return;
        }
        
        try {
          set({ isLoading: true, error: null });
          
          // Check if workspace ID is configured
          const workspaceId = import.meta.env.VITE_MONDAY_WORKSPACE_ID;
          if (!workspaceId) {
            throw new Error('Workspace ID not configured. Please set VITE_MONDAY_WORKSPACE_ID in your .env.local file.');
          }
          
          const result = await mondayApi.getBoards();
          const projects = result.boards
            .filter((board: any) => board.state !== 'archived') // Filter out archived projects
            .filter((board: any) => !board.name.includes('Sous-éléments de')) // Filter out sub-item boards
            .map((board: any) => ({
            id: board.id,
            name: board.name,
            description: board.description || '',
            salesforceNumber: board.name.split('-')[0] || '',
            mondayBoardId: board.id,
            status: 'in_progress' as ProjectStatus,
            modules: board.groups.map((group: any) => {
              // Get module color and team from templates
              const template = useModuleTemplatesStore.getState().templates.find(t => t.name === group.title);
              const moduleColor = template ? template.color : '#3B82F6';
              const moduleTeam = template?.team || 'Infrastructure';
              
              const module = {
                id: group.id,
                name: group.title,
                type: 'Infrastructure' as ModuleType, // Default type
                team: moduleTeam,
                mondayGroupId: group.id,
                tasks: (group.items_page?.items || []).map((item: any) => {
                  // Extract status from column values
                  const statusColumn = item.column_values?.find((col: any) => 
                    col.type === 'status' || col.id.includes('status')
                  );
                  const statusText = statusColumn?.text || 'Not Started';
                  
                  // Map Monday.com status to our TaskStatus
                  let taskStatus: TaskStatus = 'todo';
                  if (statusText.toLowerCase().includes('done') || statusText.toLowerCase().includes('completed') || statusText.toLowerCase().includes('réalisé')) {
                    taskStatus = 'done';
                  } else if (statusText.toLowerCase().includes('progress') || statusText.toLowerCase().includes('cours') || statusText.toLowerCase().includes('en cours')) {
                    taskStatus = 'in_progress';
                  }
                  
                  return {
                    id: item.id,
                    name: item.name,
                    itemId: item.id,
                    mondayItemId: item.id,
                    status: taskStatus,
                  };
                }),
                color: moduleColor || '#3B82F6',
                status: 'not_started' as ModuleStatus,
                assignedPerson: '',
              };
              
              return module;
            }),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })).map(project => ({
            ...project,
            progress: calculateProjectProgress(project.modules)
          }));
          
          // Update cache
          set({ 
            projects, 
            projectsCache: projects, 
            lastCacheUpdate: now,
            isLoading: false 
          });
        } catch (error) {
          console.error('Error loading projects:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load projects',
            isLoading: false 
          });
        }
      },

      // Refresh projects in background
      refreshProjectsInBackground: async () => {
        const state = get();
        if (state.isRefreshing) return; // Prevent multiple simultaneous refreshes
        
        try {
          set({ isRefreshing: true });
          
          // Check if workspace ID is configured
          const workspaceId = import.meta.env.VITE_MONDAY_WORKSPACE_ID;
          if (!workspaceId) {
            console.warn('Workspace ID not configured for background refresh');
            return;
          }
          
          const result = await mondayApi.getBoards();
          const projects = result.boards
            .filter((board: any) => board.state !== 'archived') // Filter out archived projects
            .filter((board: any) => !board.name.includes('Sous-éléments de')) // Filter out sub-item boards
            .map((board: any) => ({
            id: board.id,
            name: board.name,
            description: board.description || '',
            salesforceNumber: board.name.split('-')[0] || '',
            mondayBoardId: board.id,
            status: 'in_progress' as ProjectStatus,
            modules: board.groups.map((group: any) => {
              // Get module color and team from templates
              const template = useModuleTemplatesStore.getState().templates.find(t => t.name === group.title);
              const moduleColor = template ? template.color : '#3B82F6';
              const moduleTeam = template?.team || 'Infrastructure';
              
              const module = {
                id: group.id,
                name: group.title,
                type: 'Infrastructure' as ModuleType, // Default type
                team: moduleTeam,
                mondayGroupId: group.id,
                tasks: (group.items_page?.items || []).map((item: any) => {
                  // Extract status from column values
                  const statusColumn = item.column_values?.find((col: any) => 
                    col.type === 'status' || col.id.includes('status')
                  );
                  const statusText = statusColumn?.text || 'Not Started';
                  
                  // Map Monday.com status to our TaskStatus
                  let taskStatus: TaskStatus = 'todo';
                  if (statusText.toLowerCase().includes('done') || statusText.toLowerCase().includes('completed') || statusText.toLowerCase().includes('réalisé')) {
                    taskStatus = 'done';
                  } else if (statusText.toLowerCase().includes('progress') || statusText.toLowerCase().includes('cours') || statusText.toLowerCase().includes('en cours')) {
                    taskStatus = 'in_progress';
                  }
                  
                  return {
                    id: item.id,
                    name: item.name,
                    itemId: item.id,
                    mondayItemId: item.id,
                    status: taskStatus,
                  };
                }),
                color: moduleColor || '#3B82F6',
                status: 'not_started' as ModuleStatus,
                assignedPerson: '',
              };
              
              return module;
            }),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })).map(project => ({
            ...project,
            progress: calculateProjectProgress(project.modules)
          }));
          
          // Update cache and projects silently
          set({ 
            projects, 
            projectsCache: projects, 
            lastCacheUpdate: Date.now(),
            isRefreshing: false 
          });
          
        } catch (error) {
          console.error('Error in background refresh:', error);
          set({ isRefreshing: false });
          
          // If background sync fails, we could optionally show a notification
          // but keep the optimistic UI update for better UX
          console.warn('Background sync failed, but UI remains updated for better user experience');
        }
      },

      // Invalidate cache to force next load to fetch fresh data
      invalidateCache: () => {
        set({ 
          projectsCache: null, 
          lastCacheUpdate: null 
        });
      },

      // Force sync - invalidate cache and reload
      forceSync: async () => {
        const state = get();
        state.invalidateCache();
        await state.loadProjectsFromMonday(false);
      },


      // Create project
      createProject: async (projectData: {
        name: string;
        salesforceNumber: string;
        description?: string;
        modules: string[];
      }) => {
        // Generate temporary ID for optimistic update
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create project object for optimistic update
        const optimisticProject: Project = {
          id: tempId,
          name: projectData.name,
          description: projectData.description || '',
          salesforceNumber: projectData.salesforceNumber,
          boardId: tempId,
          mondayBoardId: tempId,
          modules: [],
          status: 'in_progress',
          progress: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'syncing'
        };

        // Update UI immediately with optimistic update
        set((state) => {
          const updatedProjects = [...state.projects, optimisticProject];
          return {
            projects: updatedProjects,
            // Update cache immediately for instant navigation
            projectsCache: updatedProjects,
            lastCacheUpdate: Date.now(),
            isLoading: false,
            error: null
          };
        });

        // Process Monday.com creation in background
        try {
          // Create board in Monday.com
          const boardResult = await mondayApi.createBoard(
            projectData.name,
            projectData.description || ''
          );
          
          const project: Project = {
            id: boardResult.create_board.id,
            name: projectData.name,
            description: projectData.description || '',
            salesforceNumber: projectData.salesforceNumber,
            boardId: boardResult.create_board.id,
            mondayBoardId: boardResult.create_board.id,
            modules: [],
            status: 'in_progress',
            progress: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'synced'
          };

          // Create custom columns for Status and Assigned Person
          try {
            await mondayApi.createColumn(boardResult.create_board.id, 'Statut', 'status');
          } catch (error) {
            console.error('Error creating Status column:', error);
          }

          try {
            await mondayApi.createColumn(boardResult.create_board.id, 'Personne', 'people');
          } catch (error) {
            console.error('Error creating Person column:', error);
          }

          // Create groups (modules) in Monday.com
          for (const moduleName of projectData.modules) {
            // Récupérer la couleur du template
            const colorTemplate = useModuleTemplatesStore.getState().templates.find(t => t.name === moduleName);
            const moduleColor = colorTemplate?.color;
            
            
            const groupResult = await mondayApi.createGroup(
              boardResult.create_board.id,
              moduleName,
              moduleColor
            );
            
            // Get default tasks for this module
            const defaultTasks = getDefaultTasksForModule(moduleName);
            const createdTasks: Task[] = [];
            
            // Create tasks in Monday.com
            for (const task of defaultTasks) {
              try {
                const itemResult = await mondayApi.createItem(
                  boardResult.create_board.id,
                  groupResult.create_group.id,
                  task.name,
                  {},
                  task.dueDate
                );
                
                const createdTask = {
                  id: itemResult.create_item.id,
                  name: task.name,
                  itemId: itemResult.create_item.id,
                  mondayItemId: itemResult.create_item.id,
                  status: 'todo' as TaskStatus,
                  dueDate: task.dueDate,
                  subTasks: [] as SubTask[]
                };
                
                // Create sub-tasks if they exist in the template
                if (task.subTasks && task.subTasks.length > 0) {
                  for (const subTask of task.subTasks) {
                    try {
                      const subItemResult = await mondayApi.createSubItem(
                        itemResult.create_item.id,
                        subTask.name,
                        subTask.status,
                        subTask.assignedPerson,
                        subTask.dueDate
                      );
                      
                      createdTask.subTasks.push({
                        id: subItemResult.create_subitem.id,
                        name: subTask.name,
                        mondaySubItemId: subItemResult.create_subitem.id,
                        status: subTask.status,
                        assignedPerson: subTask.assignedPerson,
                        dueDate: subTask.dueDate
                      });
                    } catch (subTaskError) {
                      console.error(`Error creating sub-task ${subTask.name}:`, subTaskError);
                      // Add sub-task locally even if Monday.com creation fails
                      createdTask.subTasks.push({
                        id: `temp_sub_${Date.now()}_${Math.random()}`,
                        name: subTask.name,
                        mondaySubItemId: null,
                        status: subTask.status,
                        assignedPerson: subTask.assignedPerson,
                        dueDate: subTask.dueDate
                      });
                    }
                  }
                }
                
                createdTasks.push(createdTask);
              } catch (error) {
                console.error('Error creating task:', error);
                // Add task locally even if Monday.com creation fails
                createdTasks.push({
                  id: `temp_${Date.now()}_${Math.random()}`,
                  name: task.name,
                  itemId: `temp_${Date.now()}_${Math.random()}`,
                  mondayItemId: null,
                  status: 'todo' as TaskStatus,
                  subTasks: task.subTasks || []
                });
              }
            }
            
            // Get team from template
            const teamTemplate = useModuleTemplatesStore.getState().templates.find(t => t.name === moduleName);
            const moduleTeam = teamTemplate?.team || 'Infrastructure';

            project.modules.push({
              id: groupResult.create_group.id,
              name: moduleName,
              type: 'Infrastructure' as ModuleType, // Default type, will be updated based on template
              team: moduleTeam,
              mondayGroupId: groupResult.create_group.id,
              tasks: createdTasks,
              color: moduleColor || '#3B82F6',
              status: 'not_started' as ModuleStatus,
              assignedPerson: '',
            });
          }

          // Remove default "Group Title" group if it exists (after creating our modules)
          try {
            const groupsResult = await mondayApi.getBoardGroups(boardResult.create_board.id);
            const defaultGroup = groupsResult.boards[0]?.groups?.find((group: any) => 
              group.title === 'Group Title' || group.title === 'New Group'
            );
            if (defaultGroup) {
              await mondayApi.deleteGroup(boardResult.create_board.id, defaultGroup.id);
            }
          } catch (error) {
            console.warn('Could not remove default group:', error);
            // Continue even if we can't remove the default group
          }

          // Update project progress after modules are created
          project.progress = calculateProjectProgress(project.modules);

          // Replace optimistic project with real project
          set((state) => {
            const updatedProjects = state.projects.map(p => 
              p.id === tempId ? { ...project, syncStatus: 'synced' as const } : p
            );
            return {
              projects: updatedProjects,
              projectsCache: updatedProjects,
              lastCacheUpdate: Date.now(),
              isLoading: false,
              error: null
            };
          });

          return project;
        } catch (error) {
          console.error('Error creating project:', error);
          
          // Update project with error status
          set((state) => {
            const updatedProjects = state.projects.map(p => 
              p.id === tempId ? { 
                ...p, 
                syncStatus: 'error' as const,
                syncError: error instanceof Error ? error.message : 'Erreur lors de la création du projet'
              } : p
            );
            return {
              projects: updatedProjects,
              projectsCache: updatedProjects,
              lastCacheUpdate: Date.now(),
              isLoading: false,
              error: null
            };
          });
          
          throw error;
        }
      },

      // Add module to project
      addModuleToProject: async (projectId: string, moduleName: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const project = get().projects.find(p => p.id === projectId);
          if (!project) {
            throw new Error('Project not found');
          }

          // Check if module already exists
          const existingModule = project.modules.find(m => m.name === moduleName);
          if (existingModule) {
            console.warn(`Module "${moduleName}" already exists in project "${project.name}"`);
            set({ isLoading: false, error: `Le module "${moduleName}" existe déjà dans ce projet` });
            return;
          }

          // Récupérer la couleur du template
          const templates = useModuleTemplatesStore.getState().templates;
          const colorTemplate = templates.find(t => t.name === moduleName);
          const moduleColor = colorTemplate?.color;
          

          // Create group in Monday.com
          let groupResult;
          try {
            groupResult = await mondayApi.createGroup(
              project.mondayBoardId,
              moduleName,
              moduleColor
            );
          } catch (error) {
            console.warn('Cannot create group on this board, creating items directly:', error);
            // If we can't create groups, we'll create items without a group
            groupResult = { create_group: { id: null } };
          }

          // Get default tasks for this module
          const defaultTasks = getDefaultTasksForModule(moduleName);
          const createdTasks: Task[] = [];
          
          // Create tasks in Monday.com
          for (const task of defaultTasks) {
            try {
              const itemResult = await mondayApi.createItem(
                project.mondayBoardId,
                groupResult.create_group?.id || null, // Use null if no group
                task.name,
                {},
                task.dueDate
              );
              
              const createdTask = {
                id: itemResult.create_item.id,
                name: task.name,
                itemId: itemResult.create_item.id,
                mondayItemId: itemResult.create_item.id,
                status: 'todo' as TaskStatus,
                dueDate: task.dueDate,
                subTasks: [] as SubTask[]
              };

              createdTasks.push(createdTask);
            } catch (error) {
              console.error('Error creating task:', error);
              // Add task locally even if Monday.com creation fails
              const createdTask = {
                id: `temp_${Date.now()}_${Math.random()}`,
                name: task.name,
                itemId: `temp_${Date.now()}_${Math.random()}`,
                mondayItemId: null,
                status: 'todo' as TaskStatus,
                subTasks: []
              };
              createdTasks.push(createdTask);
            }
          }

          // Get team from template
          const teamTemplate = useModuleTemplatesStore.getState().templates.find(t => t.name === moduleName);
          const moduleTeam = teamTemplate?.team || 'Infrastructure';

          const newModule: Module = {
            id: groupResult.create_group?.id || `temp_${Date.now()}_${Math.random()}`,
            name: moduleName,
            type: 'Infrastructure' as ModuleType, // Default type
            team: moduleTeam,
            mondayGroupId: groupResult.create_group?.id || null,
            tasks: createdTasks,
            color: moduleColor || '#3B82F6',
            status: 'not_started' as ModuleStatus,
            assignedPerson: '',
          };

          // Update UI immediately with optimistic update
          set((state) => {
            const updatedProjects = state.projects.map(p =>
              p.id === projectId
                ? { ...p, modules: [...p.modules, newModule] }
                : p
            );
            
            return {
              projects: updatedProjects,
              // Update cache immediately for instant navigation
              projectsCache: updatedProjects,
              lastCacheUpdate: Date.now(),
              isLoading: false,
              error: null
            };
          });

          // Trigger background sync to Monday.com after UI update
          setTimeout(() => {
            get().refreshProjectsInBackground();
          }, 1000);
        } catch (error) {
          console.error('Error adding module:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add module',
            isLoading: false 
          });
          throw error;
        }
      },

      // Remove module from project
      removeModuleFromProject: async (projectId: string, moduleId: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const project = get().projects.find(p => p.id === projectId);
          if (!project) {
            throw new Error('Project not found');
          }

          const module = project.modules.find(m => m.id === moduleId);
          if (!module) {
            throw new Error('Module not found');
          }

          // Delete group from Monday.com
          await mondayApi.deleteGroup(project.mondayBoardId, module.mondayGroupId);

          // Update UI immediately with optimistic update
          set((state) => {
            const updatedProjects = state.projects.map(p =>
              p.id === projectId
                ? { ...p, modules: p.modules.filter(m => m.id !== moduleId) }
                : p
            );
            
            return {
              projects: updatedProjects,
              // Update cache immediately for instant navigation
              projectsCache: updatedProjects,
              lastCacheUpdate: Date.now(),
              isLoading: false
            };
          });

          // Trigger background sync to Monday.com after UI update
          setTimeout(() => {
            get().refreshProjectsInBackground();
          }, 1000);
        } catch (error) {
          console.error('Error removing module:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to remove module',
            isLoading: false 
          });
          throw error;
        }
      },

      // Update module in project
      updateModuleInProject: async (projectId: string, moduleId: string, updates: Partial<Module>) => {
        try {
          set({ isLoading: true, error: null });
          
          const project = get().projects.find(p => p.id === projectId);
          if (!project) {
            throw new Error('Project not found');
          }

          const module = project.modules.find(m => m.id === moduleId);
          if (!module) {
            throw new Error('Module not found');
          }

          // Update module in Monday.com if needed
          if (updates.tasks) {
            // For now, we'll just update locally
            // Future: Implement Monday.com task creation/deletion
          }

          set((state) => ({
            projects: state.projects.map(p =>
              p.id === projectId
                ? {
                    ...p,
                    modules: p.modules.map(m =>
                      m.id === moduleId
                        ? { ...m, ...updates }
                        : m
                    )
                  }
                : p
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Error updating module:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update module',
            isLoading: false 
          });
          throw error;
        }
      },

      // Refresh project data from Monday.com
      refreshProject: async (projectId: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const project = get().projects.find(p => p.id === projectId);
          if (!project) {
            throw new Error('Project not found');
          }

          // Get updated board data from Monday.com
          const result = await mondayApi.getBoard(project.mondayBoardId);
          const board = result.boards[0];

          const updatedProject: Project = {
            ...project,
            name: board.name,
            description: board.description || '',
            modules: board.groups.map((group: any) => {
              // Get module color and team from templates
              const template = useModuleTemplatesStore.getState().templates.find(t => t.name === group.title);
              const moduleColor = template ? template.color : '#3B82F6';
              const moduleTeam = template?.team || 'Infrastructure';
              
              return {
                id: group.id,
                name: group.title,
                type: 'Infrastructure' as ModuleType, // Default type
                team: moduleTeam,
                mondayGroupId: group.id,
                tasks: (group.items_page?.items || []).map((item: any) => {
                  // Extract status from column values
                  const statusColumn = item.column_values?.find((col: any) => 
                    col.type === 'status' || col.id.includes('status')
                  );
                  const statusText = statusColumn?.text || 'Not Started';
                  
                  // Map Monday.com status to our TaskStatus
                  let taskStatus: TaskStatus = 'todo';
                  if (statusText.toLowerCase().includes('done') || statusText.toLowerCase().includes('completed') || statusText.toLowerCase().includes('réalisé')) {
                    taskStatus = 'done';
                  } else if (statusText.toLowerCase().includes('progress') || statusText.toLowerCase().includes('cours') || statusText.toLowerCase().includes('en cours')) {
                    taskStatus = 'in_progress';
                  }
                  
                  return {
                    id: item.id,
                    name: item.name,
                    itemId: item.id,
                    mondayItemId: item.id,
                    status: taskStatus,
                  };
                }),
                color: moduleColor || '#3B82F6',
                status: 'not_started' as ModuleStatus,
                assignedPerson: '',
              };
            }),
            updatedAt: new Date().toISOString(),
          };

          set((state) => ({
            projects: state.projects.map(p =>
              p.id === projectId ? updatedProject : p
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Error refreshing project:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to refresh project',
            isLoading: false 
          });
          throw error;
        }
      },

        // Archive project
        archiveProject: async (projectId: string, mondayBoardId?: string) => {
          try {
            set({ isLoading: true, error: null });
            
            // Use provided mondayBoardId or find project in store
            let boardId = mondayBoardId;
            if (!boardId) {
              const project = get().projects.find(p => p.id === projectId);
              if (!project) {
                throw new Error('Project not found');
              }
              boardId = project.mondayBoardId;
            }

            // Archive board in Monday.com
            await mondayApi.archiveBoard(boardId);

            // Invalidate cache to ensure fresh data on next load
            set((state) => ({
              projectsCache: null,
              lastCacheUpdate: null,
              isLoading: false
            }));

            // Force reload projects to reflect the archive
            await get().loadProjectsFromMonday(false);
        } catch (error) {
          console.error('Error archiving project:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to archive project',
            isLoading: false 
          });
          throw error;
        }
      },

      // Add sub-task to task
      addSubTaskToTask: async (projectId: string, moduleId: string, taskId: string, subTask) => {
        try {
          set({ isLoading: true, error: null });
          
          const state = get();
          const project = state.projects.find(p => p.id === projectId);
          if (!project) {
            throw new Error('Projet introuvable');
          }

          const module = project.modules.find(m => m.id === moduleId);
          if (!module) {
            throw new Error('Module introuvable');
          }

          const task = module.tasks.find(t => t.id === taskId);
          if (!task) {
            throw new Error('Tâche introuvable');
          }

          // Create new sub-task with ID
          const newSubTask = {
            ...subTask,
            id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            mondaySubItemId: null
          };

          // Update local state
          const updatedProjects = state.projects.map(p => {
            if (p.id === projectId) {
              return {
                ...p,
                modules: p.modules.map(m => {
                  if (m.id === moduleId) {
                    return {
                      ...m,
                      tasks: m.tasks.map(t => {
                        if (t.id === taskId) {
                          return {
                            ...t,
                            subTasks: [...(t.subTasks || []), newSubTask]
                          };
                        }
                        return t;
                      })
                    };
                  }
                  return m;
                })
              };
            }
            return p;
          });

          set({ projects: updatedProjects });

          // Create sub-item in Monday.com
          try {
            console.log('🚀 Attempting to create sub-item in Monday.com:', {
              taskId: task.id,
              taskName: task.name,
              mondayItemId: task.mondayItemId,
              subTaskName: newSubTask.name
            });

            const result = await mondayApi.createSubItem(
              task.mondayItemId || '',
              newSubTask.name,
              newSubTask.status,
              newSubTask.assignedPerson,
              newSubTask.dueDate
            );

            // Update the sub-task with Monday.com ID
            const updatedProjectsWithMondayId = updatedProjects.map(p => {
              if (p.id === projectId) {
                return {
                  ...p,
                  modules: p.modules.map(m => {
                    if (m.id === moduleId) {
                      return {
                        ...m,
                        tasks: m.tasks.map(t => {
                          if (t.id === taskId) {
                            return {
                              ...t,
                              subTasks: t.subTasks.map(st => {
                                if (st.id === newSubTask.id) {
                                  return { ...st, mondaySubItemId: result.create_subitem.id };
                                }
                                return st;
                              })
                            };
                          }
                          return t;
                        })
                      };
                    }
                    return m;
                  })
                };
              }
              return p;
            });

            set({ projects: updatedProjectsWithMondayId });
          } catch (mondayError) {
            console.error('Error creating sub-item in Monday.com:', mondayError);
            // Continue without Monday.com integration for now
          }

          set({ isLoading: false });
        } catch (error) {
          console.error('Error adding sub-task:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout de la sous-tâche',
            isLoading: false 
          });
          throw error;
        }
      },

      // Update sub-task in task
      updateSubTaskInTask: async (projectId: string, moduleId: string, taskId: string, subTaskId: string, updates) => {
        try {
          set({ isLoading: true, error: null });
          
          const state = get();
          const project = state.projects.find(p => p.id === projectId);
          if (!project) {
            throw new Error('Projet introuvable');
          }

          const module = project.modules.find(m => m.id === moduleId);
          if (!module) {
            throw new Error('Module introuvable');
          }

          const task = module.tasks.find(t => t.id === taskId);
          if (!task) {
            throw new Error('Tâche introuvable');
          }

          // Update local state
          const updatedProjects = state.projects.map(p => {
            if (p.id === projectId) {
              return {
                ...p,
                modules: p.modules.map(m => {
                  if (m.id === moduleId) {
                    return {
                      ...m,
                      tasks: m.tasks.map(t => {
                        if (t.id === taskId) {
                          return {
                            ...t,
                            subTasks: (t.subTasks || []).map(st => {
                              if (st.id === subTaskId) {
                                return { ...st, ...updates };
                              }
                              return st;
                            })
                          };
                        }
                        return t;
                      })
                    };
                  }
                  return m;
                })
              };
            }
            return p;
          });

          set({ projects: updatedProjects });

          // Update sub-item in Monday.com
          try {
            const subTask = task.subTasks?.find(st => st.id === subTaskId);
            if (subTask?.mondaySubItemId) {
              await mondayApi.updateSubItem(
                subTask.mondaySubItemId,
                updates.name
              );
            }
          } catch (mondayError) {
            console.error('Error updating sub-item in Monday.com:', mondayError);
            // Continue without Monday.com integration for now
          }

          set({ isLoading: false });
        } catch (error) {
          console.error('Error updating sub-task:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la sous-tâche',
            isLoading: false 
          });
          throw error;
        }
      },

      // Remove sub-task from task
      removeSubTaskFromTask: async (projectId: string, moduleId: string, taskId: string, subTaskId: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const state = get();
          const project = state.projects.find(p => p.id === projectId);
          if (!project) {
            throw new Error('Projet introuvable');
          }

          const module = project.modules.find(m => m.id === moduleId);
          if (!module) {
            throw new Error('Module introuvable');
          }

          const task = module.tasks.find(t => t.id === taskId);
          if (!task) {
            throw new Error('Tâche introuvable');
          }

          // Update local state
          const updatedProjects = state.projects.map(p => {
            if (p.id === projectId) {
              return {
                ...p,
                modules: p.modules.map(m => {
                  if (m.id === moduleId) {
                    return {
                      ...m,
                      tasks: m.tasks.map(t => {
                        if (t.id === taskId) {
                          return {
                            ...t,
                            subTasks: (t.subTasks || []).filter(st => st.id !== subTaskId)
                          };
                        }
                        return t;
                      })
                    };
                  }
                  return m;
                })
              };
            }
            return p;
          });

          set({ projects: updatedProjects });

          // Delete sub-item from Monday.com
          try {
            const subTask = task.subTasks?.find(st => st.id === subTaskId);
            if (subTask?.mondaySubItemId) {
              await mondayApi.deleteSubItem(subTask.mondaySubItemId);
            }
          } catch (mondayError) {
            console.error('Error deleting sub-item from Monday.com:', mondayError);
            // Continue without Monday.com integration for now
          }

          set({ isLoading: false });
        } catch (error) {
          console.error('Error removing sub-task:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la sous-tâche',
            isLoading: false 
          });
          throw error;
        }
      },

      // Start auto sync
      startAutoSync: () => {
        const state = get();
        if (state.syncInterval) {
          clearInterval(state.syncInterval);
        }
        
        const interval = setInterval(() => {
          state.refreshProjectsInBackground();
        }, 5 * 60 * 1000); // 5 minutes
        
        set({ syncInterval: interval });
      },

      // Stop auto sync
      stopAutoSync: () => {
        const state = get();
        if (state.syncInterval) {
          clearInterval(state.syncInterval);
          set({ syncInterval: null });
        }
      },

      // Manual sync
      manualSync: async () => {
        try {
          await get().loadProjectsFromMonday(false);
        } catch (error) {
          console.error('Manual sync failed:', error);
          throw error;
        }
      },
    }),
    {
      name: 'monday-app-storage',
      partialize: (state) => ({
        projects: state.projects,
        projectsCache: state.projectsCache,
        lastCacheUpdate: state.lastCacheUpdate,
        theme: state.theme,
      }),
    }
  )
);