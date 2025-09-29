import { useState } from 'react';
import { motion } from 'framer-motion';
import { TagIcon, CheckIcon } from '@heroicons/react/24/outline';
import { TeamType } from '../types';
import { useTeamsStore } from '../store/useTeamsStore';

interface TeamSelectorProps {
  selectedTeam: TeamType | null;
  onTeamSelect: (team: TeamType | null) => void;
  showAllOption?: boolean;
  className?: string;
  selectedModules?: string[];
  templates?: any[];
}

export default function TeamSelector({ 
  selectedTeam, 
  onTeamSelect, 
  showAllOption = true,
  className = "",
  selectedModules = [],
  templates = []
}: TeamSelectorProps) {
  const { teams } = useTeamsStore();

  const getSelectedCountForTeam = (teamName: TeamType) => {
    if (!templates.length) return 0;
    const teamTemplates = templates.filter(t => t.team === teamName);
    return selectedModules.filter(id => teamTemplates.some(t => t.id === id)).length;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Filtrer par équipe
      </label>
      <div className="flex flex-wrap gap-2">
        {showAllOption && (
          <button
            onClick={() => onTeamSelect(null)}
            className={`px-3 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${
              selectedTeam === null
                ? 'bg-monday-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <span>🏢</span>
            <span>Toutes les équipes</span>
            {selectedTeam === null && <CheckIcon className="w-4 h-4" />}
          </button>
        )}
        {teams.map((team) => {
          const selectedCount = getSelectedCountForTeam(team.name);
          return (
            <motion.button
              key={team.id}
              onClick={() => onTeamSelect(team.name)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${
                selectedTeam === team.name
                  ? 'bg-monday-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>{team.icon}</span>
              <span>{team.name}</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                selectedCount > 0 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white bg-opacity-20 text-white'
              }`}>
                {selectedCount}
              </span>
              {selectedTeam === team.name && <CheckIcon className="w-4 h-4" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
