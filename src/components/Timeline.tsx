import React from 'react';
import { TimeBlockInstance, Category } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimelineProps {
  blocks: TimeBlockInstance[];
  categories: Category[];
}

const Timeline: React.FC<TimelineProps> = ({ blocks, categories }) => {
  const getCategoryColor = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.color || '#cccccc';
  };

  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

      {blocks.map((block, index) => (
        <div key={block.id} className="relative mb-4">
          {/* Time marker */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-300 rounded-full"></div>

          {/* Time label */}
          <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-xs text-gray-500">
            {format(block.start, 'HH:mm')}
          </div>

          {/* Block card */}
          <div
            className={cn(
              'p-3 rounded-lg shadow-sm',
              'border-l-4'
            )}
            style={{ borderColor: getCategoryColor(block.categoryId) }}
          >
            <h3 className="font-semibold text-gray-800">{block.title}</h3>
            <p className="text-sm text-gray-600">
              {format(block.start, 'HH:mm')} - {format(block.end, 'HH:mm')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;

