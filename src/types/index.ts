export interface Project {
  id: string;
  name: string;
  salesforceNumber: string;
  boardId: string;
  mondayBoardId: string;
  description: string;
  modules: Module[];
  status: ProjectStatus;
  progress: number; // Progress percentage (0-100)
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'syncing' | 'synced' | 'error';
  syncError?: string;
}

export interface Module {
  id: string;
  name: string;
  type: ModuleType;
  team: TeamType;
  mondayGroupId: string;
  tasks: Task[];
  color: string;
  status: ModuleStatus;
  assignedPerson: string;
}

export interface Task {
  id: string;
  name: string;
  itemId: string;
  mondayItemId: string | null;
  status: TaskStatus;
  description?: string;
  dueDate?: string;
  subTasks: SubTask[];
}

export interface SubTask {
  id: string;
  name: string;
  mondaySubItemId: string | null;
  status: TaskStatus;
  assignedPerson: string;
  dueDate?: string;
}

export type ModuleType = 'Infrastructure' | 'Telecom' | 'Cloud' | 'Cybersécurité' | 'Infogérance' | 'Conformité';

export type TeamType = 'Infrastructure' | 'Cybersécurité' | 'Télécom' | 'Cloud' | 'Infogérance' | 'Conformité & Qualité' | 'Gouvernance';

export interface Team {
  id: string;
  name: TeamType;
  description: string;
  color: string;
  icon: string;
}

export type ModuleStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type ProjectStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'archived';

export interface ApiStatus {
  isConnected: boolean;
  lastChecked: string;
  error?: string;
}

export interface Theme {
  mode: 'light' | 'dark';
}

export interface AppState {
  projects: Project[];
  apiStatus: ApiStatus;
  theme: Theme;
  isLoading: boolean;
  error?: string;
}

