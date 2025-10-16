import React, { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { CheckCircle, Circle, Target, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { Checklist } from '@/types';
import { getCurrentDateString } from '@/utils/time';
import { calculateCategoryPoints, calculateTotalCompletedPoints, calculateTotalPlannedPoints } from '@/utils/points';
import { getActiveChecklistDefinition, evaluateChecklistItem, isCountItemCompleted, calculateCustomChecklistSuccess } from '@/utils/customChecklist';

const ChecklistView: React.FC = () => {
  const { 
    currentSchedule, 
    currentChecklist, 
    loadScheduleForDate, 
    loadChecklistForDate,
    updateChecklistItem,
    categories,
    settings
  } = useAppStore();

  const today = getCurrentDateString();
  const [viewDate, setViewDate] = useState(today);
  const [streakData, setStreakData] = useState<any[]>([]);

  useEffect(() => {
    console.log('✅ ChecklistView: Loading data for date:', viewDate);
    loadScheduleForDate(viewDate);
    loadChecklistForDate(viewDate);
  }, [viewDate, loadScheduleForDate, loadChecklistForDate]);

  // Reset to today when correction mode is disabled
  useEffect(() => {
    if (!settings.correctionMode && viewDate !== today) {
      setViewDate(today);
    }
  }, [settings.correctionMode, today, viewDate]);

  // Load real streak data for the last 7 days
  useEffect(() => {
    const loadStreakData = async () => {
      try {
        // Import storage functions
        const { getChecklist, getSchedule } = await import('@/utils/storage');
        
        const data = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = format(date, 'yyyy-MM-dd');
          
          try {
            // Try to get existing checklist and schedule
            const checklist = await getChecklist(dateStr);
            const schedule = await getSchedule(dateStr);
            
            let checkmarks = 0;
            let hasData = false;
            let actualPoints = 0;
            let plannedPoints = 0;
            
            if (checklist) {
              // Calculate checkmarks using custom checklist if available
              if (settings.customChecklist && checklist.customValues) {
                const checklistDef = getActiveChecklistDefinition(settings);
                checkmarks = checklistDef.items.filter(item => {
                  const value = checklist.customValues?.[item.id];
                  if (item.type === 'boolean') return value === true;
                  if (item.type === 'count' && typeof value === 'number') {
                    return value >= (item.target || 1);
                  }
                  return false;
                }).length;
                hasData = Object.keys(checklist.customValues).length > 0;
              } else {
                // Fallback to old hardcoded checkmarks
                if (checklist.wake0730) checkmarks++;
                if ((checklist.focusBlocksCompleted ?? 0) >= 3) checkmarks++;
                if (checklist.noWeekdayYTGames) checkmarks++;
                if (checklist.lightsOut2330) checkmarks++;
                
                hasData = checklist.wake0730 || checklist.noWeekdayYTGames || checklist.lightsOut2330 || (checklist.focusBlocksCompleted ?? 0) > 0;
              }
            }
            
            // Calculate actual points from schedule if available
            if (schedule && schedule.blocks) {
              plannedPoints = calculateTotalPlannedPoints(schedule.blocks);
              actualPoints = calculateTotalCompletedPoints(schedule.blocks);
            }
            
            const totalItems = (settings.customChecklist && checklist?.customValues) 
              ? getActiveChecklistDefinition(settings).items.length 
              : 4;
            const successRate = Math.round((checkmarks / totalItems) * 100);
            
            data.push({
              date: format(date, 'MMM dd'),
              successRate,
              points: actualPoints, // Now using ACTUAL points from completed blocks!
              plannedPoints,
              checkmarks,
              hasData
            });
            
          } catch (error) {
            console.error(`Error loading checklist for ${dateStr}:`, error);
            // Add placeholder data for dates with errors
            data.push({
              date: format(date, 'MMM dd'),
              successRate: 0,
              points: 0,
              plannedPoints: 0,
              checkmarks: 0,
              hasData: false
            });
          }
        }
        
        console.log('📊 Loaded real streak data:', data);
        setStreakData(data);
        
      } catch (error) {
        console.error('Error loading streak data:', error);
        // Fallback to empty data
        setStreakData([]);
      }
    };

    loadStreakData();
  }, [today]); // Re-load when date changes (shouldn't happen but just in case)

  const handleChecklistToggle = async (itemId: string, newValue: boolean) => {
    // Store boolean values in customValues
    const updatedCustomValues = {
      ...currentChecklist?.customValues,
      [itemId]: newValue
    };
    await updateChecklistItem(viewDate, { customValues: updatedCustomValues });
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

  // Render navigation header separately so it's always visible
  const renderNavigation = () => {
    if (!settings.correctionMode) return null;
    
    return (
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePreviousDay}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center">
            <Target className="w-5 h-5 mr-2" />
            Daily Checklist
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
    );
  };

  if (!currentSchedule) {
    return (
      <div className="p-4">
        {renderNavigation()}
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>No schedule available for this day. Apply the default template first!</p>
        </div>
      </div>
    );
  }

  // Get active checklist definition
  const checklistDefinition = useMemo(() => getActiveChecklistDefinition(settings), [settings]);

  // Dynamically evaluate checklist items based on custom definition
  const checklistItems = useMemo(() => {
    if (!currentSchedule) return [];

    return checklistDefinition.items.map(item => {
      // Get stored value (for boolean items) or evaluate (for count items)
      const storedValue = currentChecklist?.customValues?.[item.id];
      const value = evaluateChecklistItem(item, currentSchedule.blocks, storedValue as boolean | undefined);
      
      // Determine if completed
      let completed = false;
      let displayName = item.name;

      if (item.type === 'boolean') {
        completed = value === true;
      } else if (item.type === 'count') {
        const count = typeof value === 'number' ? value : 0;
        completed = isCountItemCompleted(item, count);
        // Show progress: "Goal Name (X/Target)"
        displayName = `${item.name} (${count}/${item.target || 1})`;
      }

      return {
        id: item.id,
        name: displayName,
        completed,
        clickable: item.type === 'boolean', // Only boolean items are user-toggleable
        type: item.type,
        value
      };
    });
  }, [checklistDefinition, currentSchedule, currentChecklist]);

  const completedItems = checklistItems.filter(item => item.completed).length;
  const totalItems = checklistItems.length;
  const successRate = currentChecklist?.successRate || Math.round((completedItems / totalItems) * 100);

  // Memoize expensive point calculations
  const totalPlannedPoints = useMemo(() => 
    calculateTotalPlannedPoints(currentSchedule.blocks),
    [currentSchedule.blocks]
  );
  
  const totalCompletedPoints = useMemo(() => 
    calculateTotalCompletedPoints(currentSchedule.blocks),
    [currentSchedule.blocks]
  );
  
  const categoryPointsData = useMemo(() => 
    calculateCategoryPoints(currentSchedule.blocks, categories),
    [currentSchedule.blocks, categories]
  );

  // Prepare pie chart data
  const pieData = useMemo(() => [
    { name: 'Completed', value: completedItems, color: '#10b981' },
    { name: 'Remaining', value: totalItems - completedItems, color: '#e5e7eb' }
  ], [completedItems, totalItems]);

  // Memoize category breakdown calculation
  const categoryBreakdown = useMemo(() => {
    return categoryPointsData.map(cp => {
      const category = categories.find(cat => cat.id === cp.categoryId);
      if (!category || cp.planned === 0) return null;
      
      return {
        name: category.name,
        completedPoints: cp.completed,
        totalPoints: cp.planned,
        color: category.color,
        percentage: cp.planned > 0 ? Math.round((cp.completed / cp.planned) * 100) : 0
      };
    }).filter(cat => cat !== null);
  }, [categoryPointsData, categories]);

  return (
    <div className="p-4">
      {renderNavigation()}
      {!settings.correctionMode && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Daily Checklist
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{format(parseISO(today), 'EEEE, MMMM do, yyyy')}</p>
        </div>
      )}

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Success Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Success Rate</h3>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{successRate}%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{completedItems} of {totalItems} completed</div>
        </div>

        {/* Points Earned */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Points Earned</h3>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalCompletedPoints}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">out of {totalPlannedPoints} points</div>
        </div>

        {/* Date */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Date</h3>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{format(parseISO(viewDate), 'MMM dd')}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{format(parseISO(viewDate), 'EEEE')}</div>
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Completion Overview</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Streak */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">7-Day Points Earned</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={streakData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'points') return [`${value} pts`, 'Earned'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="points" fill="#3b82f6" name="Points Earned" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Category Breakdown</h3>
        <div className="space-y-3">
          {categoryBreakdown.map(category => (
            <div key={category.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium text-gray-700 dark:text-gray-300">{category.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {category.completedPoints}/{category.totalPoints} pts
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {category.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Checklist Items */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Today's Goals</h3>
        <div className="space-y-3">
          {checklistItems.map((item, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center space-x-3 p-3 rounded-lg border transition-colors',
                item.completed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              )}
              >
                <button
                  onClick={() => item.clickable && handleChecklistToggle(item.id, !item.completed)}
                  className={cn(
                    "flex-shrink-0",
                    item.clickable ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"
                  )}
                  disabled={!item.clickable}
                >
                  {item.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
                <div className="flex-1">
                  <h4 className={cn(
                    'font-medium',
                    item.completed ? 'text-green-800 dark:text-green-400 line-through' : 'text-gray-800 dark:text-gray-200'
                  )}>
                    {item.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.clickable ? 'Click to toggle' : 'Auto-updated from time blocks'}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ChecklistView;

