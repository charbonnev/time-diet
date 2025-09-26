import React, { useEffect } from 'react';
import { useAppStore } from '@/store';
import { format } from 'date-fns';
import { TimeBlockInstance } from '@/types';
import { cn } from '@/lib/utils';
import Timeline from '@/components/Timeline';

const TimeBlockCard: React.FC<{ block: TimeBlockInstance; categoryColor: string }> = ({ block, categoryColor }) => {
  const now = new Date();
  const isCurrent = now >= block.start && now <= block.end;
  const isPast = now > block.end;

  return (
    <div
      className={cn(
        'p-4 rounded-lg shadow-sm mb-3',
        isCurrent ? 'bg-blue-100 border-l-4 border-blue-500' : 'bg-white border-l-4 border-gray-200',
        isPast && 'opacity-70'
      )}
      style={{ borderColor: isCurrent ? categoryColor : undefined }}
    >
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-lg font-semibold text-gray-800">{block.title}</h3>
        <span className="text-sm text-gray-500">
          {format(block.start, 'HH:mm')} - {format(block.end, 'HH:mm')}
        </span>
      </div>
      <p className="text-sm text-gray-600">Category: {block.categoryId}</p>
      {/* TODO: Add action buttons for complete/skip/snooze */}
    </div>
  );
};

const TodayView: React.FC = () => {
  const { currentSchedule, categories, loadScheduleForDate, currentDate, templates, applyTemplateToDate } = useAppStore();

  useEffect(() => {
    loadScheduleForDate(currentDate);
  }, [currentDate, loadScheduleForDate]);

  const getCategoryColor = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.color || '#cccccc'; // Default gray
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

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Schedule ({format(new Date(currentDate), 'PPP')})</h2>
      <Timeline blocks={currentSchedule.blocks} categories={categories} />
    </div>
  );
};

export default TodayView;

