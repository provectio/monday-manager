import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Team, TeamType } from '../types';

interface TeamsStore {
  teams: Team[];
  addTeam: (team: Omit<Team, 'id'>) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  resetTeams: () => void;
}

const DEFAULT_TEAMS: Team[] = [
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    description: 'Gestion des infrastructures IT, serveurs, réseaux et équipements',
    color: '#579bfc',
    icon: '🏗️'
  },
  {
    id: 'cybersecurite',
    name: 'Cybersécurité',
    description: 'Sécurité informatique, protection des données et conformité',
    color: '#e2445c',
    icon: '🔒'
  },
  {
    id: 'telecom',
    name: 'Télécom',
    description: 'Télécommunications, connectivité et services de communication',
    color: '#00c875',
    icon: '📡'
  },
  {
    id: 'cloud',
    name: 'Cloud',
    description: 'Services cloud, virtualisation et solutions hébergées',
    color: '#784bd1',
    icon: '☁️'
  },
  {
    id: 'infogerance',
    name: 'Infogérance',
    description: 'Gestion et maintenance des systèmes informatiques',
    color: '#ff642e',
    icon: '⚙️'
  },
  {
    id: 'conformite-qualite',
    name: 'Conformité & Qualité',
    description: 'Conformité réglementaire, normes et assurance qualité',
    color: '#9c27b0',
    icon: '📋'
  },
  {
    id: 'gouvernance',
    name: 'Gouvernance',
    description: 'Gouvernance IT, stratégie et pilotage des projets',
    color: '#607d8b',
    icon: '🎯'
  }
];

export const useTeamsStore = create<TeamsStore>()(
  persist(
    (set, get) => ({
      teams: DEFAULT_TEAMS,

      addTeam: (team) => {
        const newTeam: Team = {
          ...team,
          id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        set((state) => ({
          teams: [...state.teams, newTeam],
        }));
      },

      updateTeam: (id, updates) => {
        set((state) => ({
          teams: state.teams.map((team) =>
            team.id === id ? { ...team, ...updates } : team
          ),
        }));
      },

      deleteTeam: (id) => {
        set((state) => ({
          teams: state.teams.filter((team) => team.id !== id),
        }));
      },

      resetTeams: () => {
        set({ teams: DEFAULT_TEAMS });
      }
    }),
    {
      name: 'teams-storage',
      getStorage: () => localStorage,
    }
  )
);
