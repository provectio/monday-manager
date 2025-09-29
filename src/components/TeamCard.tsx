import { motion } from 'framer-motion';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Team } from '../types';
import { ModuleTemplate } from '../store/useModuleTemplatesStore';

interface TeamCardProps {
  team: Team;
  templates: ModuleTemplate[];
  selectedModules: string[];
  onToggleModule: (templateId: string) => void;
  loading?: boolean;
}

export default function TeamCard({ 
  team, 
  templates, 
  selectedModules, 
  onToggleModule,
  loading = false 
}: TeamCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const teamTemplates = templates.filter(t => t.team === team.name);

  if (teamTemplates.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Team Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{team.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {team.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {team.description}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {teamTemplates.length} module(s) disponible(s)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selectedModules.filter(id => teamTemplates.some(t => t.id === id)).length} sélectionné(s)
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
          <div className="p-4 space-y-3">
            {teamTemplates.map((template) => (
              <motion.button
                key={template.id}
                onClick={() => onToggleModule(template.id)}
                disabled={loading}
                className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedModules.includes(template.id)
                    ? 'border-monday-500 bg-monday-50 dark:bg-monday-900'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{template.icon}</span>
                  <div className="flex-1">
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
                  {selectedModules.includes(template.id) && (
                    <div className="w-6 h-6 bg-monday-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
