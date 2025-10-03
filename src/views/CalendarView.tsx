import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentDateString } from '@/utils/time';
import DayDetailModal from '@/components/DayDetailModal';

const CalendarView: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayStatuses, setDayStatuses] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Update day statuses when month changes
  useEffect(() => {
    console.log('📅 CalendarView: Loading calendar with real performance data');
    
    const loadCalendarData = async () => {
      try {
        // Import storage functions
        const { getChecklist } = await import('@/utils/storage');
        
        const statuses: Record<string, string> = {};
        
        // Load checklist data for all visible calendar days
        const promises = calendarDays.map(async (date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          
          try {
            const checklist = await getChecklist(dateStr);
            
            if (!checklist) {
              statuses[dateStr] = 'empty';
              return;
            }
            
            // Calculate performance based on checklist completion
            let checkmarks = 0;
            if (checklist.wake0730) checkmarks++;
            if ((checklist.focusBlocksCompleted ?? 0) >= 3) checkmarks++;
            if (checklist.noWeekdayYTGames) checkmarks++;
            if (checklist.lightsOut2330) checkmarks++;
            
            const successRate = (checkmarks / 4) * 100;
            
            // Determine status based on success rate
            if (successRate >= 80) {
              statuses[dateStr] = 'excellent';
            } else if (successRate >= 60) {
              statuses[dateStr] = 'good';
            } else if (successRate >= 40) {
              statuses[dateStr] = 'fair';
            } else if (successRate > 0) {
              statuses[dateStr] = 'poor';
            } else {
              // Check if there's any manual input (even if 0% success)
              const hasAnyInput = checklist.wake0730 || checklist.noWeekdayYTGames || checklist.lightsOut2330 || (checklist.focusBlocksCompleted ?? 0) > 0;
              statuses[dateStr] = hasAnyInput ? 'poor' : 'scheduled';
            }
            
          } catch (error) {
            console.error(`Error loading checklist for ${dateStr}:`, error);
            statuses[dateStr] = 'empty';
          }
        });
        
        await Promise.all(promises);
        setDayStatuses(statuses);
        
        console.log('📅 CalendarView: Real performance data loaded', statuses);
        
      } catch (error) {
        console.error('Error loading calendar data:', error);
        // Fallback to empty statuses
        setDayStatuses({});
      }
    };
    
    loadCalendarData();
  }, [currentMonth, calendarDays]);

  const getDayStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return dayStatuses[dateStr] || 'empty';
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


  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    console.log('📅 CalendarView: Day clicked:', dateStr);
    setSelectedDate(dateStr);
  };

  const handleDayDoubleClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const today = getCurrentDateString();
    
    // Don't open modal for today - user should use Today tab
    if (dateStr === today) {
      console.log('📅 CalendarView: Today double-clicked, ignoring (use Today tab)');
      return;
    }
    
    console.log('📅 CalendarView: Double-click - opening day detail modal for:', dateStr);
    setSelectedDate(dateStr);
    setShowDayModal(true);
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
          {calendarDays.map((date: Date) => {
            const status = getDayStatus(date);
            const dateStr = format(date, 'yyyy-MM-dd');
            const isSelected = selectedDate === dateStr;
            const isTodayDate = isToday(date);
            const isCurrentMonthDay = isSameMonth(date, currentMonth);

            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDayClick(date)}
                onDoubleClick={() => handleDayDoubleClick(date)}
                title="Click to select, double-click to view day details"
                className={cn(
                  'p-3 rounded-lg text-sm font-medium transition-all relative',
                  'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
                  isSelected && 'ring-2 ring-blue-500 bg-blue-50',
                  isTodayDate && 'font-bold',
                  !isCurrentMonthDay && 'text-gray-400 opacity-50'
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

      {/* Day Detail Modal */}
      {showDayModal && selectedDate && (
        <DayDetailModal
          date={selectedDate}
          onClose={() => setShowDayModal(false)}
        />
      )}
    </div>
  );
};

export default CalendarView;

