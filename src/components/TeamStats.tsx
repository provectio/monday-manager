import { motion } from 'framer-motion';
import { 
  UserGroupIcon, 
  ChartBarIcon, 
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useTeamsStore } from '../store/useTeamsStore';
import { useModuleTemplatesStore } from '../store/useModuleTemplatesStore';
import { useAppStore } from '../store/useAppStore';

export default function TeamStats() {
  const { teams } = useTeamsStore();
  const { templates } = useModuleTemplatesStore();
  const { projects } = useAppStore();

  // Calculate statistics
  const totalModules = projects.reduce((acc, project) => acc + project.modules.length, 0);
  const modulesByTeam = teams.map(team => {
    const teamTemplates = templates.filter(t => t.team === team.name);
    const teamModules = projects.reduce((acc, project) => {
      return acc + project.modules.filter(module => {
        const template = templates.find(t => t.name === module.name);
        return template?.team === team.name;
      }).length;
    }, 0);
    
    return {
      team,
      templateCount: teamTemplates.length,
      moduleCount: teamModules,
      percentage: totalModules > 0 ? Math.round((teamModules / totalModules) * 100) : 0
    };
  });

  const totalTemplates = templates.length;
  const totalProjects = projects.length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Équipes</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{teams.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Templates</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalTemplates}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Modules actifs</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalModules}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Team Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Statistiques par équipe
        </h3>
        
        <div className="space-y-4">
          {modulesByTeam.map(({ team, templateCount, moduleCount, percentage }) => (
            <div key={team.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{team.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{team.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{team.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Templates</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{templateCount}</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Modules</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{moduleCount}</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Part</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{percentage}%</p>
                </div>
                
                <div className="w-24">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        backgroundColor: team.color,
                        width: `${percentage}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Project Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Répartition des projets
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-900 dark:text-blue-100">Projets actifs</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-2">{totalProjects}</p>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-900 dark:text-green-100">Modules totaux</span>
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-2">{totalModules}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
