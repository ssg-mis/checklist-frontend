"use client"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Search, CheckCircle2 } from "lucide-react"
import AdminLayout from "../../components/layout/AdminLayout"
import { useDispatch, useSelector } from "react-redux"
import { checklistHistoryData } from "../../redux/slice/checklistSlice"
import { postChecklistAdminDoneAPI } from "../../redux/api/checkListApi"
import { postDelegationAdminDoneAPI } from "../../redux/api/delegationApi"
import { uniqueDoerNameData } from "../../redux/slice/assignTaskSlice"
import { delegationDoneData } from "../../redux/slice/delegationSlice"

function HistoryPage() {
  const [activeTab, setActiveTab] = useState("checklist") // 'checklist' or 'delegation'
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMembers, setSelectedMembers] = useState([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")
  const [currentPageHistory, setCurrentPageHistory] = useState(1)
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false)
  const [hasMoreHistory, setHasMoreHistory] = useState(true)
  const [initialHistoryLoading, setInitialHistoryLoading] = useState(false)
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

  const { history } = useSelector((state) => state.checkList)
  const { delegation_done } = useSelector((state) => state.delegation)
  const { doerName } = useSelector((state) => state.assignTask)
  const dispatch = useDispatch()

  const historyTableContainerRef = useRef(null)
  const scrollTimeout = useRef(null)
  const lastScrollTop = useRef(0)

  useEffect(() => {
    dispatch(checklistHistoryData(1))
    dispatch(delegationDoneData())
    dispatch(uniqueDoerNameData())
  }, [dispatch])

  useEffect(() => {
    const role = localStorage.getItem("role")
    const user = localStorage.getItem("user-name")
    setUserRole(role || "")
    setUsername(user || "")
    setIsSuperAdmin(role === "super_admin" || role === "admin")
  }, [])

  // Handle scroll for history
  const handleScrollHistory = useCallback(() => {
    if (!historyTableContainerRef.current || isLoadingMoreHistory || !hasMoreHistory || history.length === 0) return

    if (scrollTimeout.current) return

    scrollTimeout.current = setTimeout(() => {
      if (!historyTableContainerRef.current) return
      const { scrollTop, scrollHeight, clientHeight } = historyTableContainerRef.current
      
      // If scrollTop hasn't changed (or is 0 due to initial render), it might be horizontal scroll
      if (scrollTop === lastScrollTop.current) return
      lastScrollTop.current = scrollTop

      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50

      if (isNearBottom) {
        setIsLoadingMoreHistory(true)
        dispatch(checklistHistoryData(currentPageHistory + 1))
          .then((result) => {
            if (result.payload && result.payload.length < 50) {
              setHasMoreHistory(false)
            }
            setCurrentPageHistory(prev => prev + 1)
          })
          .finally(() => setIsLoadingMoreHistory(false))
      }
      scrollTimeout.current = null
    }, 200)
  }, [isLoadingMoreHistory, hasMoreHistory, currentPageHistory, dispatch, history.length])

  useEffect(() => {
    const historyTableElement = historyTableContainerRef.current
    if (historyTableElement) {
      historyTableElement.addEventListener('scroll', handleScrollHistory)
      return () => historyTableElement.removeEventListener('scroll', handleScrollHistory)
    }
  }, [handleScrollHistory])

  // Load initial history data
  useEffect(() => {
    if (history.length === 0) {
      setInitialHistoryLoading(true)
      dispatch(checklistHistoryData(1))
        .then((result) => {
          if (result.payload && result.payload.length < 50) {
            setHasMoreHistory(false)
          }
        })
        .finally(() => setInitialHistoryLoading(false))
    }
  }, [history.length, dispatch])

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
    setApprovalStatusFilter("pending") // Reset to pending
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
  const handleDelegationItemSelect = (id, isChecked) => {
    if (isChecked) {
      setSelectedDelegationItems(prev => [...prev, { id: id }])
    } else {
      setSelectedDelegationItems(prev => prev.filter(item => item.id !== id))
    }
  }

  // Handle select all for checklist items without admin_done = 'Done'
  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      const pendingItems = filteredHistoryData
        .filter(item => item.admin_done !== 'Done')
        .map(item => ({ task_id: item.task_id }))
      setSelectedHistoryItems(pendingItems)
    } else {
      setSelectedHistoryItems([])
    }
  }

  // Handle select all for delegation items without admin_done = 'Done' and status = 'completed'
  const handleSelectAllDelegation = (isChecked) => {
    if (isChecked) {
      const pendingItems = filteredDelegationData
        .filter(item => item.admin_done !== 'Done' && item.status === 'completed')
        .map(item => ({ id: item.id }))
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
      let data, error
      if (type === "checklist") {
        const payload = selectedHistoryItems.map(item => ({
          task_id: item.task_id,
          remarks: adminRemarks[item.task_id] || ""
        }))
        const result = await postChecklistAdminDoneAPI(payload)
        data = result.data
        error = result.error
      } else {
        const payload = selectedDelegationItems.map(item => ({
          id: item.id,
          remarks: adminRemarks[item.id] || ""
        }))
        const result = await postDelegationAdminDoneAPI(payload)
        data = result.data
        error = result.error
      }

      if (error) {
        throw new Error(error.message || "Failed to mark items as done")
      }

      if (type === "checklist") {
        setSelectedHistoryItems([])
        dispatch(checklistHistoryData(1))
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

  // Filtered checklist data
  const filteredHistoryData = useMemo(() => {
    if (!Array.isArray(history)) return []

    const filtered = history
      .filter((item) => {
        const matchesSearch = searchTerm
          ? Object.entries(item).some(([key, value]) => {
            if (['image', 'admin_done'].includes(key)) return false
            return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
          })
          : true

        const matchesMember = selectedMembers.length > 0
          ? selectedMembers.includes(item.name)
          : true

        let matchesDateRange = true
        if (startDate || endDate) {
          const itemDate = parseSupabaseDate(item.task_start_date)
          if (!itemDate || isNaN(itemDate.getTime())) return false

          const itemDateOnly = new Date(
            itemDate.getFullYear(),
            itemDate.getMonth(),
            itemDate.getDate()
          )

          const start = startDate ? new Date(startDate) : null
          if (start) start.setHours(0, 0, 0, 0)

          const end = endDate ? new Date(endDate) : null
          if (end) end.setHours(23, 59, 59, 999)

          if (start && itemDateOnly < start) matchesDateRange = false
          if (end && itemDateOnly > end) matchesDateRange = false
        }

        return matchesSearch && matchesMember && matchesDateRange
      })
      .filter((item) => {
        // Apply approval status filter
        if (approvalStatusFilter === "pending") {
          return item.admin_done !== 'Done'
        } else if (approvalStatusFilter === "completed") {
          return item.admin_done === 'Done'
        }
        return true // 'all'
      })
      .sort((a, b) => {
        const dateA = parseSupabaseDate(a.submission_date)
        const dateB = parseSupabaseDate(b.submission_date)
        if (!dateA) return 1
        if (!dateB) return -1
        return dateB - dateA
      })

    return filtered.slice(0, currentPageHistory * 50)
  }, [history, searchTerm, selectedMembers, startDate, endDate, currentPageHistory, approvalStatusFilter])

  // Filtered delegation data
  const filteredDelegationData = useMemo(() => {
    if (!Array.isArray(delegation_done)) return []

    return delegation_done
      .filter((item) => {
        const userMatch =
          userRole === "admin" ||
          userRole === "super_admin" ||
          (item.name && item.name.toLowerCase() === username.toLowerCase())
        if (!userMatch) return false

        const matchesSearch = searchTerm
          ? Object.entries(item).some(([key, value]) => {
            if (['image_url', 'admin_done'].includes(key)) return false
            return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
          })
          : true

        let matchesDateRange = true
        if (startDate || endDate) {
          const itemDate = item.created_at ? new Date(item.created_at) : null
          if (!itemDate || isNaN(itemDate.getTime())) return false

          if (startDate) {
            const startDateObj = new Date(startDate)
            startDateObj.setHours(0, 0, 0, 0)
            if (itemDate < startDateObj) matchesDateRange = false
          }

          if (endDate) {
            const endDateObj = new Date(endDate)
            endDateObj.setHours(23, 59, 59, 999)
            if (itemDate > endDateObj) matchesDateRange = false
          }
        }

        return matchesSearch && matchesDateRange
      })
      .filter((item) => {
        // Apply approval status filter
        if (approvalStatusFilter === "pending") {
          return item.admin_done !== 'Done' && item.status === 'completed'
        } else if (approvalStatusFilter === "completed") {
          return item.admin_done === 'Done'
        }
        return true // 'all'
      })
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : null
        const dateB = b.created_at ? new Date(b.created_at) : null
        if (!dateA && !dateB) return 0
        if (!dateA) return 1
        if (!dateB) return -1
        return dateB.getTime() - dateA.getTime()
      })
  }, [delegation_done, searchTerm, startDate, endDate, userRole, username, approvalStatusFilter])

  const handleMemberSelection = (member) => {
    setSelectedMembers((prev) => {
      if (prev.includes(member)) {
        return prev.filter((item) => item !== member)
      } else {
        return [...prev, member]
      }
    })
  }

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
            <div className="relative flex-1 min-w-[120px] max-w-[200px]">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

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

            {/* Member Filter Dropdown - Only for Checklist */}
            {activeTab === "checklist" && userRole === "admin" && doerName && doerName.length > 0 && (
              <select
                value={selectedMembers[0] || ""}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedMembers([e.target.value]);
                  } else {
                    setSelectedMembers([]);
                  }
                }}
                className="px-2 py-1 border border-gray-300 rounded text-xs bg-white min-w-[100px]"
              >
                <option value="">All Members</option>
                {getFilteredMembersList().map((member) => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            )}

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

            {/* Admin Approval Button */}
            {isSuperAdmin && activeTab === "checklist" && selectedHistoryItems.length > 0 && (
              <button
                onClick={() => handleMarkDone("checklist")}
                disabled={markingAsDone}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                {markingAsDone ? "..." : `Approve (${selectedHistoryItems.length})`}
              </button>
            )}

            {isSuperAdmin && activeTab === "delegation" && selectedDelegationItems.length > 0 && (
              <button
                onClick={() => handleMarkDone("delegation")}
                disabled={markingAsDone}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                {markingAsDone ? "..." : `Approve (${selectedDelegationItems.length})`}
              </button>
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
          `}</style>
          <div ref={historyTableContainerRef} className="overflow-x-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 220px)' }}>
            {initialHistoryLoading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                <p className="text-purple-600 text-sm sm:text-base">Loading data...</p>
              </div>
            ) : activeTab === "checklist" ? (
              /* Checklist Table */
              <table className="min-w-full divide-y divide-gray-200 mobile-card-table">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {isSuperAdmin && (
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          checked={selectedHistoryItems.length > 0 && selectedHistoryItems.length === pendingApprovalCount}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                      </th>
                    )}
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Status</th>
                    {isSuperAdmin && (
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">Admin Remarks</th>
                    )}
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Given By</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Task Description</th>
                    {/* <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">Admin Remarks</th> */}
                    {/* <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th> */}
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50">Task Start Date</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">Submission Date</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">Status</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50 min-w-[120px]">Remarks</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistoryData.length > 0 ? (
                    filteredHistoryData.map((historyItem, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {isSuperAdmin && (
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
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="Admin Status">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
                            ) : (
                              <div className="text-xs text-gray-600 font-medium">{historyItem.admin_done_remarks || "—"}</div>
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
                        <td className="px-2 sm:px-3 py-2 sm:py-4 min-w-[150px]" data-label="Task Description">
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
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            historyItem.status === "yes"
                              ? "bg-green-100 text-green-800"
                              : historyItem.status === "no"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                          }`}>
                            {historyItem.status || "—"}
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4 bg-purple-50 min-w-[120px]" data-label="Remarks">
                          <div className="text-xs sm:text-sm text-gray-900" title={historyItem.remark}>
                            {historyItem.remark || "—"}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="File">
                          {historyItem.image ? (
                            <a
                              href={historyItem.image}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline flex items-center text-xs sm:text-sm"
                            >
                              <img
                                src={historyItem.image}
                                alt="Attachment"
                                className="h-6 w-6 sm:h-8 sm:w-8 object-cover rounded-md mr-2"
                              />
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs sm:text-sm">No file</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isSuperAdmin ? 14 : 13} className="px-4 sm:px-6 py-4 text-center text-gray-500 text-xs sm:text-sm">
                        {searchTerm || selectedMembers.length > 0 || startDate || endDate
                          ? "No records matching your filters"
                          : "No completed records found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              /* Delegation Table */
              <table className="min-w-full divide-y divide-gray-200 mobile-card-table">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {isSuperAdmin && (
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) => handleSelectAllDelegation(e.target.checked)}
                          checked={selectedDelegationItems.length > 0 && selectedDelegationItems.length === pendingDelegationApprovalCount}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                      </th>
                    )}
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Status</th>
                    {isSuperAdmin && (
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">Admin Remarks</th>
                    )}
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Given By</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Task Description</th>
                    {isSuperAdmin && (
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">Admin Remarks</th>
                    )}
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50">Created At</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">Status</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Extend Date</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50 min-w-[120px]">Reason</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDelegationData.length > 0 ? (
                    filteredDelegationData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {isSuperAdmin && (
                          <td className="px-2 sm:px-3 py-2 sm:py-4 mobile-checkbox-cell" data-label="Select">
                            {item.admin_done !== 'Done' ? (
                              <input
                                type="checkbox"
                                checked={isDelegationItemSelected(item.id)}
                                onChange={(e) => handleDelegationItemSelect(item.id, e.target.checked)}
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
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="Admin Status">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
                        <td className="px-2 sm:px-3 py-2 sm:py-4 min-w-[150px]" data-label="Task Description">
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
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
                        <td className="px-2 sm:px-3 py-2 sm:py-4 bg-purple-50 min-w-[120px]" data-label="Reason">
                          <div className="text-xs sm:text-sm text-gray-900" title={item.reason}>
                            {item.reason || "—"}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-4" data-label="File">
                          {item.image_url ? (
                            <a
                              href={item.image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline flex items-center text-xs sm:text-sm"
                            >
                              <img
                                src={item.image_url}
                                alt="Attachment"
                                className="h-6 w-6 sm:h-8 sm:w-8 object-cover rounded-md mr-2"
                              />
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs sm:text-sm">No file</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isSuperAdmin ? 12 : 11} className="px-4 sm:px-6 py-4 text-center text-gray-500 text-xs sm:text-sm">
                        {searchTerm || startDate || endDate
                          ? "No records matching your filters"
                          : "No delegation records found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {isLoadingMoreHistory && (
              <div className="sticky bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 py-3">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500 mr-2"></div>
                  <span className="text-purple-600 text-sm">Loading more...</span>
                </div>
              </div>
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
