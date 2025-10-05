import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { X, CheckCircle, XCircle, Clock, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { Checklist, DaySchedule } from '@/types';
import { getSchedule, getChecklist } from '@/utils/storage';

interface DayDetailModalProps {
  date: string;
  onClose: () => void;
}

const DayDetailModal: React.FC<DayDetailModalProps> = ({ date, onClose }) => {
  const [schedule, setSchedule] = useState<DaySchedule | null>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { categories, templates, applyTemplateToDate } = useAppStore();

  useEffect(() => {
    const loadDayData = async () => {
      setIsLoading(true);
      try {
        const [loadedSchedule, loadedChecklist] = await Promise.all([
          getSchedule(date),
          getChecklist(date)
        ]);
        setSchedule(loadedSchedule || null);
        setChecklist(loadedChecklist || null);
      } catch (error) {
        console.error('Error loading day data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDayData();
  }, [date]);

  // Handle Android back button
  useEffect(() => {
    const handleBackButton = (e: PopStateEvent) => {
      e.preventDefault();
      onClose();
    };

    // Push a state to handle back button
    window.history.pushState({ modal: true }, '');
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [onClose]);

  const getCategoryInfo = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return {
      color: category?.color || '#cccccc',
      name: category?.name || 'Unknown Category'
    };
  };

  const handleApplyTemplate = async (templateId: string) => {
    await applyTemplateToDate(templateId, date);
    // Reload schedule after applying template
    const updatedSchedule = await getSchedule(date);
    setSchedule(updatedSchedule || null);
  };

  // Calculate statistics
  const calculateStats = () => {
    if (!checklist) {
      return {
        successRate: 0,
        checkmarks: 0,
        points: 0,
        focusBlocksCompleted: 0
      };
    }

    let checkmarks = 0;
    if (checklist.wake0730) checkmarks++;
    if ((checklist.focusBlocksCompleted ?? 0) >= 3) checkmarks++;
    if (checklist.noWeekdayYTGames) checkmarks++;
    if (checklist.lightsOut2330) checkmarks++;

    const successRate = Math.round((checkmarks / 4) * 100);
    const points = Math.floor((successRate / 100) * 96);

    return {
      successRate,
      checkmarks,
      points,
      focusBlocksCompleted: checklist.focusBlocksCompleted ?? 0
    };
  };

  const stats = calculateStats();
  const isFutureDate = new Date(date) > new Date();

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Day Details</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500 dark:text-gray-400">Loading...</div>
            </div>
          ) : (
            <>
              {/* Statistics Section */}
              {checklist && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Daily Statistics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Success Rate</span>
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.successRate}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{stats.checkmarks} of 4 completed</div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Points Earned</span>
                        <Target className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.points}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">out of 96 points</div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Focus Blocks</span>
                        <CheckCircle className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.focusBlocksCompleted}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">completed</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Time Blocks Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Time Blocks
                </h3>

                {!schedule || schedule.blocks.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No schedule for this day</p>
                    {isFutureDate && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Apply a template to plan this day:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {templates.map(template => (
                            <button
                              key={template.id}
                              onClick={() => handleApplyTemplate(template.id)}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              Apply {template.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {schedule.blocks.map(block => {
                      const categoryInfo = getCategoryInfo(block.categoryId);
                      const isCompleted = block.status === 'completed';
                      const isSkipped = block.status === 'skipped';

                      return (
                        <div
                          key={block.id}
                          className={cn(
                            'p-4 rounded-lg border-l-4',
                            isCompleted && 'bg-green-50 dark:bg-green-900/20 border-green-500',
                            isSkipped && 'bg-red-50 dark:bg-red-900/20 border-red-500',
                            !isCompleted && !isSkipped && 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                          )}
                          style={{ 
                            borderLeftColor: !isCompleted && !isSkipped ? categoryInfo.color : undefined 
                          }}
                        >
                          <div className="flex justify-between items-start gap-3 mb-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
                              {isSkipped && <XCircle className="w-5 h-5 text-red-600" />}
                              <h4 className="font-semibold text-gray-800 dark:text-gray-200">{block.title}</h4>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">
                              {format(block.start, 'HH:mm')} - {format(block.end, 'HH:mm')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: categoryInfo.color }}
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{categoryInfo.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Template Application for Future Dates */}
              {isFutureDate && schedule && schedule.blocks.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Replace Schedule</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Apply a different template to this day:</p>
                  <div className="flex flex-wrap gap-2">
                    {templates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => handleApplyTemplate(template.id)}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DayDetailModal;
