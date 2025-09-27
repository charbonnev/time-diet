import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { format, parseISO } from 'date-fns';
import { TimeBlockInstance } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, Edit } from 'lucide-react';
import { getCurrentDateString } from '@/utils/time';
import Timeline from '@/components/Timeline';

const TimeBlockCard: React.FC<{ block: TimeBlockInstance; categoryColor: string }> = ({ block, categoryColor }) => {
  const { updateBlockStatus, snoozeBlock } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(block.title);
  
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
    // For now, just update the title in the UI
    // TODO: Add updateBlockTitle function to store
    setIsEditing(false);
  };

  const getStatusColor = () => {
    if (isCompleted) return 'bg-green-100 border-green-500';
    if (isSkipped) return 'bg-red-100 border-red-500';
    if (isCurrent) return 'bg-blue-100 border-blue-500';
    return 'bg-white border-gray-200';
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
      style={{ borderColor: isCurrent ? categoryColor : undefined }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold text-gray-800">{block.title}</h3>
        </div>
        <span className="text-sm text-gray-500">
          {format(block.start, 'HH:mm')} - {format(block.end, 'HH:mm')}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">Category: {block.categoryId}</p>
      
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
      
      {/* Edit Form (Simple version) */}
      {isEditing && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600 mb-2">Quick Edit:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Block title"
            />
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Save
            </button>
            <button 
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
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
  const { currentSchedule, categories, loadScheduleForDate, templates, applyTemplateToDate, setCurrentDate, currentDate } = useAppStore();

  useEffect(() => {
    console.log('🏠 TodayView: COMPONENT MOUNTED');
    
    // If no currentDate is set, default to today
    const today = getCurrentDateString();
    const { currentDate: storeCurrentDate } = useAppStore.getState();
    
    if (!storeCurrentDate) {
      console.log('🏠 TodayView: No date set, defaulting to today:', today);
      setCurrentDate(today);
    } else {
      console.log('🏠 TodayView: Using selected date:', storeCurrentDate);
    }
    
    // Load schedule for the current date (could be today or a selected date)
    const dateToLoad = storeCurrentDate || today;
    loadScheduleForDate(dateToLoad);

    return () => {
      console.log('🏠 TodayView: COMPONENT UNMOUNTED');
    };
  }, []); // Only run on mount to avoid loops

  // Load schedule when currentDate changes (e.g., from calendar selection)
  useEffect(() => {
    if (currentDate) {
      console.log('🏠 TodayView: Loading schedule for date:', currentDate);
      loadScheduleForDate(currentDate);
    }
  }, [currentDate, loadScheduleForDate]);

  const getCategoryColor = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.color || '#cccccc';
  };

  const handleApplyDefaultTemplate = async () => {
    const defaultTemplate = templates.find(t => t.isDefault);
    if (defaultTemplate) {
      await applyTemplateToDate(defaultTemplate.id, currentDate);
    } else {
      console.error('Default template not found');
    }
  };

  if (!currentSchedule || currentSchedule.blocks.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="mb-4">No schedule planned for today. Start by creating a template!</p>
        <button 
          onClick={handleApplyDefaultTemplate}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition-colors"
        >
          Apply Default Template
        </button>
      </div>
    );
  }

  const isToday = currentDate === getCurrentDateString();
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {isToday ? "Today's" : "Day"} Schedule ({format(parseISO(currentDate), 'PPP')})
      </h2>
      <div className="space-y-3">
        {currentSchedule.blocks.map((block) => (
          <TimeBlockCard
            key={block.id}
            block={block}
            categoryColor={getCategoryColor(block.categoryId)}
          />
        ))}
      </div>
    </div>
  );
};

export default TodayView;
