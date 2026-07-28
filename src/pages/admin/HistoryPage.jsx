"use client"
import { useState, useEffect, useMemo, useRef } from "react"
import SearchBar from "../../components/SearchBar"
import { Search, CheckCircle2, RotateCcw } from "lucide-react"
import AdminLayout from "../../components/layout/AdminLayout"
import { useDispatch, useSelector } from "react-redux"
import { checklistHistoryData, fetchChecklistFilterOptions } from "../../redux/slice/checklistSlice"
import { postChecklistAdminDoneAPI, revertChecklistAdminDoneAPI } from "../../redux/api/checkListApi"
import { postDelegationAdminDoneAPI, revertDelegationTaskAPI } from "../../redux/api/delegationApi"
import { uniqueDoerNameData } from "../../redux/slice/assignTaskSlice"
import { delegationDoneData, getDelegationFilterOptionsThunk } from "../../redux/slice/delegationSlice"

function HistoryPage() {
  const [activeTab, setActiveTab] = useState("checklist") // 'checklist' or 'delegation'
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMembers, setSelectedMembers] = useState([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")
  const [currentPageHistory, setCurrentPageHistory] = useState(1)
  const [currentPageDelegation, setCurrentPageDelegation] = useState(1)
  const ITEMS_PER_PAGE = 50
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [approvalStatusFilter, setApprovalStatusFilter] = useState("pending") // 'all', 'pending', 'completed'

  // Admin approval states
  const [selectedHistoryItems, setSelectedHistoryItems] = useState([])
  const [selectedDelegationItems, setSelectedDelegationItems] = useState([])
  const [markingAsDone, setMarkingAsDone] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    itemCount: 0,
    type: "checklist" // 'checklist' or 'delegation'
  })
  const [adminRemarks, setAdminRemarks] = useState({}) // New state for admin remarks
  const [adminReplyData, setAdminReplyData] = useState({}) // New state for admin reply
  const [revertingTaskId, setRevertingTaskId] = useState(null)

  // Multi-Filter states
  const [nameFilter, setNameFilter] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("")
  const [fileFilter, setFileFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [submissionFilter, setSubmissionFilter] = useState("all")
  const [deadlineFilter, setDeadlineFilter] = useState("all")
  const [remarksFilter, setRemarksFilter] = useState("all")
  const [frequencyFilter, setFrequencyFilter] = useState("all")
  const [givenByFilter, setGivenByFilter] = useState("")

  // Delegation Multi-Filter states
  const [delegationAdminDoneFilter, setDelegationAdminDoneFilter] = useState("all") // 'all', 'pending', 'completed'
  const [delegationGivenByFilter, setDelegationGivenByFilter] = useState("all")
  const [delegationNameFilter, setDelegationNameFilter] = useState("all")
  const [delegationDateShortcutFilter, setDelegationDateShortcutFilter] = useState("all")
  const [delegationFreqFilter, setDelegationFreqFilter] = useState("all")
  const [delegationReminderFilter, setDelegationReminderFilter] = useState("all")
  const [delegationAttachmentFilter, setDelegationAttachmentFilter] = useState("all")
  const [delegationDateRange, setDelegationDateRange] = useState({ startDate: "", endDate: "" })

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

  const handleDelegationDateShortcutSelect = (shortcut) => {
    setDelegationDateShortcutFilter(shortcut);
    const range = resolveShortcutRange(shortcut);
    setDelegationDateRange(range);
  };

  // Multi-Filter handlers
  const handleNameFilterChange = (e) => setNameFilter(e.target.value)
  const handleDepartmentFilterChange = (e) => setDepartmentFilter(e.target.value)
  const handleGivenByFilterChange = (e) => setGivenByFilter(e.target.value)
  const handleFileFilterChange = (e) => setFileFilter(e.target.value)
  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value)
  const handleSubmissionFilterChange = (e) => setSubmissionFilter(e.target.value)
  const handleDeadlineFilterChange = (e) => setDeadlineFilter(e.target.value)
  const handleRemarksFilterChange = (e) => setRemarksFilter(e.target.value)
  const handleFrequencyFilterChange = (e) => setFrequencyFilter(e.target.value)

  const { history, historyTotalCount, dropdowns } = useSelector((state) => state.checkList)
  const departments = dropdowns?.departments || []
  const dbNames = dropdowns?.names || []
  const givenBys = dropdowns?.givenBy || []
  const { delegation_done, filterOptions } = useSelector((state) => state.delegation)
  const delegationDoerOptions = filterOptions?.doers || []
  const delegationCreatorOptions = filterOptions?.creators || []

  const { doerName } = useSelector((state) => state.assignTask)
  const dispatch = useDispatch()

  const historyTableContainerRef = useRef(null)
  const delegationTableContainerRef = useRef(null)

  useEffect(() => {
    dispatch(uniqueDoerNameData())
    dispatch(fetchChecklistFilterOptions())
    dispatch(getDelegationFilterOptionsThunk())
  }, [dispatch])

  // Helper to compile all history filters for fetching
  const getHistoryFilters = (pageNumber = 1) => {
    return {
      page: pageNumber,
      search: searchTerm,
      approvalStatus: approvalStatusFilter,
      name: nameFilter,
      department: departmentFilter,
      file: fileFilter,
      status: statusFilter,
      submission: submissionFilter,
      deadline: deadlineFilter,
      fromDate: startDate,
      toDate: endDate,
      remarks: remarksFilter,
      frequency: frequencyFilter,
      givenBy: givenByFilter
    }
  }

  // Fetch checklist history from the server, searching the WHOLE table
  // (not just the current page). Debounced so typing doesn't spam the API.
  const isFirstHistoryFetch = useRef(true)
  useEffect(() => {
    if (isFirstHistoryFetch.current) {
      isFirstHistoryFetch.current = false
      dispatch(checklistHistoryData({ page: 1, search: "", approvalStatus: approvalStatusFilter }))
      return
    }
    const timer = setTimeout(() => {
      setCurrentPageHistory(1)
      dispatch(checklistHistoryData(getHistoryFilters(1)))
    }, 400)
    return () => clearTimeout(timer)
  }, [
    searchTerm, approvalStatusFilter, nameFilter, departmentFilter, fileFilter,
    statusFilter, submissionFilter, deadlineFilter, startDate, endDate,
    remarksFilter, frequencyFilter, givenByFilter, dispatch
  ])

  const getDelegationFilters = () => {
    return {
      name: delegationNameFilter,
      givenBy: delegationGivenByFilter,
      frequency: delegationFreqFilter,
      reminder: delegationReminderFilter,
      attachment: delegationAttachmentFilter,
      startDate: delegationDateRange.startDate,
      endDate: delegationDateRange.endDate,
      adminDone: delegationAdminDoneFilter,
      search: searchTerm
    };
  };

  useEffect(() => {
    if (activeTab === "delegation") {
      const timer = setTimeout(() => {
        setCurrentPageDelegation(1);
        const filters = getDelegationFilters();
        // Convert "all" values to empty string for API call
        const queryParams = {};
        Object.entries(filters).forEach(([key, val]) => {
          if (val !== "all" && val !== undefined) {
            queryParams[key] = val;
          }
        });
        dispatch(delegationDoneData(queryParams));
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [
    activeTab, searchTerm, delegationNameFilter, delegationGivenByFilter,
    delegationDateShortcutFilter, delegationFreqFilter, delegationReminderFilter,
    delegationAttachmentFilter, delegationDateRange, delegationAdminDoneFilter, dispatch
  ]);

  useEffect(() => {
    const role = localStorage.getItem("role")
    const user = localStorage.getItem("user-name")
    setUserRole(role || "")
    setUsername(user || "")
    setIsSuperAdmin(role === "super_admin" || role === "admin" || role === "pc role")
  }, [])

  // Page change handlers
  const handleHistoryPageChange = (newPage) => {
    setCurrentPageHistory(newPage);
    dispatch(checklistHistoryData(getHistoryFilters(newPage)));
    if (historyTableContainerRef.current) historyTableContainerRef.current.scrollTop = 0;
  };

  const handleDelegationPageChange = (newPage) => {
    setCurrentPageDelegation(newPage);
    if (delegationTableContainerRef.current) delegationTableContainerRef.current.scrollTop = 0;
  };

  // Reusable Pagination bar
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

  const parseSupabaseDate = (dateStr) => {
    if (!dateStr) return null
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
      return new Date(dateStr)
    }
    if (dateStr instanceof Date) {
      return dateStr
    }
    return new Date(dateStr)
  }

  const resetFilters = () => {
    setSearchTerm("")
    setSelectedMembers([])
    setStartDate("")
    setEndDate("")
    setApprovalStatusFilter("pending")
    setNameFilter("")
    setDepartmentFilter("")
    setFileFilter("all")
    setStatusFilter("all")
    setSubmissionFilter("all")
    setDeadlineFilter("all")
    setRemarksFilter("all")
    setFrequencyFilter("all")
    setGivenByFilter("")
  }

  // Handle checkbox selection for checklist admin approval
  const handleHistoryItemSelect = (taskId, isChecked) => {
    if (isChecked) {
      setSelectedHistoryItems(prev => [...prev, { task_id: taskId }])
    } else {
      setSelectedHistoryItems(prev => prev.filter(item => item.task_id !== taskId))
    }
  }

  // Handle checkbox selection for delegation admin approval
  const handleDelegationItemSelect = (id, taskId, isChecked) => {
    if (isChecked) {
      setSelectedDelegationItems(prev => [...prev, { id: id, task_id: taskId }])
    } else {
      setSelectedDelegationItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedHistoryItems(
        filteredHistoryData
          .filter(item => item.admin_done !== 'Done')
          .map(item => ({ task_id: item.task_id }))
      )
    } else {
      setSelectedHistoryItems([])
    }
  }

  // Handle select all for delegation items without admin_done = 'Done' and status = 'completed'
  const handleSelectAllDelegation = (isChecked) => {
    if (isChecked) {
      const pendingItems = filteredDelegationData
        .filter(item => item.admin_done !== 'Done' && item.status === 'completed')
        .map(item => ({ id: item.id, task_id: item.task_id }))
      setSelectedDelegationItems(pendingItems)
    } else {
      setSelectedDelegationItems([])
    }
  }

  // Mark selected items as done
  const handleMarkDone = async (type) => {
    const items = type === "checklist" ? selectedHistoryItems : selectedDelegationItems
    if (items.length === 0) return
    setConfirmationModal({
      isOpen: true,
      itemCount: items.length,
      type: type
    })
  }

  const confirmMarkDone = async () => {
    const type = confirmationModal.type
    setConfirmationModal({ isOpen: false, itemCount: 0, type: "checklist" })
    setMarkingAsDone(true)
    try {
      let error
      if (type === "checklist") {
        const payload = selectedHistoryItems.map(item => ({
          task_id: item.task_id,
          remarks: adminRemarks[item.task_id] || "",
          admin_reply: adminReplyData[item.task_id] || ""
        }))
        const result = await postChecklistAdminDoneAPI(payload)
        error = result.error
      } else {
        const payload = selectedDelegationItems.map(item => ({
          id: item.id,
          remarks: adminRemarks[item.id] || ""
        }))
        const result = await postDelegationAdminDoneAPI(payload)
        error = result.error
      }

      if (error) {
        throw new Error(error.message || "Failed to mark items as done")
      }

      if (type === "checklist") {
        setSelectedHistoryItems([])
        setAdminRemarks({})
        setAdminReplyData({})
        setCurrentPageHistory(1)
        dispatch(checklistHistoryData(getHistoryFilters(1)))
      } else {
        setSelectedDelegationItems([])
        dispatch(delegationDoneData())
      }
      
      const count = type === "checklist" ? selectedHistoryItems.length : selectedDelegationItems.length
      setSuccessMessage(`Successfully marked ${count} items as approved!`)
      
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("Error marking tasks as done:", error)
      setSuccessMessage(`Failed to mark tasks as done: ${error.message}`)
    } finally {
      setMarkingAsDone(false)
    }
  }

  const handleRevert = async () => {
    if (selectedHistoryItems.length === 0) return
    if (!window.confirm(`Revert ${selectedHistoryItems.length} task(s) back to checklist?`)) return
    setRevertingTaskId("bulk")
    try {
      const result = await revertChecklistAdminDoneAPI(selectedHistoryItems.map(i => i.task_id))
      if (result.error) throw new Error(result.error.message || "Revert failed")
      setSuccessMessage(`Successfully reverted ${selectedHistoryItems.length} task(s) to checklist!`)
      setSelectedHistoryItems([])
      setCurrentPageHistory(1)
      dispatch(checklistHistoryData(getHistoryFilters(1)))
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err) {
      setSuccessMessage(`Failed to revert: ${err.message}`)
    } finally {
      setRevertingTaskId(null)
    }
  }

  const handleDelegationRevert = async () => {
    if (selectedDelegationItems.length === 0) return
    if (!window.confirm(`Revert ${selectedDelegationItems.length} task(s) back to pending?`)) return
    setRevertingTaskId("delegation-bulk")
    try {
      const result = await revertDelegationTaskAPI(
        selectedDelegationItems.map(i => ({ id: i.id, task_id: i.task_id }))
      )
      if (result.error) throw new Error(result.error.message || "Revert failed")
      setSuccessMessage(`Successfully reverted ${selectedDelegationItems.length} task(s) to pending!`)
      setSelectedDelegationItems([])
      dispatch(delegationDoneData())
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err) {
      setSuccessMessage(`Failed to revert: ${err.message}`)
    } finally {
      setRevertingTaskId(null)
    }
  }

  // Filtered checklist data
  const filteredHistoryData = useMemo(() => {
    return Array.isArray(history) ? history : []
  }, [history])

  // Filtered delegation data
  const filteredDelegationData = useMemo(() => {
    if (!Array.isArray(delegation_done)) return []

    return delegation_done.slice().sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : null
      const dateB = b.created_at ? new Date(b.created_at) : null
      if (!dateA && !dateB) return 0
      if (!dateA) return 1
      if (!dateB) return -1
      return dateB.getTime() - dateA.getTime()
    })
  }, [delegation_done])


  const getFilteredMembersList = () => {
    if (userRole === "admin") {
      return doerName
    } else {
      return doerName.filter((member) => member.toLowerCase() === username.toLowerCase())
    }
  }

  // Check if an item is selected
  const isItemSelected = (taskId) => {
    return selectedHistoryItems.some(item => item.task_id === taskId)
  }

  const isDelegationItemSelected = (id) => {
    return selectedDelegationItems.some(item => item.id === id)
  }

  // Count pending approval items
  const pendingApprovalCount = filteredHistoryData.filter(item => item.admin_done !== 'Done').length
  const pendingDelegationApprovalCount = filteredDelegationData.filter(item => item.admin_done !== 'Done' && item.status === 'completed').length

  // Confirmation Modal Component
  const ConfirmationModal = ({ isOpen, itemCount, onConfirm, onCancel }) => {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-100 text-green-600 rounded-full p-3 mr-4">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Approve Items</h2>
          </div>

          <p className="text-gray-600 text-center mb-6 text-sm sm:text-base">
            Are you sure you want to approve {itemCount} {itemCount === 1 ? "item" : "items"}?
          </p>

          <div className="flex justify-center space-x-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    )
  }

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "—"
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return "—"
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  return (
    <AdminLayout>
      <div className="space-y-2 p-2 sm:p-0">
        {/* Header - Compact */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-purple-700">Approval Pending</h1>
          </div>
        </div>

        {/* Tabs - Compact */}
        <div className="bg-white rounded-md shadow-sm">
          <div className="flex">
            <button
              onClick={() => {
                setActiveTab("checklist")
                setSearchTerm("")
                setSelectedHistoryItems([])
                setSelectedDelegationItems([])
              }}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-l-md transition-colors ${
                activeTab === "checklist"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Checklist
            </button>
            <button
              onClick={() => {
                setActiveTab("delegation")
                setSearchTerm("")
                setSelectedHistoryItems([])
                setSelectedDelegationItems([])
              }}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-r-md transition-colors ${
                activeTab === "delegation"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Delegation
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className={`p-2 rounded-md text-sm ${successMessage.includes('Failed') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {successMessage}
          </div>
        )}

        {/* Filters + Stats - Combined Compact */}
        <div className="bg-white rounded-md shadow-sm p-2">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <SearchBar
              className="flex-1 min-w-[160px]"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Date Range */}
            <div className="flex gap-1 items-center">
              <span className="text-xs text-gray-500">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-1.5 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-purple-500"
              />
              <span className="text-xs text-gray-500">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-1.5 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Member Filter is placed inside the table headers below */}

            {/* Approval Status Filter */}
            <select
              value={approvalStatusFilter}
              onChange={(e) => setApprovalStatusFilter(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs bg-white min-w-[100px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Approved</option>
            </select>

            {/* Reset Button */}
            <button
              onClick={resetFilters}
              className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              Reset
            </button>

            {/* Stats - Inline */}
            <div className="flex gap-3 ml-auto text-xs">
              <span className="text-purple-600 font-medium">
                {activeTab === "checklist" ? filteredHistoryData.length : filteredDelegationData.length} Total
              </span>
              <span className="text-orange-600 font-medium">
                {activeTab === "checklist" ? pendingApprovalCount : pendingDelegationApprovalCount} Pending
              </span>
              <span className="text-green-600 font-medium">
                {activeTab === "checklist" 
                  ? filteredHistoryData.length - pendingApprovalCount 
                  : filteredDelegationData.length - pendingDelegationApprovalCount} Approved
              </span>
            </div>

            {/* Admin Approval + Revert Buttons */}
            {isSuperAdmin && activeTab === "checklist" && selectedHistoryItems.length > 0 && (
              <>
                <button
                  onClick={() => handleMarkDone("checklist")}
                  disabled={markingAsDone}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {markingAsDone ? "..." : `Approve (${selectedHistoryItems.length})`}
                </button>
                <button
                  onClick={handleRevert}
                  disabled={revertingTaskId === "bulk"}
                  className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  {revertingTaskId === "bulk" ? "..." : `Revert (${selectedHistoryItems.length})`}
                </button>
              </>
            )}

            {isSuperAdmin && activeTab === "delegation" && selectedDelegationItems.length > 0 && (
              <>
                <button
                  onClick={() => handleMarkDone("delegation")}
                  disabled={markingAsDone}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {markingAsDone ? "..." : `Approve (${selectedDelegationItems.length})`}
                </button>
                <button
                  onClick={handleDelegationRevert}
                  disabled={revertingTaskId === "delegation-bulk"}
                  className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  {revertingTaskId === "delegation-bulk" ? "..." : `Revert (${selectedDelegationItems.length})`}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Table Container - More height */}
        <div className="bg-white rounded-md shadow-sm overflow-hidden">
          <style>{`
            /* Mobile Card Layout Styles */
            @media (max-width: 768px) {
              .mobile-card-table {
                display: block;
              }
              .mobile-card-table thead {
                display: none;
              }
              .mobile-card-table tbody {
                display: block;
              }
              .mobile-card-table tr {
                display: block;
                margin-bottom: 1rem;
                border: 1px solid #e5e7eb;
                border-radius: 0.5rem;
                padding: 1rem;
                background-color: #ffffff;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
              }
              .mobile-card-table td {
                display: flex;
                flex-direction: column;
                text-align: left;
                padding: 0.5rem 0;
                border: none;
                background: transparent !important;
              }
              .mobile-card-table td::before {
                content: attr(data-label);
                font-weight: 600;
                color: #6b7280;
                font-size: 0.75rem;
                text-transform: uppercase;
                margin-bottom: 0.25rem;
              }
              .mobile-card-table td:first-child {
                border-top: none;
              }
              .mobile-card-table td.mobile-checkbox-cell {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem 0;
                border-bottom: 1px solid #e5e7eb;
                margin-bottom: 0.5rem;
              }
              .mobile-card-table td.mobile-checkbox-cell::before {
                margin-bottom: 0;
              }
            }
            
            /* Desktop: fit table into viewport with multiline header & cell wrapping */
            @media (min-width: 769px) {
              .mobile-card-table {
                table-layout: fixed !important;
                width: 100% !important;
                border-collapse: collapse !important;
              }
              .mobile-card-table th {
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
              .mobile-card-table td {
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
              .mobile-card-table td > div, .mobile-card-table td > span {
                font-size: 0.68rem !important;
                line-height: 1.15 !important;
                word-break: break-word !important;
                overflow-wrap: anywhere !important;
              }
              .mobile-card-table input[type="text"] {
                font-size: 0.65rem !important;
                padding: 0.15rem !important;
              }
            }
          `}</style>
          <div ref={historyTableContainerRef} className="overflow-x-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 220px)' }}>
            {activeTab === "checklist" ? (
              /* Checklist Table */
              <>
                <table className="w-full table-fixed border-collapse border border-gray-300 mobile-card-table">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="bg-gray-100">
                    {isSuperAdmin && userRole !== "pc role" && (
                      <th style={{ width: '28px' }} className="px-1 py-1 border border-gray-300"></th>
                    )}
                    <th style={{ width: '40px' }} className="px-1 py-1 border border-gray-300"></th>
                    <th style={{ width: '66px' }} className="px-1 py-1 border border-gray-300">
                      <select
                        value={approvalStatusFilter}
                        onChange={(e) => setApprovalStatusFilter(e.target.value)}
                        className="w-full text-[10px] p-0.5 border border-gray-300 rounded font-normal bg-white text-center"
                      >
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Approved</option>
                      </select>
                    </th>
                    {isSuperAdmin && (
                      <th style={{ width: '85px' }} className="px-1 py-1 border border-gray-300 bg-purple-50"></th>
                    )}
                    <th style={{ width: '45px' }} className="px-1 py-1 border border-gray-300"></th>
                    
                    {/* Department Filter */}
                    <th style={{ width: '60px' }} className="px-1 py-1 border border-gray-300">
                      <select
                        value={departmentFilter}
                        onChange={handleDepartmentFilterChange}
                        className="w-full text-[10px] p-0.5 border border-gray-300 rounded font-normal bg-white text-center"
                      >
                        <option value="all">All</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </th>

                    {/* Given By Filter */}
                    <th style={{ width: '60px' }} className="px-1 py-1 border border-gray-300">
                      <select
                        value={givenByFilter}
                        onChange={handleGivenByFilterChange}
                        className="w-full text-[10px] p-0.5 border border-gray-300 rounded font-normal bg-white text-center"
                      >
                        <option value="">All</option>
                        {givenBys.map((gb) => (
                          <option key={gb} value={gb}>{gb}</option>
                        ))}
                      </select>
                    </th>

                    {/* Name Filter */}
                    <th style={{ width: '75px' }} className="px-1 py-1 border border-gray-300">
                      <select
                        value={nameFilter}
                        onChange={handleNameFilterChange}
                        className="w-full text-[10px] p-0.5 border border-gray-300 rounded font-normal bg-white text-center"
                      >
                        <option value="">All</option>
                        {dbNames.map((member) => (
                          <option key={member} value={member}>{member}</option>
                        ))}
                      </select>
                    </th>

                    <th style={{ width: '19.5%' }} className="px-2 py-1 border border-gray-300"></th>

                    {/* Deadline shortcut filter (task_start_date) */}
                    <th style={{ width: '70px' }} className="px-1 py-1 border border-gray-300 bg-yellow-50">
                      <select
                        value={deadlineFilter}
                        onChange={handleDeadlineFilterChange}
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

                    {/* Frequency filter */}
                    <th style={{ width: '45px' }} className="px-1 py-1 border border-gray-300">
                      <select
                        value={frequencyFilter}
                        onChange={handleFrequencyFilterChange}
                        className="w-full text-[10px] p-0.5 border border-gray-300 rounded font-normal bg-white text-center"
                      >
                        <option value="all">All</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="fortnightly">Fortnightly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="half-yearly">Half-Yearly</option>
                        <option value="yearly">Yearly</option>
                        <option value="alternate-day-2">Alt Day 2</option>
                        <option value="alternate-day-3">Alt Day 3</option>
                      </select>
                    </th>

                    {/* Submission Date filter */}
                    <th style={{ width: '75px' }} className="px-1 py-1 border border-gray-300 bg-green-50">
                      <select
                        value={submissionFilter}
                        onChange={handleSubmissionFilterChange}
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

                    {/* Status filter */}
                    <th style={{ width: '42px' }} className="px-1 py-1 border border-gray-300 bg-blue-50">
                      <select
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        className="w-full text-[10px] p-0.5 border border-gray-300 rounded font-normal bg-white text-center"
                      >
                        <option value="all">All</option>
                        <option value="on-time">On-Time</option>
                        <option value="delay">Delay</option>
                      </select>
                    </th>

                    {/* Remarks filter */}
                    <th style={{ width: '58px' }} className="px-1 py-1 border border-gray-300 bg-purple-50">
                      <select
                        value={remarksFilter}
                        onChange={handleRemarksFilterChange}
                        className="w-full text-[10px] p-0.5 border border-gray-300 rounded font-normal bg-white text-center"
                      >
                        <option value="all">All</option>
                        <option value="with">With Rem.</option>
                        <option value="without">No Rem.</option>
                      </select>
                    </th>

                    <th style={{ width: '58px' }} className="px-1 py-1 border border-gray-300 bg-indigo-50"></th>
                    <th style={{ width: '58px' }} className="px-1 py-1 border border-gray-300 bg-teal-50"></th>

                    {/* File filter */}
                    <th style={{ width: '56px' }} className="px-1 py-1 border border-gray-300">
                      <select
                        value={fileFilter}
                        onChange={handleFileFilterChange}
                        className="w-full text-[10px] p-0.5 border border-gray-300 rounded font-normal bg-white text-center"
                      >
                        <option value="all">All</option>
                        <option value="view">With File</option>
                        <option value="no file">No File</option>
                      </select>
                    </th>
                  </tr>
                  <tr>
                    {isSuperAdmin && userRole !== "pc role" && (
                      <th style={{ width: '28px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          checked={selectedHistoryItems.length > 0 && selectedHistoryItems.length === pendingApprovalCount}
                          className="h-3.5 w-3.5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                      </th>
                    )}
                    <th style={{ width: '40px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Seq. No.</th>
                    <th style={{ width: '66px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Status</th>
                    {isSuperAdmin && (
                      <th style={{ width: '85px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">Admin Remarks</th>
                    )}
                    <th style={{ width: '45px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                    <th style={{ width: '60px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th style={{ width: '60px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Given By</th>
                    <th style={{ width: '75px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th style={{ width: '19.5%' }} className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Task Description</th>
                    <th style={{ width: '70px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50">Task Start Date</th>
                    <th style={{ width: '45px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                    <th style={{ width: '75px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">Submission Date</th>
                    <th style={{ width: '42px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">Status</th>
                    <th style={{ width: '58px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">Remarks</th>
                    <th style={{ width: '58px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-indigo-50">User Reply</th>
                    <th style={{ width: '58px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-teal-50">Admin Reply</th>
                    <th style={{ width: '56px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                  </tr>
                  </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistoryData.length > 0 ? (
                    filteredHistoryData.map((historyItem, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {isSuperAdmin && userRole !== "pc role" && (
                          <td className="px-2 sm:px-3 py-2 sm:py-4 mobile-checkbox-cell" data-label="Select">
                            {historyItem.admin_done !== 'Done' ? (
                              <input
                                type="checkbox"
                                checked={isItemSelected(historyItem.task_id)}
                                onChange={(e) => handleHistoryItemSelect(historyItem.task_id, e.target.checked)}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        )}
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="Seq. No.">
                          <div className="text-xs sm:text-sm text-gray-900 font-medium">
                            {(currentPageHistory - 1) * ITEMS_PER_PAGE + index + 1}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="Admin Status">
                          <span className={`inline-flex px-1.5 py-0.5 text-[9px] leading-none whitespace-nowrap font-bold uppercase rounded-full ${
                            historyItem.admin_done === 'Done'
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}>
                            {historyItem.admin_done === 'Done' ? "Approved" : "Pending"}
                          </span>
                        </td>
                        {isSuperAdmin && (
                          <td className="px-2 sm:px-3 py-2 sm:py-4 bg-purple-50" data-label="Admin Remarks">
                            {historyItem.admin_done !== 'Done' ? (
                              <div className="flex flex-col gap-1">
                                <input
                                  type="text"
                                  placeholder="Remark..."
                                  value={adminRemarks[historyItem.task_id] || ""}
                                  onChange={(e) => setAdminRemarks(prev => ({
                                    ...prev,
                                    [historyItem.task_id]: e.target.value
                                  }))}
                                  disabled={!isItemSelected(historyItem.task_id)}
                                  className={`w-full text-xs p-1 border-2 border-purple-300 rounded font-bold focus:border-purple-500 focus:bg-white bg-purple-50 ${
                                    !isItemSelected(historyItem.task_id) ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                />
                                <input
                                  type="text"
                                  placeholder="Admin Reply..."
                                  value={adminReplyData[historyItem.task_id] || ""}
                                  onChange={(e) => setAdminReplyData(prev => ({
                                    ...prev,
                                    [historyItem.task_id]: e.target.value
                                  }))}
                                  disabled={!isItemSelected(historyItem.task_id)}
                                  className={`w-full text-xs p-1 border-2 border-teal-300 rounded font-bold focus:border-teal-500 focus:bg-white bg-teal-50 ${
                                    !isItemSelected(historyItem.task_id) ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                />
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <div className="text-xs text-gray-600 font-medium">Remarks: {historyItem.admin_done_remarks || "—"}</div>
                                <div className="text-xs text-teal-600 font-medium">Reply: {historyItem.admin_reply || "—"}</div>
                              </div>
                            )}
                          </td>
                        )}
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="Task ID">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{historyItem.task_id || "—"}</div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="Department">
                          <div className="text-xs sm:text-sm text-gray-900">{historyItem.department || "—"}</div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="Given By">
                          <div className="text-xs sm:text-sm text-gray-900">{historyItem.given_by || "—"}</div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="Name">
                          <div className="text-xs sm:text-sm text-gray-900">{historyItem.name || "—"}</div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="Task Description">
                          <div className="text-xs sm:text-sm text-gray-900" title={historyItem.task_description}>
                            {historyItem.task_description || "—"}
                          </div>
                        </td>

                        <td className="px-2 sm:px-3 py-2 sm:py-4 bg-yellow-50" data-label="Task Start Date">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {historyItem.task_start_date ? (() => {
                              const date = parseSupabaseDate(historyItem.task_start_date)
                              if (!date || isNaN(date.getTime())) return "Invalid date"
                              const day = date.getDate().toString().padStart(2, '0')
                              const month = (date.getMonth() + 1).toString().padStart(2, '0')
                              const year = date.getFullYear()
                              return `${day}/${month}/${year}`
                            })() : "—"}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="Frequency">
                          <div className="text-xs sm:text-sm text-gray-900">{historyItem.frequency || "—"}</div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4 bg-green-50" data-label="Submission Date">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {historyItem.submission_date ? (() => {
                              const dateObj = new Date(historyItem.submission_date)
                              const day = ("0" + dateObj.getDate()).slice(-2)
                              const month = ("0" + (dateObj.getMonth() + 1)).slice(-2)
                              const year = dateObj.getFullYear()
                              const hours = ("0" + dateObj.getHours()).slice(-2)
                              const minutes = ("0" + dateObj.getMinutes()).slice(-2)
                              return (
                                <div>
                                  <div className="font-medium">{`${day}/${month}/${year}`}</div>
                                  <div className="text-xs text-gray-500">{`${hours}:${minutes}`}</div>
                                </div>
                              )
                            })() : "—"}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4 bg-blue-50" data-label="Status">
                          <span className={`inline-flex px-1.5 py-0.5 text-[9px] leading-none whitespace-nowrap font-bold uppercase rounded-full ${
                            historyItem.status === "yes"
                              ? "bg-green-100 text-green-800"
                              : historyItem.status === "no"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                          }`}>
                            {historyItem.status || "—"}
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4 bg-purple-50" data-label="Remarks">
                          <div className="text-xs sm:text-sm text-gray-900" title={historyItem.remark}>
                            {historyItem.remark || "—"}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4 bg-indigo-50" data-label="User Reply">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {historyItem.user_reply || "—"}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4 bg-teal-50" data-label="Admin Reply">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {historyItem.admin_reply || "—"}
                          </div>
                        </td>
                        <td className="px-1 py-1" data-label="File">
                          {historyItem.image ? (
                            <a
                              href={historyItem.image}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline inline-flex items-center justify-center gap-1 text-[10px] whitespace-nowrap"
                            >
                              <img
                                src={historyItem.image}
                                alt="Attachment"
                                className="h-4 w-4 object-cover rounded shrink-0"
                              />
                              <span>View</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 text-[10px] whitespace-nowrap">No file</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isSuperAdmin ? (userRole === "pc role" ? 13 : 14) : 13} className="px-4 sm:px-6 py-4 text-center text-gray-500 text-xs sm:text-sm">
                        {searchTerm || selectedMembers.length > 0 || startDate || endDate
                          ? "No records matching your filters"
                          : "No completed records found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Pagination
                currentPage={currentPageHistory}
                totalPages={Math.ceil((historyTotalCount || 0) / ITEMS_PER_PAGE)}
                onPageChange={handleHistoryPageChange}
              />
              </>
            ) : (
              /* Delegation Table */
              <>
                <table className="w-full table-fixed border-collapse border border-gray-300 mobile-card-table">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr className="bg-gray-100">
                      {isSuperAdmin && userRole !== "pc role" && (
                        <th className="px-1 py-1 border border-gray-200"></th>
                      )}
                      <th className="px-1 py-1 border border-gray-200"></th>
                      <th className="px-1 py-1 border border-gray-200">
                        <select
                          value={delegationAdminDoneFilter}
                          onChange={(e) => setDelegationAdminDoneFilter(e.target.value)}
                          className="w-full text-[10px] p-0.5 border border-gray-300 rounded font-normal bg-white text-center"
                        >
                          <option value="all">All</option>
                          <option value="pending">Pending</option>
                          <option value="completed">Done</option>
                        </select>
                      </th>
                      {isSuperAdmin && (
                        <th className="px-1 py-1 border border-gray-200"></th>
                      )}
                      <th className="px-1 py-1 border border-gray-200"></th>
                      <th className="px-1 py-1 border border-gray-200">
                        <select
                          value={delegationGivenByFilter}
                          onChange={(e) => setDelegationGivenByFilter(e.target.value)}
                          className="w-full text-[10px] p-0.5 border border-gray-300 rounded font-normal bg-white text-center"
                        >
                          <option value="all">All</option>
                          {delegationCreatorOptions.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </th>
                      <th className="px-1 py-1 border border-gray-200">
                        <select
                          value={delegationNameFilter}
                          onChange={(e) => setDelegationNameFilter(e.target.value)}
                          className="w-full text-[10px] p-0.5 border border-gray-300 rounded font-normal bg-white text-center"
                        >
                          <option value="all">All</option>
                          {delegationDoerOptions.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </th>
                      <th className="px-1 py-1 border border-gray-200"></th>
                      <th className="px-1 py-1 border border-gray-200 bg-yellow-50">
                        <select
                          value={delegationDateShortcutFilter}
                          onChange={(e) => handleDelegationDateShortcutSelect(e.target.value)}
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
                      <th className="px-1 py-1 border border-gray-200"></th>
                      <th className="px-1 py-1 border border-gray-200"></th>
                      <th className="px-1 py-1 border border-gray-200"></th>
                      <th className="px-1 py-1 border border-gray-200"></th>
                    </tr>
                    <tr>
                    {isSuperAdmin && userRole !== "pc role" && (
                      <th style={{ width: '28px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) => handleSelectAllDelegation(e.target.checked)}
                          checked={selectedDelegationItems.length > 0 && selectedDelegationItems.length === pendingDelegationApprovalCount}
                          className="h-3.5 w-3.5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                      </th>
                    )}
                    <th style={{ width: '40px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Seq. No.</th>
                    <th style={{ width: '66px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Status</th>
                    {isSuperAdmin && (
                      <th style={{ width: '90px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">Admin Remarks</th>
                    )}
                    <th style={{ width: '45px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                    <th style={{ width: '65px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Given By</th>
                    <th style={{ width: '80px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th style={{ width: '24.5%' }} className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Task Description</th>
                    <th style={{ width: '80px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50">Created At</th>
                    <th style={{ width: '58px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">Status</th>
                    <th style={{ width: '70px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Next Extend Date</th>
                    <th style={{ width: '75px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">Reason</th>
                    <th style={{ width: '56px' }} className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDelegationData.length > 0 ? (
                    filteredDelegationData.slice((currentPageDelegation - 1) * ITEMS_PER_PAGE, currentPageDelegation * ITEMS_PER_PAGE).map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {isSuperAdmin && userRole !== "pc role" && (
                          <td className="px-2 sm:px-3 py-2 sm:py-4 mobile-checkbox-cell" data-label="Select">
                            {item.admin_done !== 'Done' ? (
                              <input
                                type="checkbox"
                                checked={isDelegationItemSelected(item.id)}
                                onChange={(e) => handleDelegationItemSelect(item.id, item.task_id, e.target.checked)}
                                disabled={item.status !== "completed"}
                                className={`h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded ${
                                  item.status !== "completed" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                }`}
                              />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        )}
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="Seq. No.">
                          <div className="text-xs sm:text-sm text-gray-900 font-medium">
                            {(currentPageDelegation - 1) * ITEMS_PER_PAGE + index + 1}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="Admin Status">
                          <span className={`inline-flex px-1.5 py-0.5 text-[9px] leading-none whitespace-nowrap font-bold uppercase rounded-full ${
                            item.admin_done === 'Done'
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}>
                            {item.admin_done === 'Done' ? "Approved" : "Pending"}
                          </span>
                        </td>
                        {isSuperAdmin && (
                          <td className="px-2 sm:px-3 py-2 sm:py-4 bg-purple-50" data-label="Admin Remarks">
                            {item.admin_done !== 'Done' ? (
                              <input
                                type="text"
                                placeholder="Remark..."
                                value={adminRemarks[item.id] || ""}
                                onChange={(e) => setAdminRemarks(prev => ({
                                  ...prev,
                                  [item.id]: e.target.value
                                }))}
                                disabled={!isDelegationItemSelected(item.id)}
                                className={`w-full text-xs p-1 border-2 border-purple-300 rounded font-bold focus:border-purple-500 focus:bg-white bg-purple-50 ${
                                  !isDelegationItemSelected(item.id) ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              />
                            ) : (
                              <div className="text-xs text-gray-600 font-medium">{item.admin_done_remarks || "—"}</div>
                            )}
                          </td>
                        )}
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="Task ID">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{item.task_id || "—"}</div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="Given By">
                          <div className="text-xs sm:text-sm text-gray-900">{item.given_by || "—"}</div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="Name">
                          <div className="text-xs sm:text-sm text-gray-900">{item.name || "—"}</div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="Task Description">
                          <div className="text-xs sm:text-sm text-gray-900" title={item.task_description}>
                            {item.task_description || "—"}
                          </div>
                        </td>

                        <td className="px-2 sm:px-3 py-2 sm:py-4 bg-yellow-50" data-label="Created At">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {formatDateForDisplay(item.created_at)}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4 bg-blue-50" data-label="Status">
                          <span className={`inline-flex px-0.5 py-0.5 text-[6.5px] leading-none whitespace-nowrap font-bold uppercase rounded-full ${
                            item.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : item.status === "extend"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }`}>
                            {item.status || "—"}
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="Next Extend Date">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {item.next_extend_date ? formatDateForDisplay(item.next_extend_date) : "—"}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4 bg-purple-50" data-label="Reason">
                          <div className="text-xs sm:text-sm text-gray-900" title={item.reason}>
                            {item.reason || "—"}
                          </div>
                        </td>
                        <td className="px-1 py-1" data-label="File">
                          {item.image_url ? (
                            <a
                              href={item.image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline inline-flex items-center justify-center gap-1 text-[10px] whitespace-nowrap"
                            >
                              <img
                                src={item.image_url}
                                alt="Attachment"
                                className="h-4 w-4 object-cover rounded shrink-0"
                              />
                              <span>View</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 text-[10px] whitespace-nowrap">No file</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isSuperAdmin ? (userRole === "pc role" ? 11 : 12) : 11} className="px-4 sm:px-6 py-4 text-center text-gray-500 text-xs sm:text-sm">
                        {searchTerm || startDate || endDate
                          ? "No records matching your filters"
                          : "No delegation records found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Pagination
                currentPage={currentPageDelegation}
                totalPages={Math.ceil((filteredDelegationData?.length || 0) / ITEMS_PER_PAGE)}
                onPageChange={handleDelegationPageChange}
              />
              </>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          itemCount={confirmationModal.itemCount}
          onConfirm={confirmMarkDone}
          onCancel={() => setConfirmationModal({ isOpen: false, itemCount: 0, type: "checklist" })}
        />
      </div>
    </AdminLayout>
  )
}

export default HistoryPage
