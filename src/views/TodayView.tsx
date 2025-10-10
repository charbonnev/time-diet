import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { TimeBlockInstance } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, Edit, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { getCurrentDateString } from '@/utils/time';

const TimeBlockCard: React.FC<{ block: TimeBlockInstance; categoryColor: string; categoryName: string }> = ({ block, categoryColor, categoryName }) => {
  const { updateBlockStatus, updateBlockTitle, resetBlockStatus, snoozeBlock, updateBlockDescription } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(block.title);
  const [newDescription, setNewDescription] = useState(block.description || '');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Update local state when block changes
  useEffect(() => {
    setNewTitle(block.title);
    setNewDescription(block.description || '');
  }, [block.title, block.description]);
  
  const now = new Date();
  const isCurrent = now >= block.start && now <= block.end;
  const isPast = now > block.end;
  const isCompleted = block.status === 'completed';
  const isSkipped = block.status === 'skipped';

  const handleComplete = async () => {
    await updateBlockStatus(block.id, 'completed');
  };

  const handleSkip = async () => {
    await updateBlockStatus(block.id, 'skipped');
  };

  const handleSnooze = async (minutes: number) => {
    await snoozeBlock(block.id, minutes);
  };

  const handleSaveEdit = async () => {
    if (newTitle.trim() && newTitle !== block.title) {
      await updateBlockTitle(block.id, newTitle.trim());
    }
    if (newDescription !== (block.description || '')) {
      await updateBlockDescription(block.id, newDescription);
    }
    setIsEditing(false);
  };

  const handleResetStatus = async () => {
    await resetBlockStatus(block.id);
  };

  const getStatusColor = () => {
    if (isCompleted) return 'bg-green-100 dark:bg-green-900/30 border-green-500';
    if (isSkipped) return 'bg-red-100 dark:bg-red-900/30 border-red-500';
    if (isCurrent) return 'bg-blue-100 dark:bg-blue-900/30 border-blue-500';
    return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  };

  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (isSkipped) return <XCircle className="w-5 h-5 text-red-600" />;
    if (isCurrent) return <Clock className="w-5 h-5 text-blue-600" />;
    return null;
  };

  return (
    <div
      className={cn(
        'p-4 rounded-lg shadow-sm mb-3 border-l-4',
        getStatusColor(),
        isPast && !isCompleted && !isSkipped && 'opacity-70'
      )}
      style={{ borderLeftColor: categoryColor }}
    >
      <div className="flex justify-between items-start gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{block.title}</h3>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">
          {format(block.start, 'HH:mm')} - {format(block.end, 'HH:mm')}
        </span>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">Category: {categoryName}</p>
        {block.description && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show Details
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Expandable Description */}
      {isExpanded && block.description && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{block.description}</p>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        {!isCompleted && !isSkipped && (
          <>
            <button
              onClick={handleComplete}
              className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Complete
            </button>
            
            <button
              onClick={handleSkip}
              className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Skip
            </button>
            
            {isCurrent && (
              <div className="flex gap-1">
                <button
                  onClick={() => handleSnooze(5)}
                  className="flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600 transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  +5min
                </button>
                <button
                  onClick={() => handleSnooze(15)}
                  className="flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600 transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  +15min
                </button>
              </div>
            )}
          </>
        )}
        
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
      </div>
      
      {/* Enhanced Edit Form */}
      {isEditing && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Edit Time Block</p>
          
          {/* Title Edit */}
          <div className="mb-3">
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Block title"
            />
          </div>
          
          {/* Description Edit */}
          <div className="mb-3">
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Description / Instructions</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add instructions, links, or notes for this time block..."
              rows={4}
            />
          </div>
          
          {/* Status Reset */}
          {(isCompleted || isSkipped) && (
            <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                Current status: <span className="font-semibold">{isCompleted ? 'Completed' : 'Skipped'}</span>
              </p>
              <button
                onClick={handleResetStatus}
                className="flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
              >
                <Clock className="w-4 h-4" />
                Reset to Planned
              </button>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors font-medium"
            >
              Save Changes
            </button>
            <button 
              onClick={() => {
                setNewTitle(block.title);
                setNewDescription(block.description || '');
                setIsEditing(false);
              }}
              className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TodayView: React.FC = () => {
  const { currentSchedule, categories, loadScheduleForDate, templates, applyTemplateToDate, settings } = useAppStore();
  const today = getCurrentDateString();
  const [viewDate, setViewDate] = useState(today);

  useEffect(() => {
    console.log('🏠 TodayView: COMPONENT MOUNTED - Loading date:', viewDate);
    loadScheduleForDate(viewDate);

    return () => {
      console.log('🏠 TodayView: COMPONENT UNMOUNTED');
    };
  }, [viewDate, loadScheduleForDate]); // Reload when viewDate changes

  // Reset to today when correction mode is disabled
  useEffect(() => {
    if (!settings.correctionMode && viewDate !== today) {
      setViewDate(today);
    }
  }, [settings.correctionMode, today, viewDate]);

  const getCategoryInfo = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return {
      color: category?.color || '#cccccc',
      name: category?.name || 'Unknown Category'
    };
  };

  const handleApplyTemplate = async (templateId: string) => {
    await applyTemplateToDate(templateId, viewDate);
  };

  const handlePreviousDay = () => {
    const prevDate = format(subDays(parseISO(viewDate), 1), 'yyyy-MM-dd');
    setViewDate(prevDate);
  };

  const handleNextDay = () => {
    const nextDate = format(addDays(parseISO(viewDate), 1), 'yyyy-MM-dd');
    setViewDate(nextDate);
  };

  const handleToday = () => {
    setViewDate(today);
  };

  const isToday = viewDate === today;

  if (!currentSchedule || currentSchedule.blocks.length === 0) {
    return (
      <div className="p-4">
        {settings.correctionMode && (
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePreviousDay}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {format(parseISO(viewDate), 'EEEE, MMMM do, yyyy')}
              </h2>
              {!isToday && (
                <button
                  onClick={handleToday}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Back to Today
                </button>
              )}
            </div>
            <button
              onClick={handleNextDay}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        )}
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            No schedule planned for this day. Choose a template to get started:
          </p>
          
          <div className="max-w-md mx-auto space-y-3">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleApplyTemplate(template.id)}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="text-left">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {template.name}
                    {template.isDefault && (
                      <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {template.blocks.length} time blocks
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {settings.correctionMode && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePreviousDay}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {isToday ? "Today's" : "Day"} Schedule
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{format(parseISO(viewDate), 'EEEE, MMMM do, yyyy')}</p>
            {!isToday && (
              <button
                onClick={handleToday}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-1"
              >
                Back to Today
              </button>
            )}
          </div>
          <button
            onClick={handleNextDay}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      )}
      {!settings.correctionMode && (
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Today's Schedule
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{format(parseISO(today), 'EEEE, MMMM do, yyyy')}</p>
        </div>
      )}
      <div className="space-y-3">
        {currentSchedule.blocks.map((block) => {
          const categoryInfo = getCategoryInfo(block.categoryId);
          return (
            <TimeBlockCard
              key={block.id}
              block={block}
              categoryColor={categoryInfo.color}
              categoryName={categoryInfo.name}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TodayView;
