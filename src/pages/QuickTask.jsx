"use client"
import { useEffect, useState, useCallback, useRef } from "react";
import SearchBar from "../components/SearchBar";
import { format } from 'date-fns';
import { Search, ChevronDown, Filter, Trash2, Edit, Save, X } from "lucide-react";
import AdminLayout from "../components/layout/AdminLayout";
import DelegationPage from "./delegation-data";
import { useDispatch, useSelector } from "react-redux";
import { deleteChecklistTask, uniqueChecklistTaskData, uniqueDelegationTaskData, updateChecklistTask, fetchUsers, resetChecklistPagination, resetDelegationPagination, fetchQuickTaskFilterOptions } from "../redux/slice/quickTaskSlice";


export default function QuickTask() {
  const [tasks, setTasks] = useState([]);
  const [delegationLoading, setDelegationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [activeTab, setActiveTab] = useState('checklist');
  const [nameFilter, setNameFilter] = useState('');
  const [freqFilter, setFreqFilter] = useState('');
  const [givenByFilter, setGivenByFilter] = useState('');
  const [dateShortcutFilter, setDateShortcutFilter] = useState('all');
  const [reminderFilter, setReminderFilter] = useState('all');
  const [attachmentFilter, setAttachmentFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  
  const tableContainerRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState({
    name: false,
    frequency: false
  });
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteScope, setDeleteScope] = useState('past');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [checklistPageNum, setChecklistPageNum] = useState(1);
  const PAGE_SIZE = 50;

  const { 
    quickTask,
    loading,
    delegationTasks,
    users,
    checklistPage,
    checklistTotal,
    checklistHasMore,
    delegationPage,
    delegationHasMore,
    filterOptions
  } = useSelector((state) => state.quickTask);
  
  const givenByOptions = filterOptions?.givenBy || [];
  const nameOptions = filterOptions?.names || [];
  const frequencyOptions = filterOptions?.frequencies || [];
  
  const dispatch = useDispatch();

  const resolveShortcutRange = (shortcut) => {
    if (!shortcut || shortcut === "all") {
      return { startDate: "", endDate: "" };
    }
    const now = new Date();
    const getLocalDateString = (date) => {
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
      return localDate.toISOString().split("T")[0];
    };

    switch (shortcut) {
      case "today": {
        const d = getLocalDateString(now);
        return { startDate: d, endDate: d };
      }
      case "yesterday": {
        const prev = new Date();
        prev.setDate(now.getDate() - 1);
        const d = getLocalDateString(prev);
        return { startDate: d, endDate: d };
      }
      case "this week": {
        const currentDay = now.getDay();
        const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(now);
        monday.setDate(now.getDate() + distanceToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return {
          startDate: getLocalDateString(monday),
          endDate: getLocalDateString(sunday),
        };
      }
      case "last week": {
        const currentDay = now.getDay();
        const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        const mondayThisWeek = new Date(now);
        mondayThisWeek.setDate(now.getDate() + distanceToMonday);
        const mondayLastWeek = new Date(mondayThisWeek);
        mondayLastWeek.setDate(mondayThisWeek.getDate() - 7);
        const sundayLastWeek = new Date(mondayLastWeek);
        sundayLastWeek.setDate(mondayLastWeek.getDate() + 6);
        return {
          startDate: getLocalDateString(mondayLastWeek),
          endDate: getLocalDateString(sundayLastWeek),
        };
      }
      case "this month": {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          startDate: getLocalDateString(startOfMonth),
          endDate: getLocalDateString(endOfMonth),
        };
      }
      case "last month": {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          startDate: getLocalDateString(startOfLastMonth),
          endDate: getLocalDateString(endOfLastMonth),
        };
      }
      default:
        return { startDate: "", endDate: "" };
    }
  };

  const fetchFilteredChecklist = (customFilters = {}) => {
    const filters = {
      page: 0,
      pageSize: 50,
      nameFilter: customFilters.hasOwnProperty('nameFilter') ? customFilters.nameFilter : nameFilter,
      givenByFilter: customFilters.hasOwnProperty('givenByFilter') ? customFilters.givenByFilter : givenByFilter,
      frequencyFilter: customFilters.hasOwnProperty('freqFilter') ? customFilters.freqFilter : freqFilter,
      reminderFilter: customFilters.hasOwnProperty('reminderFilter') ? customFilters.reminderFilter : reminderFilter,
      attachmentFilter: customFilters.hasOwnProperty('attachmentFilter') ? customFilters.attachmentFilter : attachmentFilter,
      startDate: customFilters.hasOwnProperty('startDate') ? customFilters.startDate : dateRange.startDate,
      endDate: customFilters.hasOwnProperty('endDate') ? customFilters.endDate : dateRange.endDate,
      append: false
    };

    setChecklistPageNum(1);
    dispatch(resetChecklistPagination());
    dispatch(uniqueChecklistTaskData(filters));
  };

useEffect(() => {
  dispatch(fetchUsers());
  dispatch(fetchQuickTaskFilterOptions());
  dispatch(resetChecklistPagination());
  dispatch(uniqueChecklistTaskData({ page: 0, pageSize: 50, nameFilter: '' }));
}, [dispatch]);


// Numbered pagination — fetch a specific page (replaces current page data)
const handleChecklistPageChange = useCallback((newPage) => {
  setChecklistPageNum(newPage);
  setSelectedTasks([]);
  dispatch(uniqueChecklistTaskData({
    page: newPage - 1,
    pageSize: PAGE_SIZE,
    nameFilter,
    givenByFilter,
    frequencyFilter: freqFilter,
    reminderFilter,
    attachmentFilter,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    append: false,
  }));
  if (tableContainerRef.current) tableContainerRef.current.scrollTop = 0;
}, [nameFilter, givenByFilter, freqFilter, reminderFilter, attachmentFilter, dateRange, dispatch]);

  const userRole = localStorage.getItem("role");

  // Edit functionality
  const handleEditClick = (task) => {
    setEditingTaskId(task.task_id);
    setEditFormData({
      task_id: task.task_id,
      department: task.department || '',
      given_by: task.given_by || '',
      name: task.name || '',
      task_description: task.task_description || '',
      task_start_date: task.task_start_date || '',
      frequency: task.frequency || '',
      enable_reminder: task.enable_reminder || '',
      require_attachment: task.require_attachment || '',
      remark: task.remark || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    if (!editFormData.task_id) return;

    // Find the original task data for matching
    const originalTask = quickTask.find(task => task.task_id === editFormData.task_id);
    if (!originalTask) return;

    setIsSaving(true);
    try {
      await dispatch(updateChecklistTask({
        updatedTask: editFormData,
        originalTask: {
          department: originalTask.department,
          name: originalTask.name,
          task_description: originalTask.task_description
        }
      })).unwrap();

      setEditingTaskId(null);
      setEditFormData({});

      // Refresh the current page to show updated rows
      dispatch(uniqueChecklistTaskData({
        page: checklistPageNum - 1,
        pageSize: PAGE_SIZE,
        nameFilter,
        givenByFilter,
        frequencyFilter: freqFilter,
        reminderFilter,
        attachmentFilter,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        append: false
      }));

    } catch (error) {
      console.error("Failed to update task:", error);
      setError("Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Change your checkbox to store whole row instead of only id
  const handleCheckboxChange = (task) => {
    if (selectedTasks.find(t => t.task_id === task.task_id)) {
      setSelectedTasks(selectedTasks.filter(t => t.task_id !== task.task_id));
    } else {
      setSelectedTasks([...selectedTasks, task]);
    }
  };

  // Select all
  const handleSelectAll = () => {
    if (selectedTasks.length === filteredChecklistTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredChecklistTasks); // store full rows
    }
  };

  // Delete
  const handleDeleteSelected = async () => {
    if (selectedTasks.length === 0) return;
    setDeleteScope('past');
    setDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setDeleteDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedTasks.length === 0) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteChecklistTask({
        tasks: selectedTasks,
        deleteScope
      })).unwrap();
      dispatch(resetChecklistPagination());
      setChecklistPageNum(1);
      dispatch(uniqueChecklistTaskData({
        page: 0,
        pageSize: PAGE_SIZE,
        nameFilter,
        givenByFilter,
        frequencyFilter: freqFilter,
        reminderFilter,
        attachmentFilter,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        append: false
      }));
      setSelectedTasks([]);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete tasks:", error);
      setError("Failed to delete tasks");
    } finally {
      setIsDeleting(false);
    }
  };

  const CONFIG = {
    APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzXzqnKmbeXw3i6kySQcBOwxHQA7y8WBFfEe69MPbCR-jux0Zte7-TeSKi8P4CIFkhE/exec",
    SHEET_NAME: "Unique task",
    DELEGATION_SHEET: "Delegation",
    PAGE_CONFIG: {
      title: "Task Management",
      description: "Showing all unique tasks"
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "";
    try {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? dateValue : format(date, 'dd/MM/yyyy HH:mm');
    } catch {
      return dateValue;
    }
  };

  const requestSort = (key) => {
    if (loading) return;
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleDropdown = (dropdown) => {
    setDropdownOpen(prev => ({
      ...prev,
      [dropdown]: !prev[dropdown]
    }));
  };

const handleNameFilterSelect = (name) => {
  setNameFilter(name);
  if (activeTab === 'checklist') {
    fetchFilteredChecklist({ nameFilter: name });
  } else {
    setChecklistPageNum(1);
    dispatch(resetDelegationPagination());
    dispatch(uniqueDelegationTaskData({ 
      page: 0, 
      pageSize: 50, 
      nameFilter: name,
      append: false 
    }));
  }
  setDropdownOpen({ ...dropdownOpen, name: false });
};

const handleFrequencyFilterSelect = (freq) => {
  setFreqFilter(freq);
  if (activeTab === 'checklist') {
    fetchFilteredChecklist({ freqFilter: freq });
  }
  setDropdownOpen({ ...dropdownOpen, frequency: false });
};

const clearNameFilter = () => {
  setNameFilter('');
  if (activeTab === 'checklist') {
    fetchFilteredChecklist({ nameFilter: '' });
  } else {
    setChecklistPageNum(1);
    dispatch(resetDelegationPagination());
    dispatch(uniqueDelegationTaskData({ 
      page: 0, 
      pageSize: 50, 
      nameFilter: '',
      append: false 
    }));
  }
  setDropdownOpen({ ...dropdownOpen, name: false });
};

const clearFrequencyFilter = () => {
  setFreqFilter('');
  if (activeTab === 'checklist') {
    fetchFilteredChecklist({ freqFilter: '' });
  }
  setDropdownOpen({ ...dropdownOpen, frequency: false });
};

const handleDateShortcutSelect = (shortcut) => {
  setDateShortcutFilter(shortcut);
  const range = resolveShortcutRange(shortcut);
  setDateRange(range);
  fetchFilteredChecklist({ startDate: range.startDate, endDate: range.endDate });
};

  // FIXED: Added proper null/undefined checks and string validation
const allNames = [
  ...new Set(users.map(user => user.user_name))
].filter(name => name && typeof name === 'string' && name.trim() !== '')
 .sort();

const allDepartments = [
  ...new Set(quickTask.map(t => t.department).filter(d => d && d.trim() !== ''))
].sort();

  // Keep allFrequencies as is (or modify if you want to fetch frequencies from elsewhere)
  const allFrequencies = [
    ...new Set([
      ...quickTask.map(task => task.frequency),
      ...delegationTasks.map(task => task.frequency)
    ])
  ].filter(frequency => frequency && typeof frequency === 'string' && frequency.trim() !== '');


const filteredChecklistTasks = quickTask.filter(task => {
  const searchTermPass = !searchTerm || task.task_description
    ?.toLowerCase()
    .includes(searchTerm.toLowerCase());
  return searchTermPass;
}).sort((a, b) => {
  if (!sortConfig.key) return 0;
  if (a[sortConfig.key] < b[sortConfig.key]) {
    return sortConfig.direction === 'asc' ? -1 : 1;
  }
  if (a[sortConfig.key] > b[sortConfig.key]) {
    return sortConfig.direction === 'asc' ? 1 : -1;
  }
  return 0;
});

  function formatTimestampToDDMMYYYY(timestamp) {
    if (!timestamp || timestamp === "" || timestamp === null) {
      return "—"; // or just return ""
    }

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return "—"; // fallback if it's not a valid date
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  // Format timestamp with time (DD/MM/YYYY HH:MM:SS)
  function formatTimestampWithTime(timestamp) {
    if (!timestamp || timestamp === "" || timestamp === null) {
      return "—";
    }

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return "—";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return (
      <div>
        <div className="font-medium">{`${day}/${month}/${year}`}</div>
        <div className="text-xs text-gray-500">{`${hours}:${minutes}:${seconds}`}</div>
      </div>
    );
  }

  // Calculate the last task date based on task_start_date and frequency
  function calculateLastTaskDate(task) {
    if (!task || !task.task_start_date) return "—";
    
    // If task has no frequency or is a one-time task, return start date
    if (!task.frequency || task.frequency.toLowerCase() === 'once') {
      return formatTimestampToDDMMYYYY(task.task_start_date);
    }

    // For now, return a dash - this would ideally query the max task_start_date
    // from all tasks with same description, name, and department
    return "—";
  }

  // Reusable numbered pagination bar (matches Admin Approval / other pages)
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    const pages = [];
    const delta = 2;
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      pages.push(i);
    }
    return (
      <div className="flex items-center justify-center gap-1 py-3 border-t border-gray-200 bg-white">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-purple-50 hover:border-purple-300 transition-colors"
        >
          «
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-purple-50 hover:border-purple-300 transition-colors"
        >
          ‹
        </button>
        {pages[0] > 1 && <span className="px-1 text-xs text-gray-400">…</span>}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
              p === currentPage
                ? 'bg-purple-600 text-white border-purple-600'
                : 'border-gray-300 hover:bg-purple-50 hover:border-purple-300'
            }`}
          >
            {p}
          </button>
        ))}
        {pages[pages.length - 1] < totalPages && <span className="px-1 text-xs text-gray-400">…</span>}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-purple-50 hover:border-purple-300 transition-colors"
        >
          ›
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-purple-50 hover:border-purple-300 transition-colors"
        >
          »
        </button>
        <span className="ml-2 text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
      </div>
    );
  };

  const checklistTotalPages = Math.ceil(((searchTerm.trim() || freqFilter) ? filteredChecklistTasks.length : (checklistTotal || 0)) / PAGE_SIZE);

  return (
    <AdminLayout>
      <style>{`
        .compact-table {
          table-layout: fixed !important;
          width: 100% !important;
          border-collapse: collapse !important;
        }
        .compact-table th {
          padding: 0.35rem 0.2rem !important;
          font-size: 0.68rem !important;
          line-height: 1.15 !important;
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
          text-align: center !important;
          vertical-align: middle !important;
          border: 1px solid #d1d5db !important;
        }
        .compact-table td {
          padding: 0.3rem 0.2rem !important;
          font-size: 0.68rem !important;
          line-height: 1.15 !important;
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
          text-align: center !important;
          vertical-align: middle !important;
          border: 1px solid #e5e7eb !important;
        }
        .compact-table td > div, .compact-table td > span {
          font-size: 0.68rem !important;
          line-height: 1.15 !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
        }
        .compact-table input[type="text"], .compact-table select, .compact-table textarea {
          font-size: 0.65rem !important;
          padding: 0.15rem !important;
        }
      `}</style>
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Delete selected checklist tasks</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedTasks.length} task(s) selected
                </p>
              </div>
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 px-5 py-4">
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50">
                <input
                  type="radio"
                  name="deleteScope"
                  value="past"
                  checked={deleteScope === 'past'}
                  onChange={(e) => setDeleteScope(e.target.value)}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">Today and previous pending tasks</span>
                  <span className="block text-sm text-gray-500">Deletes matching pending rows up to today's date only.</span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50">
                <input
                  type="radio"
                  name="deleteScope"
                  value="future"
                  checked={deleteScope === 'future'}
                  onChange={(e) => setDeleteScope(e.target.value)}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">Future pending tasks</span>
                  <span className="block text-sm text-gray-500">Deletes matching pending rows after today's date only.</span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50">
                <input
                  type="radio"
                  name="deleteScope"
                  value="all"
                  checked={deleteScope === 'all'}
                  onChange={(e) => setDeleteScope(e.target.value)}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">Delete entire task</span>
                  <span className="block text-sm text-gray-500">Permanently deletes all rows for this task (past, future, and completed).</span>
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-4">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={16} />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-30 bg-white pb-4 border-b border-gray-200">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-purple-700">
              {CONFIG.PAGE_CONFIG.title}
            </h1>
            <p className="text-purple-600 text-sm">
              {activeTab === 'checklist'
                ? `Showing ${quickTask.length} checklist tasks`
                : `Showing delegation tasks`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex border border-purple-200 rounded-md overflow-hidden self-start">
             <button
  className={`px-4 py-2 text-sm font-medium ${activeTab === 'checklist' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
  onClick={() => {
    setActiveTab('checklist');
    dispatch(resetChecklistPagination());
    dispatch(uniqueChecklistTaskData({
      page: 0,
      pageSize: 50,
      nameFilter,
      givenByFilter,
      frequencyFilter: freqFilter,
      reminderFilter,
      attachmentFilter,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    }));
  }}
>
                Checklist
              </button>
              <button
  className={`px-4 py-2 text-sm font-medium ${activeTab === 'delegation' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
  onClick={() => {
    setActiveTab('delegation');
    dispatch(resetDelegationPagination());
    dispatch(uniqueDelegationTaskData({ page: 0, pageSize: 50, nameFilter }));
  }}
>
                Delegation
              </button>
            </div>

            <SearchBar
              className="flex-1 min-w-[200px]"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading || delegationLoading}
            />

            <div className="flex gap-2">
              <div className="relative">
                <div className="flex items-center gap-2">
                  {/* Input with datalist for autocomplete */}
                 <div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
  <input
    type="text"
    list="nameOptions"
    placeholder="Type or select name..."
    value={nameFilter}
    onChange={(e) => {
      const typedName = e.target.value;
      setNameFilter(typedName); // Always update the input value
      
      // Only trigger DB fetch if the value is empty or matches a name in the list
      if (typedName === '') {
        clearNameFilter();
      } else if (allNames.includes(typedName)) {
        handleNameFilterSelect(typedName);
      }
    }}
    onBlur={(e) => {
      // When input loses focus, if the typed value doesn't match any name, clear it
      const typedName = e.target.value;
      if (typedName && !allNames.includes(typedName)) {
        // Optional: You can either clear it or keep it for manual filtering
        // setNameFilter('');
        // clearNameFilter();
      }
    }}
    onKeyDown={(e) => {
      // Allow pressing Enter to apply the filter even if not exact match
      if (e.key === 'Enter') {
        if (nameFilter === '') {
          clearNameFilter();
        } else {
          // Apply the filter with whatever is typed
          handleNameFilterSelect(nameFilter);
        }
      }
    }}
    className="w-48 pl-10 pr-4 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
  />
  <datalist id="nameOptions">
    {allNames.map(name => (
      <option key={name} value={name} />
    ))}
  </datalist>

  {/* Clear button for input */}
  {nameFilter && (
    <button
      onClick={() => {
        setNameFilter('');
        clearNameFilter();
      }}
      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      <X size={16} />
    </button>
  )}
</div>

                  {/* Dropdown button */}
                  <button
                    onClick={() => toggleDropdown('name')}
                    className="flex items-center gap-1 px-3 py-2 border border-purple-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <ChevronDown size={16} className={`transition-transform ${dropdownOpen.name ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Dropdown menu */}
                {dropdownOpen.name && (
                  <div className="absolute z-50 mt-1 w-56 rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto top-full right-0">
                    <div className="py-1">
                      <button
                        onClick={clearNameFilter}
                        className={`block w-full text-left px-4 py-2 text-sm ${!nameFilter ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        All Names
                      </button>
                      {allNames.map(name => (
                        <button
                          key={name}
                          onClick={() => {
                            handleNameFilterSelect(name);
                            setDropdownOpen({ ...dropdownOpen, name: false });
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm ${nameFilter === name ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => toggleDropdown('frequency')}
                  className="flex items-center gap-2 px-3 py-2 border border-purple-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4" />
                  {freqFilter || 'Filter by Frequency'}
                  <ChevronDown size={16} className={`transition-transform ${dropdownOpen.frequency ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen.frequency && (
                  <div className="absolute z-50 mt-1 w-56 rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto">
                    <div className="py-1">
                      <button
                        onClick={clearFrequencyFilter}
                        className={`block w-full text-left px-4 py-2 text-sm ${!freqFilter ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        All Frequencies
                      </button>
                      {allFrequencies.map(freq => (
                        <button
                          key={freq}
                          onClick={() => handleFrequencyFilterSelect(freq)}
                          className={`block w-full text-left px-4 py-2 text-sm ${freqFilter === freq ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {selectedTasks.length > 0 && activeTab === 'checklist' && userRole === "super_admin" && userRole !== "pc role" && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={16} />
                {isDeleting ? 'Deleting...' : `Delete (${selectedTasks.length})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 p-4 rounded-md text-red-800 text-center">
          {error}{" "}
          <button
            onClick={() => {
              dispatch(uniqueChecklistTaskData())
            }}
            className="underline ml-2 hover:text-red-600"
          >
            Try again
          </button>
        </div>
      )}

      {loading && activeTab === 'delegation' && (
        <div className="mt-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-2"></div>
          <p className="text-purple-600">Loading delegation data...</p>
        </div>
      )}

      {!error && (
        <>
          {activeTab === 'checklist' ? (
            <div className="mt-4 rounded-lg border border-purple-200 shadow-md bg-white overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-3 sm:p-4 flex justify-between items-center">
                <div>
                  <h2 className="text-purple-700 font-medium text-sm sm:text-base">Checklist Tasks</h2>
                  <p className="text-purple-600 text-xs sm:text-sm mt-1">
                    {CONFIG.PAGE_CONFIG.description}
                  </p>
                </div>
                {selectedTasks.length > 0 && (
                  <span className="text-sm text-purple-600">
                    {selectedTasks.length} task(s) selected
                  </span>
                )}
              </div>
              {/* <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}> */}
<div 
  ref={tableContainerRef}
  className="overflow-x-auto overflow-y-auto custom-scrollbar" 
  style={{ maxHeight: 'calc(100vh - 280px)' }}
>
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3 p-3">
                  {filteredChecklistTasks.length > 0 ? (
                    filteredChecklistTasks.map((task, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedTasks.some(selectedTask => selectedTask.task_id === task.task_id)}
                              onChange={() => handleCheckboxChange(task)}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              task.frequency === 'Daily' ? 'bg-blue-100 text-blue-800' :
                              task.frequency === 'Weekly' ? 'bg-green-100 text-green-800' :
                              task.frequency === 'Monthly' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.frequency}
                            </span>
                          </div>
                          {userRole === "super_admin" && userRole !== "pc role" && (
                            editingTaskId === task.task_id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={isSaving}
                                  className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                                >
                                  <Save size={12} />
                                  {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                                >
                                  <X size={12} />
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditClick(task)}
                                className="text-blue-600 text-xs underline"
                              >
                                Edit
                              </button>
                            )
                          )}
                        </div>
                        
                        {/* Task Description */}
                        {editingTaskId === task.task_id ? (
                          <textarea
                            value={editFormData.task_description}
                            onChange={(e) => handleInputChange('task_description', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-2"
                            rows="3"
                            placeholder="Task Description"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 mb-2">{task.task_description || "—"}</p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {/* Name */}
                          <div>
                            <span className="text-gray-500">Name:</span>{' '}
                            {editingTaskId === task.task_id ? (
                              <select
                                value={editFormData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs mt-1"
                              >
                                <option value="">Select name</option>
                                {editFormData.name && !allNames.includes(editFormData.name) && (
                                  <option value={editFormData.name}>{editFormData.name}</option>
                                )}
                                {allNames.map(name => (
                                  <option key={name} value={name}>{name}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="font-medium">{task.name || "—"}</span>
                            )}
                          </div>

                          {/* Department */}
                          <div>
                            <span className="text-gray-500">Dept:</span>{' '}
                            {editingTaskId === task.task_id ? (
                              <select
                                value={editFormData.department}
                                onChange={(e) => handleInputChange('department', e.target.value)}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs mt-1"
                              >
                                <option value="">Select department</option>
                                {editFormData.department && !allDepartments.includes(editFormData.department) && (
                                  <option value={editFormData.department}>{editFormData.department}</option>
                                )}
                                {allDepartments.map(dept => (
                                  <option key={dept} value={dept}>{dept}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="font-medium">{task.department || "—"}</span>
                            )}
                          </div>

                          {/* Given By */}
                          <div>
                            <span className="text-gray-500">Given By:</span>{' '}
                            {editingTaskId === task.task_id ? (
                              <select
                                value={editFormData.given_by}
                                onChange={(e) => handleInputChange('given_by', e.target.value)}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs mt-1"
                              >
                                <option value="">Select person</option>
                                {editFormData.given_by && !allNames.includes(editFormData.given_by) && (
                                  <option value={editFormData.given_by}>{editFormData.given_by}</option>
                                )}
                                {allNames.map(name => (
                                  <option key={name} value={name}>{name}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="font-medium">{task.given_by || "—"}</span>
                            )}
                          </div>
                          
                          {/* Start Date (non-editable) */}
                          <div>
                            <span className="text-gray-500">Start:</span>{' '}
                            <span className="font-medium">{formatTimestampToDDMMYYYY(task.task_start_date)}</span>
                          </div>
                          
                          {/* Reminder */}
                          <div>
                            <span className="text-gray-500">Reminder:</span>{' '}
                            {editingTaskId === task.task_id ? (
                              <select
                                value={editFormData.enable_reminder}
                                onChange={(e) => handleInputChange('enable_reminder', e.target.value)}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs mt-1"
                              >
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
                            ) : (
                              <span className="font-medium">{task.enable_reminder || "—"}</span>
                            )}
                          </div>
                          
                          {/* Attachment */}
                          <div>
                            <span className="text-gray-500">Attachment:</span>{' '}
                            {editingTaskId === task.task_id ? (
                              <select
                                value={editFormData.require_attachment}
                                onChange={(e) => handleInputChange('require_attachment', e.target.value)}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs mt-1"
                              >
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
                            ) : (
                              <span className="font-medium">{task.require_attachment || "—"}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      {searchTerm || nameFilter || freqFilter
                        ? "No tasks matching your filters"
                        : "No tasks available"}
                    </div>
                  )}
                </div>

                <table className="w-full divide-y divide-gray-200 hidden sm:table compact-table">
                  <colgroup>
                    <col style={{ width: '30px' }} />
                    <col style={{ width: '85px' }} />
                    <col style={{ width: '85px' }} />
                    <col style={{ width: '90px' }} />
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: '105px' }} />
                    <col style={{ width: '75px' }} />
                    <col style={{ width: '75px' }} />
                    <col style={{ width: '75px' }} />
                    <col style={{ width: '75px' }} />
                    <col style={{ width: '85px' }} />
                  </colgroup>
                  <thead className="bg-gray-50 sticky top-0 z-20">
                    <tr className="bg-gray-100">
                      <th className="px-1 py-1 border border-gray-200"></th>
                      <th className="px-1 py-1 border border-gray-200"></th>
                      <th className="px-1 py-1 border border-gray-200">
                        <select
                          value={givenByFilter}
                          onChange={(e) => {
                            setGivenByFilter(e.target.value);
                            fetchFilteredChecklist({ givenByFilter: e.target.value });
                          }}
                          className="w-full text-[10px] p-0.5 border border-gray-300 rounded font-normal bg-white text-center"
                        >
                          <option value="all">All</option>
                          {givenByOptions.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </th>
                      <th className="px-1 py-1 border border-gray-200">
                        <select
                          value={nameFilter}
                          onChange={(e) => {
                            setNameFilter(e.target.value);
                            fetchFilteredChecklist({ nameFilter: e.target.value });
                          }}
                          className="w-full text-[10px] p-0.5 border border-gray-300 rounded font-normal bg-white text-center"
                        >
                          <option value="">All</option>
                          {nameOptions.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </th>
                      <th className="px-1 py-1 border border-gray-200"></th>
                      <th className="px-1 py-1 border border-gray-200 bg-yellow-50">
                        <select
                          value={dateShortcutFilter}
                          onChange={(e) => handleDateShortcutSelect(e.target.value)}
                          className="w-full text-[10px] p-0.5 border border-gray-300 rounded font-normal bg-white text-center"
                        >
                          <option value="all">All</option>
                          <option value="today">Today</option>
                          <option value="yesterday">Yesterday</option>
                          <option value="this week">This Week</option>
                          <option value="last week">Last Week</option>
                          <option value="this month">This Month</option>
                          <option value="last month">Last Month</option>
                        </select>
                      </th>
                      <th className="px-1 py-1 border border-gray-200 bg-yellow-50"></th>
                      <th className="px-1 py-1 border border-gray-200">
                        <select
                          value={freqFilter}
                          onChange={(e) => {
                            setFreqFilter(e.target.value);
                            fetchFilteredChecklist({ freqFilter: e.target.value });
                          }}
                          className="w-full text-[10px] p-0.5 border border-gray-300 rounded font-normal bg-white text-center"
                        >
                          <option value="all">All</option>
                          {frequencyOptions.map(freq => (
                            <option key={freq} value={freq}>{freq}</option>
                          ))}
                        </select>
                      </th>
                      <th className="px-1 py-1 border border-gray-200">
                        <select
                          value={reminderFilter}
                          onChange={(e) => {
                            setReminderFilter(e.target.value);
                            fetchFilteredChecklist({ reminderFilter: e.target.value });
                          }}
                          className="w-full text-[10px] p-0.5 border border-gray-300 rounded font-normal bg-white text-center"
                        >
                          <option value="all">All</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </th>
                      <th className="px-1 py-1 border border-gray-200">
                        <select
                          value={attachmentFilter}
                          onChange={(e) => {
                            setAttachmentFilter(e.target.value);
                            fetchFilteredChecklist({ attachmentFilter: e.target.value });
                          }}
                          className="w-full text-[10px] p-0.5 border border-gray-300 rounded font-normal bg-white text-center"
                        >
                          <option value="all">All</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </th>
                      <th className="px-1 py-1 border border-gray-200"></th>
                    </tr>
                    <tr>
                      <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={selectedTasks.length === filteredChecklistTasks.length && filteredChecklistTasks.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </th>
                      {[
                        { key: 'department', label: 'Department' },
                        { key: 'given_by', label: 'Given By' },
                        { key: 'name', label: 'Name' },
                        { key: 'task_description', label: 'Task Description', minWidth: 'whitespace-nowrap' },
                        { key: 'task_start_date', label: 'Start Date', bg: 'bg-yellow-50' },
                        { key: 'submission_date', label: 'End Date', bg: 'bg-yellow-50' },
                        { key: 'frequency', label: 'Frequency' },
                        { key: 'enable_reminder', label: 'Reminders' },
                        { key: 'require_attachment', label: 'Attachment' },
                        { key: 'actions', label: 'Actions' },
                      ].map((column) => (
                        <th
                          key={column.label}
                          className={`px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.bg || ''} ${column.minWidth || ''} ${column.key && column.key !== 'actions' ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                          onClick={() => column.key && column.key !== 'actions' && requestSort(column.key)}
                        >
                          <div className="flex items-center">
                            {column.label}
                            {sortConfig.key === column.key && (
                              <span className="ml-1">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredChecklistTasks.length > 0 ? (
                      filteredChecklistTasks.map((task, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedTasks.some(selectedTask => selectedTask.task_id === task.task_id)}
                              onChange={() => handleCheckboxChange(task)}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                          </td>

                          {/* Department */}
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {editingTaskId === task.task_id ? (
                              <select
                                value={editFormData.department}
                                onChange={(e) => handleInputChange('department', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="">Select department</option>
                                {editFormData.department && !allDepartments.includes(editFormData.department) && (
                                  <option value={editFormData.department}>{editFormData.department}</option>
                                )}
                                {allDepartments.map(dept => (
                                  <option key={dept} value={dept}>{dept}</option>
                                ))}
                              </select>
                            ) : (
                              task.department
                            )}
                          </td>

                          {/* Given By */}
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                            {editingTaskId === task.task_id ? (
                              <select
                                value={editFormData.given_by}
                                onChange={(e) => handleInputChange('given_by', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="">Select person</option>
                                {editFormData.given_by && !allNames.includes(editFormData.given_by) && (
                                  <option value={editFormData.given_by}>{editFormData.given_by}</option>
                                )}
                                {allNames.map(name => (
                                  <option key={name} value={name}>{name}</option>
                                ))}
                              </select>
                            ) : (
                              task.given_by
                            )}
                          </td>

                          {/* Name */}
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                            {editingTaskId === task.task_id ? (
                              <select
                                value={editFormData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="">Select name</option>
                                {editFormData.name && !allNames.includes(editFormData.name) && (
                                  <option value={editFormData.name}>{editFormData.name}</option>
                                )}
                                {allNames.map(name => (
                                  <option key={name} value={name}>{name}</option>
                                ))}
                              </select>
                            ) : (
                              task.name
                            )}
                          </td>

                          {/* Task Description */}
                          <td className="px-2 sm:px-6 py-2 sm:py-4 text-sm text-gray-500 max-w-xs">
                            {editingTaskId === task.task_id ? (
                              <textarea
                                value={editFormData.task_description}
                                onChange={(e) => handleInputChange('task_description', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                rows="3"
                              />
                            ) : (
                              <div className="break-words">
                                {task.task_description}
                              </div>
                            )}
                          </td>

                          {/* Task Start Date with Time */}
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 bg-yellow-50">
                            {editingTaskId === task.task_id ? (
                              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-sm cursor-not-allowed">
                                {formatTimestampWithTime(task.task_start_date)}
                              </span>
                            ) : (
                              formatTimestampWithTime(task.task_start_date)
                            )}
                          </td>

                          {/* End Date (Last Task Date) */}
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 bg-yellow-50">
                            {calculateLastTaskDate(task)}
                          </td>

                          {/* Frequency - Non-editable */}
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs ${task.frequency === 'Daily' ? 'bg-blue-100 text-blue-800' :
                              task.frequency === 'Weekly' ? 'bg-green-100 text-green-800' :
                                task.frequency === 'Monthly' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                              }${editingTaskId === task.task_id ? ' opacity-60 cursor-not-allowed' : ''}`}>
                              {task.frequency}
                            </span>
                          </td>

                          {/* Enable Reminders */}
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                            {editingTaskId === task.task_id ? (
                              <select
                                value={editFormData.enable_reminder}
                                onChange={(e) => handleInputChange('enable_reminder', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
                            ) : (
                              task.enable_reminder || "—"
                            )}
                          </td>

                          {/* Require Attachment */}
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                            {editingTaskId === task.task_id ? (
                              <select
                                value={editFormData.require_attachment}
                                onChange={(e) => handleInputChange('require_attachment', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
                            ) : (
                              task.require_attachment || "—"
                            )}
                          </td>

                          {/* Actions */}
                          {/* Actions */}
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                            {editingTaskId === task.task_id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={isSaving}
                                  className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                  <Save size={14} />
                                  {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                  <X size={14} />
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              // REMOVED THE submission_date CHECK - ALWAYS SHOW EDIT BUTTON
                              userRole === "super_admin" && userRole !== "pc role" && (
                              <button
                                onClick={() => handleEditClick(task)}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                <Edit size={14} />
                                Edit
                              </button>
                              )
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={11} className="px-2 sm:px-6 py-2 sm:py-4 text-center text-gray-500">
                          {searchTerm || nameFilter || freqFilter
                            ? "No tasks matching your filters"
                            : "No tasks available"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {loading && (
                <div className="text-center py-3 border-t border-gray-100">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              )}
              <Pagination
                currentPage={checklistPageNum}
                totalPages={checklistTotalPages}
                onPageChange={handleChecklistPageChange}
              />
            </div>
          ) : (
            <DelegationPage
              searchTerm={searchTerm}
              nameFilter={nameFilter}
              freqFilter={freqFilter}
              setNameFilter={setNameFilter}
              setFreqFilter={setFreqFilter}
            />
          )}
        </>
      )}
    </AdminLayout>
  );
}
