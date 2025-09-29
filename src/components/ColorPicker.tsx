import React, { useState } from 'react';
import { MONDAY_AVAILABLE_COLORS } from '../utils/colorMapping';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedColorInfo = MONDAY_AVAILABLE_COLORS.find(c => c.hex === color) || MONDAY_AVAILABLE_COLORS[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div 
            className="w-6 h-6 rounded-full border-2 border-gray-300"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium">{selectedColorInfo.name}</span>
        </div>
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {/* Color Selection Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl mx-4 w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Sélectionner une couleur
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-8 gap-3">
                {MONDAY_AVAILABLE_COLORS.map((colorOption) => (
                  <motion.button
                    key={colorOption.hex}
                    type="button"
                    className={`
                      w-12 h-12 rounded-full border-2 transition-all duration-200 hover:scale-105
                      ${color === colorOption.hex 
                        ? 'border-gray-800 shadow-lg ring-2 ring-blue-500' 
                        : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                    style={{ backgroundColor: colorOption.hex }}
                    onClick={() => {
                      onChange(colorOption.hex);
                      setIsModalOpen(false);
                    }}
                    title={colorOption.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  />
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Couleur sélectionnée
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedColorInfo.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="btn-primary"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ColorPicker;