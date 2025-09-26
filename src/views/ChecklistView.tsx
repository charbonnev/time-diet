import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { format } from 'date-fns';
import { CheckCircle, Circle, Target, TrendingUp, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

const ChecklistView: React.FC = () => {
  const { 
    currentDate, 
    currentSchedule, 
    currentChecklist, 
    loadScheduleForDate, 
    loadChecklistForDate,
    updateChecklistItem,
    categories
  } = useAppStore();

  const [streakData, setStreakData] = useState<any[]>([]);

  useEffect(() => {
    loadScheduleForDate(currentDate);
    loadChecklistForDate(currentDate);
  }, [currentDate, loadScheduleForDate, loadChecklistForDate]);

  // Generate sample streak data for the last 7 days
  useEffect(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Simulate success rates for demo
      const successRate = Math.floor(Math.random() * 40) + 60; // 60-100%
      
      data.push({
        date: format(date, 'MMM dd'),
        successRate,
        points: Math.floor((successRate / 100) * 96)
      });
    }
    setStreakData(data);
  }, []);

  const handleChecklistToggle = async (itemId: string, completed: boolean) => {
    if (currentChecklist) {
      await updateChecklistItem(currentChecklist.id, itemId, completed);
    }
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.color || '#cccccc';
  };

  if (!currentSchedule || !currentChecklist) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No checklist available for today. Complete some time blocks first!</p>
      </div>
    );
  }

  const completedItems = currentChecklist.items.filter(item => item.completed).length;
  const totalItems = currentChecklist.items.length;
  const successRate = Math.round((completedItems / totalItems) * 100);

  // Prepare pie chart data
  const pieData = [
    { name: 'Completed', value: completedItems, color: '#10b981' },
    { name: 'Remaining', value: totalItems - completedItems, color: '#e5e7eb' }
  ];

  // Category breakdown
  const categoryBreakdown = categories.map(category => {
    const categoryItems = currentChecklist.items.filter(item => 
      currentSchedule.blocks.find(block => block.id === item.blockId)?.categoryId === category.id
    );
    const completedCategoryItems = categoryItems.filter(item => item.completed);
    
    return {
      name: category.name,
      completed: completedCategoryItems.length,
      total: categoryItems.length,
      color: category.color,
      percentage: categoryItems.length > 0 ? Math.round((completedCategoryItems.length / categoryItems.length) * 100) : 0
    };
  }).filter(cat => cat.total > 0);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <Target className="w-5 h-5 mr-2" />
        Daily Checklist
      </h2>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Success Rate */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Success Rate</h3>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{successRate}%</div>
          <div className="text-sm text-gray-500">{completedItems} of {totalItems} completed</div>
        </div>

        {/* Points Earned */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Points Earned</h3>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{Math.floor((successRate / 100) * 96)}</div>
          <div className="text-sm text-gray-500">out of 96 points</div>
        </div>

        {/* Date */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Date</h3>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-lg font-bold text-gray-900">{format(new Date(currentDate), 'MMM dd')}</div>
          <div className="text-sm text-gray-500">{format(new Date(currentDate), 'EEEE')}</div>
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Completion Overview</h3>
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
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">7-Day Progress</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={streakData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="successRate" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Category Breakdown</h3>
        <div className="space-y-3">
          {categoryBreakdown.map(category => (
            <div key={category.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium text-gray-700">{category.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {category.completed}/{category.total}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {category.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Checklist Items */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Tasks</h3>
        <div className="space-y-3">
          {currentChecklist.items.map(item => {
            const block = currentSchedule.blocks.find(b => b.id === item.blockId);
            if (!block) return null;

            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center space-x-3 p-3 rounded-lg border transition-colors',
                  item.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                )}
              >
                <button
                  onClick={() => handleChecklistToggle(item.id, !item.completed)}
                  className="flex-shrink-0"
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
                    item.completed ? 'text-green-800 line-through' : 'text-gray-800'
                  )}>
                    {block.title}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {format(block.start, 'HH:mm')} - {format(block.end, 'HH:mm')}
                  </p>
                </div>
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getCategoryColor(block.categoryId) }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChecklistView;

