"use client"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { CheckCircle2, Upload, X, Search, History, ArrowLeft } from "lucide-react"
import AdminLayout from "../../components/layout/AdminLayout"
import { useDispatch, useSelector } from "react-redux"
import { checklistData, checklistHistoryData, updateChecklist } from "../../redux/slice/checklistSlice"
import { postChecklistAdminDoneAPI, sendChecklistWhatsAppAPI } from "../../redux/api/checkListApi"
import { uniqueDoerNameData } from "../../redux/slice/assignTaskSlice";
import { useNavigate } from "react-router-dom"

// Configuration object - Move all configurations here
const CONFIG = {
  PAGE_CONFIG: {
    title: "Checklist Tasks",
    historyTitle: "Checklist Task History",
    description: "Showing today's tasks and past due tasks",
    historyDescription: "Read-only view of completed tasks with submission history (excluding admin-processed items)",
  },
}

function AccountDataPage() {


  const [accountData, setAccountData] = useState([])
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [additionalData, setAdditionalData] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") // Filter for Today/Overdue/Upcoming
  const [frequencyFilter, setFrequencyFilter] = useState("all") // Filter for Frequency
  const [error, setError] = useState(null)
  const [remarksData, setRemarksData] = useState({})
  const [historyData, setHistoryData] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")
  const [currentPagePending, setCurrentPagePending] = useState(1);
  const [currentPageHistory, setCurrentPageHistory] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [initialHistoryLoading, setInitialHistoryLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false);

  const { checklist, loading, history, hasMore, currentPage } = useSelector((state) => state.checkList);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const tableContainerRef = useRef(null);
  const historyTableContainerRef = useRef(null);

  const { doerName } = useSelector((state) => state.assignTask)

  // Track search for API calls
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Initial data load
  useEffect(() => {
    dispatch(checklistData({ page: 1, search: '' }))
    dispatch(checklistHistoryData(1))
    dispatch(uniqueDoerNameData());

  }, [dispatch])

  // Debounce search term and re-fetch data
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Re-fetch data when debounced search changes
  useEffect(() => {
    dispatch(checklistData({ page: 1, search: debouncedSearch }));
  }, [debouncedSearch, dispatch]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleScrollPending = useCallback(() => {
    if (!tableContainerRef.current || loading || isFetchingMore || !hasMore || checklist.length === 0) return

    const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100

    if (isNearBottom) {
      setIsFetchingMore(true)
      dispatch(checklistData({ page: currentPage + 1, search: debouncedSearch }))
        .finally(() => setIsFetchingMore(false))
    }
  }, [loading, isFetchingMore, hasMore, currentPage, dispatch, checklist.length, debouncedSearch])

  // Handle scroll for history
  const handleScrollHistory = useCallback(() => {
    if (!historyTableContainerRef.current || isLoadingMoreHistory || !hasMoreHistory || history.length === 0) return

    const { scrollTop, scrollHeight, clientHeight } = historyTableContainerRef.current
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100

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
  }, [isLoadingMoreHistory, hasMoreHistory, currentPageHistory, dispatch, history.length])

  // Add scroll event listener
  useEffect(() => {
    const tableElement = tableContainerRef.current
    if (tableElement && !showHistory) {
      tableElement.addEventListener('scroll', handleScrollPending)
      return () => tableElement.removeEventListener('scroll', handleScrollPending)
    }
  }, [handleScrollPending, showHistory])

  useEffect(() => {
    const historyTableElement = historyTableContainerRef.current
    if (historyTableElement && showHistory) {
      historyTableElement.addEventListener('scroll', handleScrollHistory)
      return () => historyTableElement.removeEventListener('scroll', handleScrollHistory)
    }
  }, [handleScrollHistory, showHistory])


  const ITEMS_PER_PAGE = 100;

  // NEW: Admin history selection states
  const [selectedHistoryItems, setSelectedHistoryItems] = useState([])
  const [markingAsDone, setMarkingAsDone] = useState(false)
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    itemCount: 0,
  })
  const [adminRemarks, setAdminRemarks] = useState({}) // New state for admin remarks

  // UPDATED: Format date-time to DD/MM/YYYY HH:MM:SS
  const formatDateTimeToDDMMYYYY = (date) => {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const seconds = date.getSeconds().toString().padStart(2, "0")
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  }

  // UPDATED: Format date only to DD/MM/YYYY (for comparison purposes)
  const formatDateToDDMMYYYY = (date) => {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const isEmpty = (value) => {
    return value === null || value === undefined || (typeof value === "string" && value.trim() === "")
  }

  useEffect(() => {
    const role = localStorage.getItem("role")
    const user = localStorage.getItem("username")
    setUserRole(role || "")
    setUsername(user || "")
  }, [])

  // Load initial history data when showing history
  useEffect(() => {
    if (showHistory && history.length === 0) {
      setInitialHistoryLoading(true)
      dispatch(checklistHistoryData(1))
        .then((result) => {
          if (result.payload && result.payload.length < 50) {
            setHasMoreHistory(false)
          }
        })
        .finally(() => setInitialHistoryLoading(false))
    }
  }, [showHistory, history.length, dispatch])

  // UPDATED: Parse Google Sheets date-time to handle DD/MM/YYYY HH:MM:SS format
  const parseGoogleSheetsDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return ""
    // If already in DD/MM/YYYY HH:MM:SS format, return as is
    if (typeof dateTimeStr === "string" && dateTimeStr.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/)) {
      return dateTimeStr
    }
    // If in DD/MM/YYYY format (without time), return as is
    if (typeof dateTimeStr === "string" && dateTimeStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateTimeStr
    }
    // Handle Google Sheets Date(year,month,day) format
    if (typeof dateTimeStr === "string" && dateTimeStr.startsWith("Date(")) {
      const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateTimeStr)
      if (match) {
        const year = Number.parseInt(match[1], 10)
        const month = Number.parseInt(match[2], 10)
        const day = Number.parseInt(match[3], 10)
        return `${day.toString().padStart(2, "0")}/${(month + 1).toString().padStart(2, "0")}/${year}`
      }
    }
    // Try to parse as a regular date
    try {
      const date = new Date(dateTimeStr)
      if (!isNaN(date.getTime())) {
        // Check if the original string contained time information
        if (typeof dateTimeStr === "string" && (dateTimeStr.includes(":") || dateTimeStr.includes("T"))) {
          return formatDateTimeToDDMMYYYY(date)
        } else {
          return formatDateToDDMMYYYY(date)
        }
      }
    } catch (error) {
      console.error("Error parsing date-time:", error)
    }
    return dateTimeStr
  }

  // UPDATED: Parse date from DD/MM/YYYY or DD/MM/YYYY HH:MM:SS format for comparison
  const parseDateFromDDMMYYYY = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return null;

    const [datePart] = dateStr.split(" ");
    const parts = datePart.split("/");

    if (parts.length !== 3) return null;

    return new Date(parts[2], parts[1] - 1, parts[0]); // yyyy, mm (0-indexed), dd
  };



  const sortDateWise = (a, b) => {
    // For current data structure, use task_start_date instead of col6
    const dateStrA = a.task_start_date || ""
    const dateStrB = b.task_start_date || ""

    const dateA = new Date(dateStrA)
    const dateB = new Date(dateStrB)

    if (!dateA || isNaN(dateA.getTime())) return 1
    if (!dateB || isNaN(dateB.getTime())) return -1

    return dateA.getTime() - dateB.getTime()
  }

  const resetFilters = () => {
    setSearchTerm("")
    setSelectedMembers([])
    setStartDate("")
    setEndDate("")
  }

  // NEW: Admin functions for history management
  const handleMarkMultipleDone = async () => {
    if (selectedHistoryItems.length === 0) {
      return
    }
    if (markingAsDone) return

    // Open confirmation modal
    setConfirmationModal({
      isOpen: true,
      itemCount: selectedHistoryItems.length,
    })
  }

  // NEW: Send WhatsApp notification to selected pending items (Admin Only)
  const handleSendWhatsApp = async () => {
    if (selectedItems.size === 0) {
      alert("Please select at least one item to send WhatsApp");
      return;
    }
    if (sendingWhatsApp) return;

    setSendingWhatsApp(true);
    try {
      // Get full task objects from filteredAccountData based on selected task_ids
      const selectedTaskIds = Array.from(selectedItems);
      const selectedTasks = filteredAccountData.filter(task => 
        selectedTaskIds.includes(task.task_id)
      );

      const result = await sendChecklistWhatsAppAPI(selectedTasks);
      
      if (result.error) {
        setSuccessMessage(`Failed to send WhatsApp: ${result.error.message || 'Unknown error'}`);
      } else {
        setSuccessMessage(result.message || 'WhatsApp messages sent successfully!');
      }
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      setSuccessMessage(`Failed to send WhatsApp: ${error.message}`);
    } finally {
      setSendingWhatsApp(false);
    }
  }

  // NEW: Confirmation modal component
  const ConfirmationModal = ({ isOpen, itemCount, onConfirm, onCancel }) => {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-yellow-100 text-yellow-600 rounded-full p-3 mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Mark Items as Done</h2>
          </div>

          <p className="text-gray-600 text-center mb-6 text-sm sm:text-base">
            Are you sure you want to mark {itemCount} {itemCount === 1 ? "item" : "items"} as done?
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

  const parseSupabaseDate = (dateStr) => {
    if (!dateStr) return null;

    // Handle ISO string from Supabase
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
      return new Date(dateStr);
    }

    // Handle already parsed Date objects
    if (dateStr instanceof Date) {
      return dateStr;
    }

    // Fallback for other formats
    return new Date(dateStr);
  };

  // UPDATED: Confirmation handler - Don't remove items from UI, just update their status
  const confirmMarkDone = async () => {
    setConfirmationModal({ isOpen: false, itemCount: 0 });
    setMarkingAsDone(true);
    try {
      const payload = selectedHistoryItems.map(item => ({
        task_id: item.task_id,
        remarks: adminRemarks[item.task_id] || ""
      }))
      const { data, error } = await postChecklistAdminDoneAPI(payload);

      if (error) {
        throw new Error(error.message || "Failed to mark items as done");
      }

      // Clear selected items
      setSelectedHistoryItems([]);
      setAdminRemarks({}); // Clear remarks

      // Refresh data
      dispatch(checklistHistoryData());

      setSuccessMessage(
        `Successfully marked ${selectedHistoryItems.length} items as admin processed!`
      );
    } catch (error) {
      console.error("Error marking tasks as done:", error);
      setSuccessMessage(`Failed to mark tasks as done: ${error.message}`);
    } finally {
      setMarkingAsDone(false);
    }
  };

  // Filtered data for pending tasks
  const filteredAccountData = useMemo(() => {
    if (!Array.isArray(checklist)) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Helper function to get upcoming days based on frequency
    const getUpcomingDays = (frequency) => {
      switch (frequency?.toLowerCase()) {
        case 'daily':
          return 1; // Show today + 1 day (tomorrow)
        case 'weekly':
          return 7; // Show 7 days ahead for weekly
        case 'fortnightly':
          return 14;
        case 'monthly':
          return 30;
        case 'quarterly':
          return 90;
        case 'yearly':
          return 365;
        default:
          return 1;
      }
    };

    // Helper function to get past days to show based on frequency
    const getPastDays = (frequency) => {
      switch (frequency?.toLowerCase()) {
        case 'daily':
          return 0; // Only today
        case 'weekly':
          return 5; // 5 days previous
        case 'monthly':
          return 23; // 23 days ago
        case 'quarterly':
          return 75; // 75 days ago
        case 'yearly':
          return 330; // 330 days ago
        default:
          return 0;
      }
    };

    let filtered = searchTerm
      ? checklist.filter((account) =>
        Object.values(account).some(
          (value) =>
            value &&
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
      : checklist;

    // Apply date filter based on frequency
    filtered = filtered.filter((account) => {
      if (!account.task_start_date) return false;

      const taskDate = new Date(account.task_start_date);
      taskDate.setHours(0, 0, 0, 0);
      if (isNaN(taskDate.getTime())) return false;

      const frequency = account.frequency || 'daily';
      const upcomingDays = getUpcomingDays(frequency);

      // Calculate future limit based on frequency
      const futureLimit = new Date(today);
      futureLimit.setDate(futureLimit.getDate() + upcomingDays);

      // Always show ALL overdue tasks (before today) + today + upcoming tasks based on frequency
      // This means: taskDate <= futureLimit (no past limit restriction)
      return taskDate <= futureLimit;
    });

    // Apply status filter (Today/Overdue/Upcoming)
    if (statusFilter !== 'all') {
      filtered = filtered.filter((account) => {
        const taskDate = new Date(account.task_start_date);
        taskDate.setHours(0, 0, 0, 0);
        
        const diffTime = taskDate.getTime() - today.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (statusFilter === 'today') {
          return diffDays === 0;
        } else if (statusFilter === 'overdue') {
          return diffDays < 0;
        } else if (statusFilter === 'upcoming') {
          return diffDays > 0;
        }
        return true;
      });
    }

    // Apply frequency filter
    if (frequencyFilter !== 'all') {
      filtered = filtered.filter((account) => {
        return account.frequency?.toLowerCase() === frequencyFilter.toLowerCase();
      });
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.task_start_date || "");
      const dateB = new Date(b.task_start_date || "");

      if (!dateA || isNaN(dateA.getTime())) return 1;
      if (!dateB || isNaN(dateB.getTime())) return -1;

      return dateA.getTime() - dateB.getTime();
    });
  }, [checklist, searchTerm, statusFilter, frequencyFilter]);

  // Helper function to determine task status (Today, Upcoming, Overdue)
  const getTaskStatus = (taskStartDate) => {
    if (!taskStartDate) return 'unknown';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taskDate = new Date(taskStartDate);
    taskDate.setHours(0, 0, 0, 0);
    
    if (isNaN(taskDate.getTime())) return 'unknown';
    
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    return 'upcoming';
  };

  // Check if checkbox should be enabled (only for today and overdue tasks)
  const isCheckboxEnabled = (taskStartDate) => {
    const status = getTaskStatus(taskStartDate);
    return status === 'today' || status === 'overdue';
  };

  const filteredHistoryData = useMemo(() => {
    if (!Array.isArray(history)) return []

    const filtered = history
      .filter((item) => {
        // Search filter
        const matchesSearch = searchTerm
          ? Object.entries(item).some(([key, value]) => {
            if (['image', 'admin_done'].includes(key)) return false
            return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
          })
          : true

        // Member filter
        const matchesMember = selectedMembers.length > 0
          ? selectedMembers.includes(item.name)
          : true

        // Date range filter
        let matchesDateRange = true

        if (startDate || endDate) {
          const itemDate = parseSupabaseDate(item.task_start_date)
          if (!itemDate || isNaN(itemDate.getTime())) return false

          // Normalize to start of day for comparison
          const itemDateOnly = new Date(
            itemDate.getFullYear(),
            itemDate.getMonth(),
            itemDate.getDate()
          )

          // Create comparison dates
          const start = startDate ? new Date(startDate) : null
          if (start) start.setHours(0, 0, 0, 0)

          const end = endDate ? new Date(endDate) : null
          if (end) {
            end.setHours(23, 59, 59, 999) // End of day
          }

          // Compare dates
          if (start && itemDateOnly < start) matchesDateRange = false
          if (end && itemDateOnly > end) matchesDateRange = false
        }

        return matchesSearch && matchesMember && matchesDateRange
      })
      .sort((a, b) => {
        const dateA = parseSupabaseDate(a.task_start_date)
        const dateB = parseSupabaseDate(b.task_start_date)
        if (!dateA) return 1
        if (!dateB) return -1
        return dateB - dateA // Sort newest first
      })

    // Return only the items for current page
    return filtered.slice(0, currentPageHistory * 50) // 50 items per page
  }, [history, searchTerm, selectedMembers, startDate, endDate, currentPageHistory])


  const getTaskStatistics = () => {
    const totalCompleted = history.length
    const memberStats =
      selectedMembers.length > 0
        ? selectedMembers.reduce((stats, member) => {
          const memberTasks = history.filter((task) => task.name === member).length
          return {
            ...stats,
            [member]: memberTasks,
          }
        }, {})
        : {}
    const filteredTotal = filteredHistoryData.length
    return {
      totalCompleted,
      memberStats,
      filteredTotal,
    }
  }

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

  const fetchSheetData = useCallback(async () => {
    try {
      const pendingAccounts = []
      const historyRows = []

      const currentUsername = localStorage.getItem("username")
      const currentUserRole = localStorage.getItem("role")
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      const todayStr = formatDateToDDMMYYYY(today)
      const tomorrowStr = formatDateToDDMMYYYY(tomorrow)
      console.log("Filtering dates:", { todayStr, tomorrowStr })

      const membersSet = new Set()
      let rows = []

      setAccountData(checklist)
      setHistoryData(history)
    } catch (error) {
      console.error("Error fetching sheet data:", error)
      setError("Failed to load account data: " + error.message)
    }
  }, [])

  // Checkbox handlers with better state management
  const handleSelectItem = useCallback((id, isChecked) => {
    console.log(`Checkbox action: ${id} -> ${isChecked}`)
    setSelectedItems((prev) => {
      const newSelected = new Set(prev)
      if (isChecked) {
        newSelected.add(id)
      } else {
        newSelected.delete(id)
        // Clean up related data when unchecking
        setAdditionalData((prevData) => {
          const newAdditionalData = { ...prevData }
          delete newAdditionalData[id]
          return newAdditionalData
        })
        setRemarksData((prevRemarks) => {
          const newRemarksData = { ...prevRemarks }
          delete newRemarksData[id]
          return newRemarksData
        })
      }
      console.log(`Updated selection: ${Array.from(newSelected)}`)
      return newSelected
    })
  }, [])

  const handleCheckboxClick = useCallback(
    (e, id) => {
      e.stopPropagation()
      const isChecked = e.target.checked
      console.log(`Checkbox clicked: ${id}, checked: ${isChecked}`)
      handleSelectItem(id, isChecked)
    },
    [handleSelectItem],
  )

  const handleSelectAllItems = useCallback(
    (e) => {
      e.stopPropagation()
      const checked = e.target.checked
      console.log(`Select all clicked: ${checked}`)
      if (checked) {
        const allIds = filteredAccountData.map((item) => item.task_id)
        setSelectedItems(new Set(allIds))
        console.log(`Selected all items: ${allIds}`)
      } else {
        setSelectedItems(new Set())
        setAdditionalData({})
        setRemarksData({})
        console.log("Cleared all selections")
      }
    },
    [filteredAccountData],
  )

  const [uploadedImages, setUploadedImages] = useState({});

  // Update the handleImageUpload function
  const handleImageUpload = async (id, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create a preview URL for the image
    const previewUrl = URL.createObjectURL(file);

    // Update the uploadedImages state
    setUploadedImages(prev => ({
      ...prev,
      [id]: {
        file,
        previewUrl
      }
    }));

    // Also update the accountData if needed
    setAccountData(prev =>
      prev.map(item =>
        item.task_id === id
          ? { ...item, image: file }
          : item
      )
    );
  };

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};


  const toggleHistory = () => {
    setShowHistory((prev) => !prev)
    resetFilters()
  }

  useEffect(() => {
    setCurrentPagePending(1);
    setCurrentPageHistory(1);
  }, [searchTerm, selectedMembers, startDate, endDate, showHistory]);

  const LoadingIndicator = () => (
    <div className="text-center py-4 bg-gray-50">
      {isLoadingMore ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500 mr-2"></div>
          <span className="text-purple-600 text-sm">Loading more items...</span>
        </div>
      ) : null}
    </div>
  );


  const hasMoreItems = () => {
    if (showHistory) {
      const totalFilteredItems = history.filter((item) => {
        // Apply same filters as in filteredHistoryData
        const matchesSearch = searchTerm
          ? Object.entries(item).some(([key, value]) => {
            if (['image', 'admin_done'].includes(key)) return false;
            return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
          })
          : true;

        const matchesMember = selectedMembers.length > 0
          ? selectedMembers.includes(item.name)
          : true;

        let matchesDateRange = true;
        if (startDate || endDate) {
          const itemDate = parseSupabaseDate(item.task_start_date);
          if (!itemDate || isNaN(itemDate.getTime())) return false;

          const itemDateOnly = new Date(
            itemDate.getFullYear(),
            itemDate.getMonth(),
            itemDate.getDate()
          );

          const start = startDate ? new Date(startDate) : null;
          if (start) start.setHours(0, 0, 0, 0);

          const end = endDate ? new Date(endDate) : null;
          if (end) end.setHours(23, 59, 59, 999);

          if (start && itemDateOnly < start) matchesDateRange = false;
          if (end && itemDateOnly > end) matchesDateRange = false;
        }

        return matchesSearch && matchesMember && matchesDateRange;
      }).length;

      return currentPageHistory * ITEMS_PER_PAGE < totalFilteredItems;
    } else {
      const totalFilteredItems = checklist.filter((account) =>
        searchTerm
          ? Object.values(account).some(
            (value) =>
              value &&
              value.toString().toLowerCase().includes(searchTerm.toLowerCase())
          )
          : true
      ).length;

      return currentPagePending * ITEMS_PER_PAGE < totalFilteredItems;
    }
  };



  // UPDATED: MAIN SUBMIT FUNCTION with date-time formatting
const handleSubmit = async () => {
  const selectedItemsArray = Array.from(selectedItems);
  if (selectedItemsArray.length === 0) {
    alert("Please select at least one item to submit");
    return;
  }

  // NEW: Check if all selected items have status selected
  const missingStatus = selectedItemsArray.filter((id) => {
    const status = additionalData[id];
    return !status || status === ""; 
  });

  if (missingStatus.length > 0) {
    alert(`Please select status (Yes/No) for all selected tasks.`);
    return;
  }

  // Check remarks for "No"
  const missingRemarks = selectedItemsArray.filter((id) => {
    const additionalStatus = additionalData[id];
    const remarks = remarksData[id];
    return additionalStatus === "No" && (!remarks || remarks.trim() === "");
  });

  if (missingRemarks.length > 0) {
    alert(`Please provide remarks for items marked as "No".`);
    return;
  }

  // Required images
  const missingRequiredImages = selectedItemsArray.filter((id) => {
    const item = checklist.find((acc) => acc.task_id === id);
    const requiresAttachment = item.require_attachment?.toUpperCase() === "YES";
    const hasImage = uploadedImages[id] || item.image;
    const statusIsNo = additionalData[id] === "No";

    return requiresAttachment && !hasImage && !statusIsNo;
  });

  if (missingRequiredImages.length > 0) {
    alert(`Please upload images for all required attachments.`);
    return;
  }

  setIsSubmitting(true);

  // 🔥 FIXED: Convert image to BASE64
const submissionData = await Promise.all(
  selectedItemsArray.map(async (id) => {
    const item = checklist.find((acc) => acc.task_id === id);
    const imageData = uploadedImages[id];

    let finalBase64Image = null;

    if (imageData?.file) {
      finalBase64Image = await fileToBase64(imageData.file); // <– FileReader se base64
    }

    return {
      taskId: item.task_id,
      status: additionalData[id] || "",
      remarks: remarksData[id] || "",
      image: finalBase64Image || item.image || null, // <– yahi backend ko milega
    };
  })
);


  console.log("Submission Data:", submissionData);

  await dispatch(updateChecklist(submissionData));

  setTimeout(() => {
    setIsSubmitting(false);
    setSuccessMessage(
      `Successfully logged ${selectedItemsArray.length} task records!`
    );

    // Reset
    setSelectedItems(new Set());
    setAdditionalData({});
    setRemarksData({});
    setUploadedImages({});

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }, 1500);
};


  // Convert Set to Array for display
  const selectedItemsCount = selectedItems.size

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
        <div className="flex flex-col gap-3 sm:gap-4">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-purple-700">
            {showHistory ? CONFIG.PAGE_CONFIG.historyTitle : CONFIG.PAGE_CONFIG.title}
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={showHistory ? "Search history..." : "Search tasks..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              />
            </div>
            {!showHistory && (
              <>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base bg-white"
                >
                  <option value="all">All Tasks</option>
                  <option value="today">Today</option>
                  <option value="overdue">Overdue</option>
                  <option value="upcoming">Upcoming</option>
                </select>
                <select
                  value={frequencyFilter}
                  onChange={(e) => setFrequencyFilter(e.target.value)}
                  className="px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base bg-white"
                >
                  <option value="all">All Frequencies</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/dashboard/history')}
                className="flex-1 sm:flex-none rounded-md gradient-bg py-2 px-3 sm:px-4 text-white hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm sm:text-base"
              >
                <div className="flex items-center justify-center">
                  <History className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">View History</span>
                  <span className="sm:hidden">History</span>
                </div>
              </button>
              {/* Submit Selected Button - Only for Users */}
              {!showHistory && (userRole === "user" || userRole === "admin" || userRole === "super_admin") && (
                <button
                  onClick={handleSubmit}
                  disabled={selectedItemsCount === 0 || isSubmitting}
                  className="flex-1 sm:flex-none rounded-md gradient-bg py-2 px-3 sm:px-4 text-white hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isSubmitting ? "Processing..." : (
                    <>
                      <span className="hidden sm:inline">Submit Selected ({selectedItemsCount})</span>
                      <span className="sm:hidden">Submit ({selectedItemsCount})</span>
                    </>
                  )}
                </button>
              )}
              {/* WhatsApp Button - For Admin and Super Admin */}
              {!showHistory && (userRole === "admin" || userRole === "super_admin") && selectedItems.size > 0 && (
                <button
                  onClick={handleSendWhatsApp}
                  disabled={sendingWhatsApp}
                  className="flex-1 sm:flex-none rounded-md bg-green-500 py-2 px-3 sm:px-4 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {sendingWhatsApp ? "Sending..." : (
                    <>
                      <span className="hidden sm:inline">📱 WhatsApp ({selectedItems.size})</span>
                      <span className="sm:hidden">📱 ({selectedItems.size})</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Admin Submit Button for History View */}
            {showHistory && userRole === "admin" && selectedHistoryItems.length > 0 && (
              <div className="fixed bottom-4 right-4 sm:top-40 sm:bottom-auto sm:right-10 z-50">
                <button
                  onClick={handleMarkMultipleDone}
                  disabled={markingAsDone}
                  className="rounded-md bg-green-600 text-white px-3 sm:px-4 py-2 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm sm:text-base"
                >
                  {markingAsDone ? "Processing..." : (
                    <>
                      <span className="hidden sm:inline">Mark {selectedHistoryItems.length} Items as Done</span>
                      <span className="sm:hidden">Mark Done ({selectedHistoryItems.length})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-3 rounded-md flex items-center justify-between text-sm sm:text-base">
            <div className="flex items-center">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-500 flex-shrink-0" />
              <span className="break-words">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage("")} className="text-green-500 hover:text-green-700 ml-2 flex-shrink-0">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        )}

        <div className="rounded-lg border border-purple-200 shadow-md bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-3 sm:p-4">
            <h2 className="text-purple-700 font-medium text-sm sm:text-base">
              {showHistory ? `Completed ${CONFIG.SHEET_NAME} Tasks` : `Pending Checklist Tasks`}
            </h2>
            <p className="text-purple-600 text-xs sm:text-sm mt-1">
              {showHistory
                ? `${CONFIG.PAGE_CONFIG.historyDescription} for ${userRole === "admin" ? "all" : "your"} tasks`
                : CONFIG.PAGE_CONFIG.description}
            </p>
          </div>

          {loading && currentPage === 1 ? (
            // Full table loading for initial load
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-purple-600 text-sm sm:text-base">Loading task data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-800 text-center text-sm sm:text-base">
              {error}{" "}
              <button className="underline ml-2" onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          ) : showHistory ? (
            <>
              {/* History Filters */}
              <div className="p-3 sm:p-4 border-b border-purple-100 bg-gray-50">
                <div className="flex flex-col gap-3 sm:gap-4">
                  {getFilteredMembersList().length > 0 && (
                    <div className="flex flex-col">
                      <div className="mb-2 flex items-center">
                        <span className="text-xs sm:text-sm font-medium text-purple-700">Filter by Member:</span>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-3 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-md bg-white">
                        {getFilteredMembersList().map((member, idx) => (
                          <div key={idx} className="flex items-center">
                            <input
                              id={`member-${idx}`}
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              checked={selectedMembers.includes(member)}
                              onChange={() => handleMemberSelection(member)}
                            />
                            <label htmlFor={`member-${idx}`} className="ml-2 text-xs sm:text-sm text-gray-700">
                              {member}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div className="mb-2 flex items-center">
                      <span className="text-xs sm:text-sm font-medium text-purple-700">Filter by Date Range:</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <div className="flex items-center w-full sm:w-auto">
                        <label htmlFor="start-date" className="text-xs sm:text-sm text-gray-700 mr-1 whitespace-nowrap">
                          From
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                          }}
                          className="text-xs sm:text-sm border border-gray-200 rounded-md p-1 flex-1 sm:flex-none"
                        />
                      </div>
                      <div className="flex items-center w-full sm:w-auto">
                        <label htmlFor="end-date" className="text-xs sm:text-sm text-gray-700 mr-1 whitespace-nowrap">
                          To
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                          }}
                          className="text-xs sm:text-sm border border-gray-200 rounded-md p-1 flex-1 sm:flex-none"
                        />
                      </div>
                    </div>
                  </div>
                  {(selectedMembers.length > 0 || startDate || endDate || searchTerm) && (
                    <button
                      onClick={resetFilters}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-xs sm:text-sm w-full sm:w-auto"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>

              {/* NEW: Confirmation Modal */}
              <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                itemCount={confirmationModal.itemCount}
                onConfirm={confirmMarkDone}
                onCancel={() => setConfirmationModal({ isOpen: false, itemCount: 0 })}
              />

              {/* Task Statistics */}
              <div className="p-3 sm:p-4 border-b border-purple-100 bg-blue-50">
                <div className="flex flex-col">
                  <h3 className="text-xs sm:text-sm font-medium text-blue-700 mb-2">Task Completion Statistics:</h3>
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    <div className="px-2 sm:px-3 py-2 bg-white rounded-md shadow-sm">
                      <span className="text-xs text-gray-500">Total Completed</span>
                      <div className="text-base sm:text-lg font-semibold text-blue-600">{getTaskStatistics().totalCompleted}</div>
                    </div>
                    {(selectedMembers.length > 0 || startDate || endDate || searchTerm) && (
                      <div className="px-2 sm:px-3 py-2 bg-white rounded-md shadow-sm">
                        <span className="text-xs text-gray-500">Filtered Results</span>
                        <div className="text-base sm:text-lg font-semibold text-blue-600">{getTaskStatistics().filteredTotal}</div>
                      </div>
                    )}
                    {selectedMembers.map((member) => (
                      <div key={member} className="px-2 sm:px-3 py-2 bg-white rounded-md shadow-sm">
                        <span className="text-xs text-gray-500">{member}</span>
                        <div className="text-base sm:text-lg font-semibold text-indigo-600">
                          {getTaskStatistics().memberStats[member]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* History Table - Mobile Responsive */}
              <div ref={historyTableContainerRef} className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                {initialHistoryLoading ? (
                  <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                    <p className="text-purple-600 text-sm sm:text-base">Loading history data...</p>
                  </div>
                ) : (
                  <>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Task ID
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Department
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Given By
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Name
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                            Task Description
                          </th>
                          {userRole === "admin" && (
                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50 whitespace-nowrap">
                              Admin Remarks
                            </th>
                          )}
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 whitespace-nowrap">
                            Task End Date
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Freq
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Reminders
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Attachment
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50 whitespace-nowrap">
                            Actual Date
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50 whitespace-nowrap">
                            Status
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50 min-w-[120px]">
                            Remarks
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            File
                          </th>

                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredHistoryData.length > 0 ? (
                          filteredHistoryData.map((history, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-2 sm:px-3 py-2 sm:py-4">
                                <div className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                                  {history.task_id || "—"}
                                </div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4">
                                <div className="text-xs sm:text-sm text-gray-900 break-words">{history.department || "—"}</div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4">
                                <div className="text-xs sm:text-sm text-gray-900 break-words">{history.given_by || "—"}</div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4">
                                <div className="text-xs sm:text-sm text-gray-900 break-words">{history.name || "—"}</div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4 min-w-[150px]">
                                <div className="text-xs sm:text-sm text-gray-900 break-words" title={history.task_description}>
                                  {history.task_description || "—"}
                                </div>
                              </td>
                              {userRole === "admin" && (
                                <td className="px-2 sm:px-3 py-2 sm:py-4 bg-purple-50">
                                  {history.admin_done !== 'Done' ? (
                                    <input
                                      type="text"
                                      placeholder="Add remark..."
                                      value={adminRemarks[history.task_id] || ""}
                                      onChange={(e) => setAdminRemarks(prev => ({
                                        ...prev,
                                        [history.task_id]: e.target.value
                                      }))}
                                      className="w-full text-xs p-1 border border-gray-300 rounded"
                                    />
                                  ) : (
                                    <div className="text-xs text-gray-600 break-words">{history.admin_done_remarks || "—"}</div>
                                  )}
                                </td>
                              )}
                             <td className="px-2 sm:px-3 py-2 sm:py-4 bg-yellow-50">
  <div className="text-xs sm:text-sm text-gray-900 break-words">
    {account.task_start_date ? (() => {
      // Parse date string manually to avoid timezone conversion
      // We want to show exactly what is in the DB (e.g. "2026-01-03 13:00:00")
      const dateStr = account.task_start_date;
      
      // robust cleanup: remove 'T', remove milliseconds/Z, remove offset
      const cleanedStr = dateStr
        .replace('T', ' ')
        .replace(/\.\d+Z?$/, '') // remove .000 or .000Z
        .replace(/[+-]\d{2}:\d{2}$/, ''); // remove +05:30
        
      const parts = cleanedStr.split(' ');
      if (parts.length >= 2) {
        const [y, m, d] = parts[0].split('-');
        const timePart = parts[1];
        
        return (
          <div>
            <div className="font-medium break-words">
              {d}/{m}/{y}
            </div>
            <div className="text-xs text-gray-500 break-words">
              {timePart}
            </div>
          </div>
        );
      }
      
      // Fallback for simple date or unexpected format
      const fallbackDate = new Date(dateStr);
      if (!isNaN(fallbackDate.getTime())) {
         const dd = String(fallbackDate.getDate()).padStart(2, '0');
         const mm = String(fallbackDate.getMonth() + 1).padStart(2, '0');
         const yyyy = fallbackDate.getFullYear();
         return `${dd}/${mm}/${yyyy}`;
      }
      return dateStr;
    })() : "—"}
  </div>
</td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4">
                                <div className="text-xs sm:text-sm text-gray-900 break-words">{history.frequency || "—"}</div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4">
                                <div className="text-xs sm:text-sm text-gray-900 break-words">{history.enable_reminder || "—"}</div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4">
                                <div className="text-xs sm:text-sm text-gray-900 break-words">{history.require_attachment || "—"}</div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4 bg-green-50">
                                <div className="text-xs sm:text-sm text-gray-900 break-words">
                                  {history.submission_date ? (() => {
                                    const dateObj = new Date(history.submission_date);
                                    const day = ("0" + dateObj.getDate()).slice(-2);
                                    const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
                                    const year = dateObj.getFullYear();
                                    const hours = ("0" + dateObj.getHours()).slice(-2);
                                    const minutes = ("0" + dateObj.getMinutes()).slice(-2);
                                    const seconds = ("0" + dateObj.getSeconds()).slice(-2);

                                    return (
                                      <div>
                                        <div className="font-medium break-words">
                                          {`${day}/${month}/${year}`}
                                        </div>
                                        <div className="text-xs text-gray-500 break-words">
                                          {`${hours}:${minutes}:${seconds}`}
                                        </div>
                                      </div>
                                    );
                                  })() : "—"}
                                </div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4 bg-blue-50">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full break-words ${history.status === "Yes"
                                    ? "bg-green-100 text-green-800"
                                    : history.status === "No"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                  {history.status || "—"}
                                </span>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4 bg-purple-50 min-w-[120px]">
                                <div className="text-xs sm:text-sm text-gray-900 break-words" title={history.remark}>
                                  {history.remark || "—"}
                                </div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4">
                                {history.image ? (
                                  <a
                                    href={history.image}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline flex items-center break-words text-xs sm:text-sm"
                                  >
                                    <img
                                      src={history.image || "/placeholder.svg?height=32&width=32"}
                                      alt="Attachment"
                                      className="h-6 w-6 sm:h-8 sm:w-8 object-cover rounded-md mr-2 flex-shrink-0"
                                    />
                                    <span className="break-words">View</span>
                                  </a>
                                ) : (
                                  <span className="text-gray-400 text-xs sm:text-sm">No file</span>
                                )}
                              </td>

                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={userRole === "admin" ? 15 : 13} className="px-4 sm:px-6 py-4 text-center text-gray-500 text-xs sm:text-sm">
                              {searchTerm || selectedMembers.length > 0 || startDate || endDate
                                ? "No historical records matching your filters"
                                : "No completed records found"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {isLoadingMoreHistory && (
                      <div className="sticky bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200">
                        <div className="flex justify-center items-center py-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500 mr-2"></div>
                          <span className="text-purple-600 text-xs sm:text-sm">Loading more history...</span>
                        </div>
                      </div>
                    )}

                    {!hasMoreHistory && history.length > 0 && (
                      <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">
                        No more history to load
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            /* Regular Tasks Table - Mobile Responsive */
            <div
              ref={tableContainerRef}
              className="overflow-x-auto overflow-y-auto"
              style={{ maxHeight: 'calc(100vh - 280px)' }}
            >
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3 p-3">
                {filteredAccountData.length > 0 ? (
                  filteredAccountData.map((account, index) => {
                    const isSelected = selectedItems.has(account.task_id);
                    const taskStatus = getTaskStatus(account.task_start_date);
                    const checkboxEnabled = isCheckboxEnabled(account.task_start_date);
                    return (
                      <div key={index} className={`bg-white border rounded-lg p-3 shadow-sm ${taskStatus === 'upcoming' ? "border-blue-300 bg-blue-50" : taskStatus === 'overdue' ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {(userRole === "user" || userRole === "admin" || userRole === "super_admin") && (
                              <input
                                type="checkbox"
                                className={`h-4 w-4 rounded border-gray-300 text-purple-600 ${!checkboxEnabled ? 'opacity-50' : ''}`}
                                checked={isSelected}
                                disabled={!checkboxEnabled}
                                onChange={(e) => handleCheckboxClick(e, account.task_id)}
                              />
                            )}
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              taskStatus === 'today' ? "bg-green-100 text-green-800" 
                              : taskStatus === 'upcoming' ? "bg-blue-100 text-blue-800" 
                              : taskStatus === 'overdue' ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                            }`}>
                              {taskStatus === 'today' ? 'Today' : taskStatus === 'upcoming' ? 'Upcoming' : 'Overdue'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">#{account.task_id}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-2">{account.task_description || "—"}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <div><span className="text-gray-500">Name:</span> <span className="font-medium">{account.name || "—"}</span></div>
                          <div><span className="text-gray-500">Dept:</span> <span className="font-medium">{account.department || "—"}</span></div>
                          <div><span className="text-gray-500">Given By:</span> <span className="font-medium">{account.given_by || "—"}</span></div>
                          <div><span className="text-gray-500">Frequency:</span> <span className="font-medium">{account.frequency || "—"}</span></div>
                          <div><span className="text-gray-500">Date:</span> <span className="font-medium">{account.task_start_date ? (() => {
                            const dateStr = account.task_start_date;
                            const cleanedStr = dateStr.replace('T', ' ').replace(/\.\d+Z?$/, '').replace(/[+-]\d{2}:\d{2}$/, '');
                            const parts = cleanedStr.split(' ');
                            if (parts.length >= 2) {
                              const [y, m, d] = parts[0].split('-');
                              const timePart = parts[1];
                              return `${d}/${m}/${y} ${timePart}`;
                            }
                            return dateStr;
                          })() : "—"}</span></div>
                        </div>
                        {userRole === "user" && isSelected && (
                          <div className="border-t pt-2 mt-2 space-y-2">
                            <select
                              value={additionalData[account.task_id] || ""}
                              onChange={(e) => {
                                setAdditionalData((prev) => ({ ...prev, [account.task_id]: e.target.value }));
                              }}
                              className="border border-gray-300 rounded-md px-2 py-1 w-full text-xs"
                            >
                              <option value="">Status...</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Remarks"
                              value={remarksData[account.task_id] || ""}
                              onChange={(e) => setRemarksData((prev) => ({ ...prev, [account.task_id]: e.target.value }))}
                              className="border border-gray-300 rounded-md px-2 py-1 w-full text-xs"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    {searchTerm ? "No tasks matching your search" : "No pending tasks found"}
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-16">
                      Seq. No.
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Task Status
                    </th>
                    {(userRole === "user" || userRole === "admin" || userRole === "super_admin") && (
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          checked={filteredAccountData.length > 0 && selectedItems.size === filteredAccountData.filter(item => isCheckboxEnabled(item.task_start_date)).length && filteredAccountData.filter(item => isCheckboxEnabled(item.task_start_date)).length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Only select items with enabled checkboxes (today and overdue)
                              const enabledItems = filteredAccountData.filter(item => isCheckboxEnabled(item.task_start_date));
                              setSelectedItems(new Set(enabledItems.map(item => item.task_id)));
                            } else {
                              setSelectedItems(new Set());
                            }
                          }}
                        />
                      </th>
                    )}
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Remarks
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Upload Image
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Task ID
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Department
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Given By
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Name
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                      Task Description
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 whitespace-nowrap">
                      Task End Date
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Freq
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Reminders
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Attachment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAccountData.length > 0 ? (
                    filteredAccountData.map((account, index) => {
                      const isSelected = selectedItems.has(account.task_id);
                      const sequenceNumber = index + 1;
                      const taskStatus = getTaskStatus(account.task_start_date);
                      const checkboxEnabled = isCheckboxEnabled(account.task_start_date);
                      return (
                        <tr key={index} className={`${isSelected ? "bg-purple-50" : taskStatus === 'upcoming' ? "bg-blue-50" : taskStatus === 'overdue' ? "bg-red-50" : ""} hover:bg-gray-50`}>
                          <td className="px-2 sm:px-3 py-2 sm:py-4 w-16">
                            <div className="text-xs sm:text-sm font-medium text-gray-900 text-center">
                              {sequenceNumber}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              taskStatus === 'today' 
                                ? "bg-green-100 text-green-800" 
                                : taskStatus === 'upcoming' 
                                  ? "bg-blue-100 text-blue-800" 
                                  : taskStatus === 'overdue'
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}>
                              {taskStatus === 'today' ? 'Today' : taskStatus === 'upcoming' ? 'Upcoming' : taskStatus === 'overdue' ? 'Overdue' : '—'}
                            </span>
                          </td>
                          {(userRole === "user" || userRole === "admin" || userRole === "super_admin") && (
                            <td className="px-2 sm:px-3 py-2 sm:py-4 w-12">
                              <input
                                type="checkbox"
                                className={`h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 ${!checkboxEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                checked={isSelected}
                                disabled={!checkboxEnabled}
                                onChange={(e) => handleCheckboxClick(e, account.task_id)}
                                title={!checkboxEnabled ? 'Cannot select upcoming tasks' : ''}
                              />
                            </td>
                          )}
                          <td className="px-2 sm:px-3 py-2 sm:py-4 bg-yellow-50">
                            <select
                              disabled={!isSelected}
                              value={additionalData[account.task_id] || ""}
                              onChange={(e) => {
                                setAdditionalData((prev) => ({ ...prev, [account.task_id]: e.target.value }));
                                if (e.target.value !== "No") {
                                  setRemarksData((prev) => {
                                    const newData = { ...prev };
                                    delete newData[account.task_id];
                                    return newData;
                                  });
                                }
                              }}
                              className="border border-gray-300 rounded-md px-2 py-1 w-full disabled:bg-gray-100 disabled:cursor-not-allowed text-xs sm:text-sm"
                            >
                              <option value="">Select...</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4 bg-orange-50 min-w-[120px]">
                            <input
                              type="text"
                              placeholder="Enter remarks"
                              disabled={!isSelected || !additionalData[account.task_id]}
                              value={remarksData[account.task_id] || ""}
                              onChange={(e) => setRemarksData((prev) => ({ ...prev, [account.task_id]: e.target.value }))}
                              className="border rounded-md px-2 py-1 w-full border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-xs sm:text-sm break-words"
                            />
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4 bg-green-50">
                            {uploadedImages[account.task_id] || account.image ? (
                              <div className="flex items-center">
                                <img
                                  src={
                                    uploadedImages[account.task_id]?.previewUrl ||
                                    (typeof account.image === 'string' ? account.image : '')
                                  }
                                  alt="Receipt"
                                  className="h-8 w-8 sm:h-10 sm:w-10 object-cover rounded-md mr-2 flex-shrink-0"
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs text-gray-500 break-words">
                                    {uploadedImages[account.task_id]?.file.name ||
                                      (account.image instanceof File ? account.image.name : "Uploaded")}
                                  </span>
                                  {uploadedImages[account.task_id] ? (
                                    <span className="text-xs text-green-600">Ready</span>
                                  ) : (
                                    <button
                                      className="text-xs text-purple-600 hover:text-purple-800 break-words"
                                      onClick={() => window.open(account.image, "_blank")}
                                    >
                                      View
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <label
                                className={`flex items-center cursor-pointer ${account.require_attachment?.toUpperCase() === "YES" &&
                                  additionalData[account.task_id] !== "No" // Only show as required if status is not "No"
                                  ? "text-red-600 font-medium"
                                  : "text-purple-600"
                                  } hover:text-purple-800`}
                              >
                                <Upload className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span className="text-xs break-words">
                                  {account.require_attachment?.toUpperCase() === "YES" &&
                                    additionalData[account.task_id] !== "No"
                                    ? "Required*"
                                    : "Upload"}
                                </span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(account.task_id, e)}
                                  disabled={!isSelected}
                                />
                              </label>
                            )}
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4">
                            <div className="text-xs sm:text-sm text-gray-900 break-words">{account.task_id || "—"}</div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4">
                            <div className="text-xs sm:text-sm text-gray-900 break-words">{account.department || "—"}</div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4">
                            <div className="text-xs sm:text-sm text-gray-900 break-words">{account.given_by || "—"}</div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4">
                            <div className="text-xs sm:text-sm text-gray-900 break-words">{account.name || "—"}</div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4 min-w-[150px]">
                            <div className="text-xs sm:text-sm text-gray-900 break-words" title={account.task_description}>
                              {account.task_description || "—"}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4 bg-yellow-50">
                            <div className="text-xs sm:text-sm text-gray-900 break-words">
                              {account.task_start_date ? (() => {
                                // Parse date string manually to avoid timezone conversion
                                // We want to show exactly what is in the DB (e.g. "2026-01-03 13:00:00")
                                const dateStr = account.task_start_date;
                                
                                // robust cleanup: remove 'T', remove milliseconds/Z, remove offset
                                const cleanedStr = dateStr
                                  .replace('T', ' ')
                                  .replace(/\.\d+Z?$/, '') // remove .000 or .000Z
                                  .replace(/[+-]\d{2}:\d{2}$/, ''); // remove +05:30
                                  
                                const parts = cleanedStr.split(' ');
                                if (parts.length >= 2) {
                                  const [y, m, d] = parts[0].split('-');
                                  const timePart = parts[1];
                                  
                                  return (
                                    <div>
                                      <div className="font-medium break-words">
                                        {d}/{m}/{y}
                                      </div>
                                      <div className="text-xs text-gray-500 break-words">
                                        {timePart}
                                      </div>
                                    </div>
                                  );
                                }
                                
                                // Fallback for simple date or unexpected format
                                const fallbackDate = new Date(dateStr);
                                if (!isNaN(fallbackDate.getTime())) {
                                   const dd = String(fallbackDate.getDate()).padStart(2, '0');
                                   const mm = String(fallbackDate.getMonth() + 1).padStart(2, '0');
                                   const yyyy = fallbackDate.getFullYear();
                                   return `${dd}/${mm}/${yyyy}`;
                                }
                                return dateStr;
                              })() : "—"}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4">
                            <div className="text-xs sm:text-sm text-gray-900 break-words">{account.frequency || "—"}</div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4">
                            <div className="text-xs sm:text-sm text-gray-900 break-words">{account.enable_reminder || "—"}</div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4">
                            <div className="text-xs sm:text-sm text-gray-900 break-words">{account.require_attachment || "—"}</div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={13} className="px-4 sm:px-6 py-4 text-center text-gray-500 text-xs sm:text-sm">
                        {searchTerm
                          ? "No tasks matching your search"
                          : "No pending tasks found for today, tomorrow, or past due dates"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {isFetchingMore && (
                <div className="sticky bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-center items-center py-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500 mr-2"></div>
                    <span className="text-purple-600 text-xs sm:text-sm">Loading more tasks...</span>
                  </div>
                </div>
              )}

              {!hasMore && checklist.length > 0 && (
                <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">
                  No more tasks to load
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AccountDataPage
