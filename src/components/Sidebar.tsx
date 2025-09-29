import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  PlusIcon,
  DocumentDuplicateIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const location = useLocation();

  const navigation = [
    { name: 'Tableau de bord', href: '/', icon: HomeIcon },
    { name: 'Nouveau Projet', href: '/create-project', icon: PlusIcon },
    { name: 'Modèles de modules', href: '/module-templates', icon: DocumentDuplicateIcon },
    { name: 'Administration', href: '/administration', icon: UserGroupIcon },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 h-full">
      <div className="p-4 h-full flex flex-col">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-monday-100 dark:bg-monday-900 text-monday-700 dark:text-monday-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

