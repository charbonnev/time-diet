import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const CalendarView: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { getScheduleForDate, getChecklistForDate, currentDate, setCurrentDate } = useAppStore();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getDayStatus = (date: Date) => {
    const schedule = getScheduleForDate(format(date, 'yyyy-MM-dd'));
    const checklist = getChecklistForDate(format(date, 'yyyy-MM-dd'));
    
    if (!schedule || schedule.blocks.length === 0) {
      return 'empty'; // No schedule
    }

    if (!checklist) {
      return 'scheduled'; // Has schedule but no checklist data
    }

    const successRate = checklist.successRate;
    if (successRate >= 80) return 'excellent';
    if (successRate >= 60) return 'good';
    if (successRate >= 40) return 'fair';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      case 'scheduled': return 'bg-gray-300';
      default: return 'bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'Excellent (80%+)';
      case 'good': return 'Good (60-79%)';
      case 'fair': return 'Fair (40-59%)';
      case 'poor': return 'Poor (<40%)';
      case 'scheduled': return 'Scheduled';
      default: return 'No schedule';
    }
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(format(date, 'yyyy-MM-dd'));
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2" />
          Calendar
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={previousMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold text-gray-800 min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map(date => {
            const status = getDayStatus(date);
            const isCurrentDay = isSameDay(date, new Date(currentDate));
            const isTodayDate = isToday(date);

            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDayClick(date)}
                className={cn(
                  'p-3 rounded-lg text-sm font-medium transition-all relative',
                  'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
                  isCurrentDay && 'ring-2 ring-blue-500 bg-blue-50',
                  isTodayDate && 'font-bold'
                )}
              >
                <div className="flex flex-col items-center space-y-1">
                  <span className={cn(
                    'text-gray-900',
                    isTodayDate && 'text-blue-600'
                  )}>
                    {format(date, 'd')}
                  </span>
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    getStatusColor(status)
                  )} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Success Rate Legend</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { status: 'excellent', label: 'Excellent (80%+)' },
            { status: 'good', label: 'Good (60-79%)' },
            { status: 'fair', label: 'Fair (40-59%)' },
            { status: 'poor', label: 'Poor (<40%)' },
            { status: 'scheduled', label: 'Scheduled' },
            { status: 'empty', label: 'No schedule' }
          ].map(({ status, label }) => (
            <div key={status} className="flex items-center space-x-2">
              <div className={cn('w-3 h-3 rounded-full', getStatusColor(status))} />
              <span className="text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;

