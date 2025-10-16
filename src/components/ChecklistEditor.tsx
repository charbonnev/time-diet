import React, { useState } from 'react';
import { X, Plus, Trash2, Target } from 'lucide-react';
import { ChecklistDefinition, ChecklistItemDefinition, Category } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface ChecklistEditorProps {
  checklist: ChecklistDefinition | null;
  categories: Category[];
  onSave: (checklist: ChecklistDefinition) => Promise<void>;
  onClose: () => void;
}

const ChecklistEditor: React.FC<ChecklistEditorProps> = ({
  checklist,
  categories,
  onSave,
  onClose
}) => {
  const [name, setName] = useState(checklist?.name || "My Goals 🎯");
  const [items, setItems] = useState<ChecklistItemDefinition[]>(
    checklist?.items || []
  );
  const [errors, setErrors] = useState<string[]>([]);

  const handleAddItem = () => {
    const newItem: ChecklistItemDefinition = {
      id: `item-${uuidv4()}`,
      name: 'New Goal',
      type: 'boolean'
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (
    index: number,
    field: keyof ChecklistItemDefinition,
    value: any
  ) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    // Clear rule if switching to boolean
    if (field === 'type' && value === 'boolean') {
      delete newItems[index].target;
      delete newItems[index].rule;
    }
    
    // Initialize rule if switching to count
    if (field === 'type' && value === 'count' && !newItems[index].rule) {
      newItems[index].rule = {};
      newItems[index].target = 1;
    }
    
    setItems(newItems);
  };

  const handleRuleChange = (
    index: number,
    field: 'titleContains' | 'category',
    value: string
  ) => {
    const newItems = [...items];
    if (!newItems[index].rule) {
      newItems[index].rule = {};
    }
    
    if (value === '') {
      // Remove field if empty
      delete newItems[index].rule![field];
    } else {
      newItems[index].rule![field] = value;
    }
    
    setItems(newItems);
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!name.trim()) {
      newErrors.push('Checklist name is required');
    }

    if (items.length === 0) {
      newErrors.push('At least one goal is required');
    }

    items.forEach((item, index) => {
      if (!item.name.trim()) {
        newErrors.push(`Goal #${index + 1}: Name is required`);
      }

      if (item.type === 'count') {
        if (!item.target || item.target < 1) {
          newErrors.push(`Goal #${index + 1}: Target must be at least 1`);
        }
        
        // Must have at least one rule criterion
        if (!item.rule || (!item.rule.titleContains && !item.rule.category)) {
          newErrors.push(`Goal #${index + 1}: Count goals need at least one rule (title or category)`);
        }
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const checklistToSave: ChecklistDefinition = {
      id: checklist?.id || `checklist-${uuidv4()}`,
      name: name.trim(),
      items
    };

    try {
      await onSave(checklistToSave);
      onClose();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to save checklist']);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Target className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {checklist ? 'Edit Goals' : 'Create Goals'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Checklist Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Checklist Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              placeholder="My Goals 🎯"
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                Please fix these errors:
              </p>
              <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Goals ({items.length})
            </h3>

            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {/* Item Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Goal Name
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="e.g., Exercise"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Type
                      </label>
                      <select
                        value={item.type}
                        onChange={(e) => handleItemChange(index, 'type', e.target.value as 'boolean' | 'count')}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="boolean">Yes/No (Boolean)</option>
                        <option value="count">Count Blocks</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Remove goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Count Type Settings */}
                {item.type === 'count' && (
                  <div className="pl-4 border-l-2 border-blue-400 dark:border-blue-600">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Target Count
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.target || 1}
                          onChange={(e) => handleItemChange(index, 'target', parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Title Contains (optional)
                        </label>
                        <input
                          type="text"
                          value={item.rule?.titleContains || ''}
                          onChange={(e) => handleRuleChange(index, 'titleContains', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          placeholder="e.g., Focus"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Category (optional)
                        </label>
                        <select
                          value={item.rule?.category || ''}
                          onChange={(e) => handleRuleChange(index, 'category', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="">Any category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      Counts completed blocks matching: {
                        !item.rule?.titleContains && !item.rule?.category ? 'all blocks' :
                        item.rule?.titleContains && item.rule?.category ? `title contains "${item.rule.titleContains}" AND category "${categories.find(c => c.id === item.rule?.category)?.name}"` :
                        item.rule?.titleContains ? `title contains "${item.rule.titleContains}"` :
                        `category "${categories.find(c => c.id === item.rule?.category)?.name}"`
                      }
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Add Item Button */}
            <button
              onClick={handleAddItem}
              className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Goal
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-semibold"
          >
            Save Goals
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistEditor;
