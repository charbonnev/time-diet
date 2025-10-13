import React, { useState, useEffect } from 'react';
import { Template, TimeBlock, Category } from '@/types';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface TemplateEditorProps {
  template: Template | null; // null for new template
  categories: Category[];
  onSave: (template: Template) => Promise<void>;
  onClose: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, categories, onSave, onClose }) => {
  const [name, setName] = useState(template?.name || '');
  const [blocks, setBlocks] = useState<TimeBlock[]>(template?.blocks || []);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(template?.name || '');
    setBlocks(template?.blocks || []);
  }, [template]);

  const handleAddBlock = () => {
    const newBlock: TimeBlock = {
      id: uuidv4(),
      title: 'New Time Block',
      categoryId: categories[0]?.id || '',
      startTime: '09:00',
      endTime: '09:30',
      description: ''
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleUpdateBlock = (index: number, updates: Partial<TimeBlock>) => {
    const updatedBlocks = [...blocks];
    updatedBlocks[index] = { ...updatedBlocks[index], ...updates };
    setBlocks(updatedBlocks);
  };

  const handleDeleteBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (blocks.length === 0) {
      alert('Please add at least one time block');
      return;
    }

    setIsSaving(true);
    try {
      const savedTemplate: Template = {
        id: template?.id || uuidv4(),
        name: name.trim(),
        blocks,
        isDefault: template?.isDefault || false
      };
      await onSave(savedTemplate);
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {template ? 'Edit Template' : 'Create New Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Template Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              placeholder="e.g., My Custom Schedule"
            />
          </div>

          {/* Time Blocks */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Time Blocks ({blocks.length})
              </h3>
              <button
                onClick={handleAddBlock}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 dark:bg-green-700 text-white text-sm rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Block
              </button>
            </div>

            <div className="space-y-3">
              {blocks.map((block, index) => (
                <div
                  key={block.id}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    {/* Title */}
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={block.title}
                        onChange={(e) => handleUpdateBlock(index, { title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Start Time */}
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={block.startTime}
                        onChange={(e) => handleUpdateBlock(index, { startTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>

                    {/* End Time */}
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={block.endTime}
                        onChange={(e) => handleUpdateBlock(index, { endTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>

                    {/* Category */}
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Category
                      </label>
                      <select
                        value={block.categoryId}
                        onChange={(e) => handleUpdateBlock(index, { categoryId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Description / Instructions (optional)
                      </label>
                      <textarea
                        value={block.description || ''}
                        onChange={(e) => handleUpdateBlock(index, { description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Add instructions, links, or notes..."
                      />
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteBlock(index)}
                    className="flex items-center gap-1 px-3 py-1 bg-red-600 dark:bg-red-700 text-white text-sm rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Block
                  </button>
                </div>
              ))}

              {blocks.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No time blocks yet. Click "Add Block" to create one.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
