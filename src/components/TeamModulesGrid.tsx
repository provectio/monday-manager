import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ModuleTemplate } from '../store/useModuleTemplatesStore';
import { TeamType } from '../types';
import { useTeamsStore } from '../store/useTeamsStore';

interface TeamModulesGridProps {
  templates: ModuleTemplate[];
  selectedModules: string[];
  onToggleModule: (templateId: string) => void;
  selectedTeam: TeamType | null;
  loading?: boolean;
}

export default function TeamModulesGrid({ 
  templates, 
  selectedModules, 
  onToggleModule, 
  selectedTeam,
  loading = false 
}: TeamModulesGridProps) {
  const { teams } = useTeamsStore();
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  // Group templates by team
  const templatesByTeam = templates.reduce((acc, template) => {
    if (!acc[template.team]) {
      acc[template.team] = [];
    }
    acc[template.team].push(template);
    return acc;
  }, {} as Record<TeamType, ModuleTemplate[]>);

  const toggleTeamExpansion = (teamName: string) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamName)) {
        newSet.delete(teamName);
      } else {
        newSet.add(teamName);
      }
      return newSet;
    });
  };

  // If a specific team is selected, only show that team's modules
  const teamsToShow = selectedTeam ? [selectedTeam] : Object.keys(templatesByTeam) as TeamType[];

  return (
    <div className="space-y-4">
      {teamsToShow.map((teamName) => {
        const team = teams.find(t => t.name === teamName);
        const teamTemplates = templatesByTeam[teamName] || [];
        const isExpanded = expandedTeams.has(teamName);
        
        if (teamTemplates.length === 0) return null;

        // Si une team spécifique est sélectionnée, afficher directement les modules sans le bandeau
        if (selectedTeam) {
          return (
            <div key={teamName} className="space-y-2">
              {teamTemplates.map((template) => (
                <motion.button
                  key={template.id}
                  onClick={() => onToggleModule(template.id)}
                  disabled={loading}
                  className={`w-full p-3 rounded-lg border transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between ${
                    selectedModules.includes(template.id)
                      ? 'border-monday-500 bg-monday-50 dark:bg-monday-900'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{template.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {template.description}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {template.tasks.length} tâche(s)
                      </p>
                    </div>
                  </div>
                  {selectedModules.includes(template.id) && (
                    <div className="w-6 h-6 bg-monday-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          );
        }

        // Affichage normal avec bandeau pour la vue "Toutes les équipes"
        return (
          <motion.div
            key={teamName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Team Header */}
            <button
              onClick={() => toggleTeamExpansion(teamName)}
              className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{team?.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {teamName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {team?.description}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {teamTemplates.length} module(s) disponible(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-monday-500 text-white">
                    {selectedModules.filter(id => teamTemplates.some(t => t.id === id)).length}
                  </span>
                  {isExpanded ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </button>

            {/* Team Modules */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-200 dark:border-gray-700"
              >
                <div className="p-4">
                  <div className="space-y-2">
                    {teamTemplates.map((template) => (
                      <motion.button
                        key={template.id}
                        onClick={() => onToggleModule(template.id)}
                        disabled={loading}
                        className={`w-full p-3 rounded-lg border transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between ${
                          selectedModules.includes(template.id)
                            ? 'border-monday-500 bg-monday-50 dark:bg-monday-900'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{template.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {template.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {template.description}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {template.tasks.length} tâche(s)
                            </p>
                          </div>
                        </div>
                        {selectedModules.includes(template.id) && (
                          <div className="w-6 h-6 bg-monday-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}