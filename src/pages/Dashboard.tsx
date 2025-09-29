import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PlusIcon, 
  FolderIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  Bars3Icon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '../store/useAppStore';
import { Project } from '../types';

export default function Dashboard() {
  const { projects, loadProjectsFromMonday, isLoading, isRefreshing, setError, startAutoSync } = useAppStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'date_desc' | 'date_asc' | 'progress_desc' | 'progress_asc'>('date_desc');
  const [showSortOptions, setShowSortOptions] = useState(false);

  useEffect(() => {
    // Load projects with cache (useCache = true by default)
    loadProjects();
    // Start auto-sync when component mounts
    startAutoSync();
    
    // Cleanup auto-sync when component unmounts
    return () => {
      useAppStore.getState().stopAutoSync();
    };
  }, []);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSortOptions) {
        setShowSortOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSortOptions]);

  const loadProjects = async () => {
    try {
      // Use cache by default (useCache = true)
      await loadProjectsFromMonday(true);
    } catch (error) {
      setError('Erreur lors du chargement des projets');
      console.error('Error loading projects:', error);
    }
  };


  const getModuleCount = useCallback((project: Project) => project.modules.length, []);
  const getTaskCount = useCallback((project: Project) => 
    project.modules.reduce((total, module) => total + module.tasks.length, 0), []);

  // Filter and sort projects - memoized for performance
  const filteredProjects = useMemo(() => {
    const filtered = projects
      .filter(project => !project.name.includes('Sous-éléments de')) // Filter out sub-item boards
      .filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.salesforceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Sort based on selected criteria
    const sorted = filtered.sort((a, b) => {
      let comparison = 0;
      
            switch (sortBy) {
              case 'name_asc':
                comparison = a.name.localeCompare(b.name);
                break;
              case 'name_desc':
                comparison = b.name.localeCompare(a.name);
                break;
        case 'date_desc':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'date_asc':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'progress_desc':
          comparison = (b.progress || 0) - (a.progress || 0);
          break;
        case 'progress_asc':
          comparison = (a.progress || 0) - (b.progress || 0);
          break;
        default:
          comparison = 0;
      }
      
      return comparison;
    });
    
    return sorted;
  }, [projects, searchTerm, sortBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-monday-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérez vos projets Monday.com
          </p>
        </div>
        
                 <div className="flex items-center space-x-6">
                   {/* Stats avec bulles */}
                   <div className="flex items-center space-x-4">
                     <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-600">
                       <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                       <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{projects.length}</span>
                       <span className="text-xs text-gray-600 dark:text-gray-400">projets</span>
                     </div>
                     
                     <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-600">
                       <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                       <span className="text-sm font-bold text-green-600 dark:text-green-400">
                         {projects.reduce((acc, project) => {
                           return acc + project.modules.reduce((moduleAcc, module) => {
                             return moduleAcc + module.tasks.length;
                           }, 0);
                         }, 0)}
                       </span>
                       <span className="text-xs text-gray-600 dark:text-gray-400">tâches</span>
                     </div>
                     
                     <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-600">
                       <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                       <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                         {projects.reduce((acc, project) => {
                           return acc + project.modules.filter(module => module.tasks.length > 0).length;
                         }, 0)}
                       </span>
                       <span className="text-xs text-gray-600 dark:text-gray-400">modules</span>
                     </div>
                   </div>

                   {/* Cache Status */}
                   <div className="flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-500">
                     <div className={`w-2 h-2 rounded-full ${
                       isRefreshing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
                     }`}></div>
                     <span>{isRefreshing ? 'Sync en cours...' : 'Cache actif'}</span>
                     </div>
                   
                   {/* View Mode Toggle */}
                   <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                     <button
                       onClick={() => setViewMode('grid')}
                       className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                         viewMode === 'grid'
                           ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                           : 'text-gray-600 dark:text-gray-400'
                       }`}
                     >
                       Grille
                     </button>
                     <button
                       onClick={() => setViewMode('list')}
                       className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                         viewMode === 'list'
                           ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                           : 'text-gray-600 dark:text-gray-400'
                       }`}
                     >
                       Liste
                     </button>
                   </div>
                 </div>
      </div>

      {/* Combined Search, Stats and Sort Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex items-center space-x-6">
      {/* Search Bar */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
              placeholder="Rechercher un projet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-monday-500 focus:border-transparent"
            />
          </div>


          {/* Sort Bar */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Trier par:
            </span>
            
            {/* Sort by dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortOptions(!showSortOptions)}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <Bars3Icon className="w-4 h-4" />
                <span className="text-sm">
                  {sortBy === 'name_asc' ? 'Nom (A → Z)' : 
                   sortBy === 'name_desc' ? 'Nom (Z → A)' :
                   sortBy === 'date_desc' ? 'Date (décroissant)' :
                   sortBy === 'date_asc' ? 'Date (croissant)' :
                   sortBy === 'progress_desc' ? 'Progrès (décroissant)' :
                   sortBy === 'progress_asc' ? 'Progrès (croissant)' : 'Date (décroissant)'}
                </span>
                <ChevronDownIcon className="w-4 h-4" />
              </button>
              
              {showSortOptions && (
                <div 
                  className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-700 border-2 border-orange-200 dark:border-gray-600 rounded-xl shadow-xl z-10"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className="py-2">
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSortBy('name_asc');
                        setShowSortOptions(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors duration-200 ${
                        sortBy === 'name_asc' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Nom (A → Z)
                    </button>
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSortBy('name_desc');
                        setShowSortOptions(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors duration-200 ${
                        sortBy === 'name_desc' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Nom (Z → A)
                    </button>
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSortBy('date_desc');
                        setShowSortOptions(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-green-50 dark:hover:bg-gray-600 transition-colors duration-200 ${
                        sortBy === 'date_desc' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-semibold' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Date (décroissant)
                    </button>
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSortBy('date_asc');
                        setShowSortOptions(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-green-50 dark:hover:bg-gray-600 transition-colors duration-200 ${
                        sortBy === 'date_asc' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-semibold' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Date (croissant)
                    </button>
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSortBy('progress_desc');
                        setShowSortOptions(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors duration-200 ${
                        sortBy === 'progress_desc' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Progrès (décroissant)
                    </button>
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSortBy('progress_asc');
                        setShowSortOptions(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors duration-200 ${
                        sortBy === 'progress_asc' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Progrès (croissant)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{filteredProjects.length} projet{filteredProjects.length !== 1 ? 's' : ''}</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {sortBy === 'name_asc' ? 'A-Z' : 
                 sortBy === 'name_desc' ? 'Z-A' :
                 sortBy === 'date_desc' ? 'Date ↓' :
                 sortBy === 'date_asc' ? 'Date ↑' :
                 sortBy === 'progress_desc' ? 'Progrès ↓' :
                 sortBy === 'progress_asc' ? 'Progrès ↑' : 'Date ↓'}
              </span>
          </div>
        </div>
      </div>


      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {searchTerm ? 'Aucun projet trouvé' : 'Aucun projet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm 
              ? `Aucun projet ne correspond à "${searchTerm}". Essayez un autre terme de recherche.`
              : 'Commencez par créer votre premier projet.'
            }
          </p>
          <div className="mt-6">
            <Link
              to="/create-project"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Créer un projet</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={viewMode === 'grid' ? 'card p-6' : 'card p-4'}
            >
              {viewMode === 'grid' ? (
                         <div className="space-y-4">
                           <div className="flex items-start justify-between">
                             <div>
                               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                 {project.name}
                               </h3>
                               <div className="mt-1">
                                 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                   En cours
                                 </span>
                               </div>
                             </div>
                             
                             {/* Circular Progress Indicator */}
                             <div className="relative">
                               <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
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
                                 <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                   {project.progress}%
                                 </span>
                               </div>
                             </div>
                           </div>

                           <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                             <div className="flex items-center space-x-1">
                               <FolderIcon className="w-4 h-4" />
                               <span>{getModuleCount(project)} modules</span>
                             </div>
                             <div className="flex items-center space-x-1">
                               <CheckCircleIcon className="w-4 h-4" />
                               <span>{getTaskCount(project)} tâches</span>
                             </div>
                             {/* Sync Status Indicator */}
                             {project.syncStatus === 'syncing' && (
                               <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                                 <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                 <span className="text-xs">Sync...</span>
                               </div>
                             )}
                             {project.syncStatus === 'error' && (
                               <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                                 <ExclamationTriangleIcon className="w-4 h-4" />
                                 <span className="text-xs">Erreur</span>
                               </div>
                             )}
                           </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Créé le {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    <Link
                      to={`/project/${project.id}/settings`}
                      className="text-sm text-monday-600 dark:text-monday-400 hover:text-monday-700 dark:hover:text-monday-300 font-medium"
                    >
                      Gérer →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-monday-100 dark:bg-monday-900 rounded-lg flex items-center justify-center">
                      <FolderIcon className="w-6 h-6 text-monday-600 dark:text-monday-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {project.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getModuleCount(project)} modules • {getTaskCount(project)} tâches
                      </p>
                        {/* Sync Status Indicator for list view */}
                        {project.syncStatus === 'syncing' && (
                          <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                            <ArrowPathIcon className="w-3 h-3 animate-spin" />
                            <span className="text-xs">Sync...</span>
                          </div>
                        )}
                        {project.syncStatus === 'error' && (
                          <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                            <ExclamationTriangleIcon className="w-3 h-3" />
                            <span className="text-xs">Erreur</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/project/${project.id}/settings`}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <Cog6ToothIcon className="w-5 h-5" />
                  </Link>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
