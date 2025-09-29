import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { SubTask } from '../types';

// Composant sortable pour les sous-tâches
function SortableSubTaskItem({ 
  subTask, 
  index, 
  onUpdateSubTask, 
  onDeleteSubTask 
}: {
  subTask: SubTask;
  index: number;
  onUpdateSubTask: (subTaskId: string, field: keyof SubTask, value: any) => void;
  onDeleteSubTask: (subTaskId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subTask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-white dark:bg-gray-800 border rounded-lg p-4 ${
        isDragging 
          ? 'border-blue-300 dark:border-blue-600 shadow-lg' 
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <div 
          {...attributes}
          {...listeners}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab mr-2"
        >
          <Bars3Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={subTask.name}
            onChange={(e) => onUpdateSubTask(subTask.id, 'name', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nom de la sous-tâche"
          />
        </div>
        <button
          onClick={() => onDeleteSubTask(subTask.id)}
          className="ml-3 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          title="Supprimer la sous-tâche"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

interface SubTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskName: string;
  subTasks: SubTask[];
  onAddSubTask: (taskId: string, subTask: Omit<SubTask, 'id' | 'mondaySubItemId'>) => void;
  onUpdateSubTask: (taskId: string, subTaskId: string, updates: Partial<SubTask>) => void;
  onDeleteSubTask: (taskId: string, subTaskId: string) => void;
  onReorderSubTasks: (taskId: string, sourceIndex: number, destinationIndex: number) => void;
  loading?: boolean;
}

export default function SubTaskModal({
  isOpen,
  onClose,
  taskId,
  taskName,
  subTasks,
  onAddSubTask,
  onUpdateSubTask,
  onDeleteSubTask,
  onReorderSubTasks,
  loading = false
}: SubTaskModalProps) {
  const [newSubTaskName, setNewSubTaskName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Capteurs pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddSubTask = () => {
    if (newSubTaskName.trim()) {
      onAddSubTask(taskId, {
        name: newSubTaskName.trim(),
        status: 'todo',
        assignedPerson: '',
        dueDate: undefined
      });
      setNewSubTaskName('');
    }
  };

  const handleUpdateSubTask = (subTaskId: string, field: keyof SubTask, value: any) => {
    onUpdateSubTask(taskId, subTaskId, { [field]: value });
  };

  const handleDeleteSubTask = (subTaskId: string) => {
    setShowDeleteConfirm(subTaskId);
  };

  const confirmDeleteSubTask = (subTaskId: string) => {
    onDeleteSubTask(taskId, subTaskId);
    setShowDeleteConfirm(null);
  };

  // Fonction pour gérer le drag & drop des sous-tâches
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const sourceIndex = subTasks.findIndex(subTask => subTask.id === active.id);
    const destinationIndex = subTasks.findIndex(subTask => subTask.id === over.id);

    if (sourceIndex !== -1 && destinationIndex !== -1) {
      onReorderSubTasks(taskId, sourceIndex, destinationIndex);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl mx-4 w-full max-h-[80vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sous-tâches pour : {taskName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gérez les sous-tâches de cette tâche
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Add New SubTask */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Ajouter une sous-tâche
          </h4>
          <div className="flex gap-3">
            <input
              type="text"
              value={newSubTaskName}
              onChange={(e) => setNewSubTaskName(e.target.value)}
              placeholder="Nom de la sous-tâche"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleAddSubTask}
            disabled={!newSubTaskName.trim() || loading}
            className="mt-3 btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Ajouter la sous-tâche</span>
          </button>
        </div>

        {/* SubTasks List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Sous-tâches existantes ({subTasks.length})
          </h4>
          
          {subTasks.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Aucune sous-tâche pour le moment
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={subTasks.map(subTask => subTask.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  <AnimatePresence>
                    {subTasks.map((subTask, index) => (
                      <SortableSubTaskItem
                        key={subTask.id}
                        subTask={subTask}
                        index={index}
                        onUpdateSubTask={handleUpdateSubTask}
                        onDeleteSubTask={handleDeleteSubTask}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Fermer
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 w-full"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Confirmer la suppression
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Êtes-vous sûr de vouloir supprimer cette sous-tâche ? Cette action est irréversible.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="btn-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => confirmDeleteSubTask(showDeleteConfirm)}
                    className="btn-danger"
                  >
                    Supprimer
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
