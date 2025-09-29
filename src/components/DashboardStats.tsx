import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { 
  DocumentTextIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline';

export default function DashboardStats() {
  const { projects } = useAppStore();

  // Calculer les statistiques
  const totalProjects = projects.length;
  
  // Calculer le nombre total de tâches dans tous les projets
  const totalTasks = projects.reduce((acc, project) => {
    return acc + project.modules.reduce((moduleAcc, module) => {
      return moduleAcc + module.tasks.length;
    }, 0);
  }, 0);

  // Calculer le nombre de modules actifs (modules avec au moins une tâche)
  const activeModules = projects.reduce((acc, project) => {
    return acc + project.modules.filter(module => module.tasks.length > 0).length;
  }, 0);

  const stats = [
    {
      id: 'projects',
      name: 'Projets',
      value: totalProjects,
      icon: ChartBarIcon,
      color: 'bg-purple-100 text-purple-600',
      iconColor: 'text-purple-600'
    },
    {
      id: 'tasks',
      name: 'Tâches',
      value: totalTasks,
      icon: DocumentTextIcon,
      color: 'bg-orange-100 text-orange-600',
      iconColor: 'text-orange-600'
    },
    {
      id: 'modules',
      name: 'Modules actifs',
      value: activeModules,
      icon: ChartBarIcon,
      color: 'bg-indigo-100 text-indigo-600',
      iconColor: 'text-indigo-600'
    }
  ];

  return (
    <div className="flex flex-wrap gap-4 mb-8 justify-center">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 w-64"
        >
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.name}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
