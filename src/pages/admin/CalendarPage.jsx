"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, X, Clock, User, FileText, CheckCircle, Circle } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { fetchCalendarTasks } from "../../redux/api/calendarApi";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [checklistTasks, setChecklistTasks] = useState([]);
  const [delegationTasks, setDelegationTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch tasks when month/year changes
  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        // Get user credentials from localStorage
        const username = localStorage.getItem("user-name");
        const role = localStorage.getItem("role");
        const data = await fetchCalendarTasks(month, year, username, role);
        setChecklistTasks(data.checklist || []);
        setDelegationTasks(data.delegation || []);
      } catch (error) {
        console.error("Error loading calendar tasks:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, [currentDate]);

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay, year, month };
  };

  // Format date to string for comparison
  const formatDateKey = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Group tasks by task_start_date
  const tasksByDate = useMemo(() => {
    const grouped = {};

    // Process checklist tasks using task_start_date
    if (checklistTasks && checklistTasks.length > 0) {
      checklistTasks.forEach((task) => {
        const dateKey = formatDateKey(task.task_start_date);
        if (dateKey) {
          if (!grouped[dateKey]) {
            grouped[dateKey] = { checklist: [], delegation: [] };
          }
          grouped[dateKey].checklist.push(task);
        }
      });
    }

    // Process delegation tasks using task_start_date
    if (delegationTasks && delegationTasks.length > 0) {
      delegationTasks.forEach((task) => {
        const dateKey = formatDateKey(task.task_start_date);
        if (dateKey) {
          if (!grouped[dateKey]) {
            grouped[dateKey] = { checklist: [], delegation: [] };
          }
          grouped[dateKey].delegation.push(task);
        }
      });
    }

    return grouped;
  }, [checklistTasks, delegationTasks]);

  // Get tasks for selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return { checklist: [], delegation: [] };
    const dateKey = formatDateKey(selectedDate);
    return tasksByDate[dateKey] || { checklist: [], delegation: [] };
  }, [selectedDate, tasksByDate]);

  // Navigation
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle date click
  const handleDateClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setShowPopup(true);
  };

  const { daysInMonth, startingDay, year, month } = getDaysInMonth(currentDate);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();

  // Format time
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Format display date
  const formatDisplayDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <AdminLayout>
      <div className="h-full flex flex-col">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800">{monthNames[month]} {year}</h1>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
            >
              Today
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-gray-600">Checklist</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-600">Delegation</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {dayNames.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-semibold text-gray-500 bg-gray-50"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 flex-1">
            {/* Empty cells before first day */}
            {Array.from({ length: startingDay }).map((_, index) => (
              <div key={`empty-${index}`} className="border-b border-r border-gray-100 bg-gray-50/50"></div>
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayTasks = tasksByDate[dateKey];
              const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
              const totalTasks = dayTasks ? (dayTasks.checklist.length + dayTasks.delegation.length) : 0;

              return (
                <div
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`relative min-h-[80px] p-1 border-b border-r border-gray-100 cursor-pointer transition-colors hover:bg-blue-50 ${
                    isToday ? 'bg-blue-50/70' : ''
                  }`}
                >
                  {/* Date Number */}
                  <div className={`text-sm font-medium mb-1 ${
                    isToday 
                      ? 'bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center' 
                      : 'text-gray-700'
                  }`}>
                    {day}
                  </div>

                  {/* Task Indicators */}
                  {dayTasks && (
                    <div className="space-y-0.5">
                      {dayTasks.checklist.length > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          <span className="text-[10px] text-purple-700 font-medium truncate">
                            {dayTasks.checklist.length} Checklist
                          </span>
                        </div>
                      )}
                      {dayTasks.delegation.length > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <span className="text-[10px] text-orange-700 font-medium truncate">
                            {dayTasks.delegation.length} Delegation
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Task count badge */}
                  {totalTasks > 0 && (
                    <div className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {totalTasks}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Fill remaining cells */}
            {Array.from({ length: (7 - ((startingDay + daysInMonth) % 7)) % 7 }).map((_, index) => (
              <div key={`end-${index}`} className="border-b border-r border-gray-100 bg-gray-50/50"></div>
            ))}
          </div>
        </div>

        {/* Task Popup */}
        {showPopup && selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
              {/* Popup Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-xl">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Tasks</h2>
                  <p className="text-sm text-gray-500">{formatDisplayDate(selectedDate)}</p>
                </div>
                <button
                  onClick={() => setShowPopup(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Popup Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {selectedDateTasks.checklist.length === 0 && selectedDateTasks.delegation.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Circle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No tasks for this date</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Checklist Tasks */}
                    {selectedDateTasks.checklist.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          Checklist Tasks ({selectedDateTasks.checklist.length})
                        </h3>
                        <div className="space-y-2">
                          {selectedDateTasks.checklist.map((task, index) => (
                            <div key={index} className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">
                                    {task.task_description || task.task_id || "Task"}
                                  </p>
                                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                                    {task.name && (
                                      <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {task.name}
                                      </span>
                                    )}
                                    {task.department && (
                                      <span className="text-gray-400">
                                        {task.department}
                                      </span>
                                    )}
                                    {task.task_start_date && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatTime(task.task_start_date)}
                                      </span>
                                    )}
                                  </div>
                                  {task.status && (
                                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                                      task.status === 'Done' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {task.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delegation Tasks */}
                    {selectedDateTasks.delegation.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          Delegation Tasks ({selectedDateTasks.delegation.length})
                        </h3>
                        <div className="space-y-2">
                          {selectedDateTasks.delegation.map((task, index) => (
                            <div key={index} className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <FileText className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">
                                    {task.task_description || task.task_id || "Task"}
                                  </p>
                                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                                    {task.name && (
                                      <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {task.name}
                                      </span>
                                    )}
                                    {task.given_by && (
                                      <span className="text-gray-400">
                                        Given by: {task.given_by}
                                      </span>
                                    )}
                                    {task.task_start_date && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatTime(task.task_start_date)}
                                      </span>
                                    )}
                                  </div>
                                  {task.status && (
                                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                                      task.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {task.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Popup Footer */}
              <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <button
                  onClick={() => setShowPopup(false)}
                  className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
