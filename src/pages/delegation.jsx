"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CheckCircle2,
  Upload,
  X,
  Search,
  Filter,
  LayoutDashboard,
} from "lucide-react";
import AdminLayout from "../components/layout/AdminLayout";
import { useDispatch, useSelector } from "react-redux";
import {
  delegationDoneData,
  delegationData,
} from "../redux/slice/delegationSlice";

import { insertDelegationDoneAndUpdate, sendDelegationWhatsAppAPI, postDelegationAdminDoneAPI } from "../redux/api/delegationApi";

// Configuration object - Move all configurations here
const CONFIG = {
  APPS_SCRIPT_URL:
    "https://script.google.com/macros/s/AKfycbzXzqnKmbeXw3i6kySQcBOwxHQA7y8WBFfEe69MPbCR-jux0Zte7-TeSKi8P4CIFkhE/exec",
  DRIVE_FOLDER_ID: "1LPsmRqzqvp6b7aY9FS1NfiiK0LV03v03",
  SOURCE_SHEET_NAME: "DELEGATION",
  TARGET_SHEET_NAME: "DELEGATION DONE",
  PAGE_CONFIG: {
    title: "DELEGATION Tasks",
    historyTitle: "DELEGATION Task History",
    description: "Showing all pending tasks",
    historyDescription:
      "Read-only view of completed tasks with submission history",
  },
};

// Debounce hook for search optimization
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function DelegationDataPage() {
  const [uploadedImages, setUploadedImages] = useState({});
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [remarksData, setRemarksData] = useState({});
  const [statusData, setStatusData] = useState({});
  const [nextTargetDate, setNextTargetDate] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userRole, setUserRole] = useState("");
  const [username, setUsername] = useState("");
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedDelegationItems, setSelectedDelegationItems] = useState([]);
  const [adminRemarks, setAdminRemarks] = useState({});
  const [markingAsDone, setMarkingAsDone] = useState(false);
  const [mainStatusFilter, setMainStatusFilter] = useState("pending"); // 'all', 'pending', 'completed'
  const [activeNameTab, setActiveNameTab] = useState("EA"); // 'EA' or 'Gyan Ranjan Das'
  const [unifiedTypeFilter, setUnifiedTypeFilter] = useState("all"); // 'all', 'pending', 'approval'
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    itemCount: 0,
    type: "delegation"
  });

  const filterOptions = [
    { value: "all", label: "All Tasks" },
    { value: "overdue", label: "Overdue" },
    { value: "today", label: "Today" },
    { value: "upcoming", label: "Upcoming" },
  ];

  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { loading, delegation, delegation_done } = useSelector(
    (state) => state.delegation
  );
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(delegationData());
    // dispatch(delegation_DoneData());
    dispatch(delegationDoneData());
  }, [dispatch]);

  const formatDateTimeToDDMMYYYY = useCallback((date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }, []);

  const formatDateToDDMMYYYY = useCallback((date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const user = localStorage.getItem("user-name");
    setUserRole(role || "");
    setUsername(user || "");
  }, []);

  const parseGoogleSheetsDateTime = useCallback(
    (dateTimeStr) => {
      if (!dateTimeStr) return "";

      if (
        typeof dateTimeStr === "string" &&
        dateTimeStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{1,2}:\d{1,2}$/)
      ) {
        const [datePart, timePart] = dateTimeStr.split(" ");
        const [day, month, year] = datePart.split("/");
        const [hours, minutes, seconds] = timePart.split(":");

        const paddedDay = day.padStart(2, "0");
        const paddedMonth = month.padStart(2, "0");
        const paddedHours = hours.padStart(2, "0");
        const paddedMinutes = minutes.padStart(2, "0");
        const paddedSeconds = seconds.padStart(2, "0");

        return `${paddedDay}/${paddedMonth}/${year} ${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
      }

      if (
        typeof dateTimeStr === "string" &&
        dateTimeStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)
      ) {
        const parts = dateTimeStr.split("/");
        if (parts.length === 3) {
          const day = parts[0].padStart(2, "0");
          const month = parts[1].padStart(2, "0");
          const year = parts[2];
          return `${day}/${month}/${year} 00:00:00`;
        }
        return dateTimeStr + " 00:00:00";
      }

      if (typeof dateTimeStr === "string" && dateTimeStr.startsWith("Date(")) {
        const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateTimeStr);
        if (match) {
          const year = Number.parseInt(match[1], 10);
          const month = Number.parseInt(match[2], 10);
          const day = Number.parseInt(match[3], 10);
          return `${day.toString().padStart(2, "0")}/${(month + 1)
            .toString()
            .padStart(2, "0")}/${year} 00:00:00`;
        }
      }

      try {
        const date = new Date(dateTimeStr);
        if (!isNaN(date.getTime())) {
          if (dateTimeStr.includes(":") || dateTimeStr.includes("T")) {
            return formatDateTimeToDDMMYYYY(date);
          } else {
            return formatDateToDDMMYYYY(date) + " 00:00:00";
          }
        }
      } catch (error) {
        console.error("Error parsing datetime:", error);
      }

      if (
        typeof dateTimeStr === "string" &&
        dateTimeStr.includes("/") &&
        !dateTimeStr.includes(":")
      ) {
        return dateTimeStr + " 00:00:00";
      }

      return dateTimeStr;
    },
    [formatDateTimeToDDMMYYYY, formatDateToDDMMYYYY]
  );

  const formatDateTimeForDisplay = useCallback(
    (dateTimeStr) => {
      if (!dateTimeStr) return "—";

      if (
        typeof dateTimeStr === "string" &&
        dateTimeStr.match(/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/)
      ) {
        return dateTimeStr;
      }

      if (
        typeof dateTimeStr === "string" &&
        dateTimeStr.match(/^\d{2}\/\d{2}\/\d{4}$/)
      ) {
        return dateTimeStr;
      }

      return parseGoogleSheetsDateTime(dateTimeStr) || "—";
    },
    [parseGoogleSheetsDateTime]
  );


  const getRowColor = useCallback((colorCode) => {
    if (!colorCode) return "bg-white";

    const code = colorCode.toString().toLowerCase();
    switch (code) {
      case "red":
        return "bg-red-50 border-l-4 border-red-400";
      case "yellow":
        return "bg-yellow-50 border-l-4 border-yellow-400";
      case "green":
        return "bg-green-50 border-l-4 border-green-400";
      case "blue":
        return "bg-blue-50 border-l-4 border-blue-400";
      default:
        return "bg-white";
    }
  }, []);

  // Filtered delegation data for Admin Approval
  const filteredApprovalData = useMemo(() => {
    if (!Array.isArray(delegation_done)) return [];

    return delegation_done
      .filter((item) => {
        const userMatch =
          userRole === "admin" ||
          userRole === "super_admin" ||
          (item.name && item.name.toLowerCase() === username.toLowerCase());
        if (!userMatch) return false;

        const matchesSearch = debouncedSearchTerm
          ? Object.entries(item).some(([key, value]) => {
            if (['image_url', 'admin_done'].includes(key)) return false;
            return value && value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase());
          })
          : true;

        let matchesDateRange = true;
        if (startDate || endDate) {
          const itemDate = item.created_at ? new Date(item.created_at) : null;
          if (!itemDate || isNaN(itemDate.getTime())) return false;

          if (startDate) {
            const startDateObj = new Date(startDate);
            startDateObj.setHours(0, 0, 0, 0);
            if (itemDate < startDateObj) matchesDateRange = false;
          }

          if (endDate) {
            const endDateObj = new Date(endDate);
            endDateObj.setHours(23, 59, 59, 999);
            if (itemDate > endDateObj) matchesDateRange = false;
          }
        }

        return matchesSearch && matchesDateRange;
      })
      .filter((item) => {
        if (mainStatusFilter === "pending") {
          return item.admin_done !== 'Done' && item.status === 'completed';
        } else if (mainStatusFilter === "completed") {
          return item.admin_done === 'Done';
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : null;
        const dateB = b.created_at ? new Date(b.created_at) : null;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.getTime() - dateA.getTime();
      });
  }, [delegation_done, debouncedSearchTerm, startDate, endDate, userRole, username, mainStatusFilter]);

  const pendingApprovalCount = useMemo(() => {
    const targetName = "gyan ranjan das";
    return filteredApprovalData.filter(item => {
      const isGyan = (item.name || "").toLowerCase().includes(targetName);
      const matchesTab = activeNameTab === "EA" ? !isGyan : isGyan;
      return matchesTab && item.admin_done !== 'Done' && item.status === 'completed';
    }).length;
  }, [filteredApprovalData, activeNameTab]);

  const filteredDelegationTasks = useMemo(() => {
    if (!delegation) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return delegation.filter((task) => {
      const matchesSearch = debouncedSearchTerm
        ? Object.values(task).some(
          (value) =>
            value &&
            value
              .toString()
              .toLowerCase()
              .includes(debouncedSearchTerm.toLowerCase())
        )
        : true;

      let matchesDateFilter = true;
      if (dateFilter !== "all" && task.planned_date) {
        const plannedDate = new Date(task.planned_date);
        plannedDate.setHours(0, 0, 0, 0);

        switch (dateFilter) {
          case "overdue":
            matchesDateFilter = plannedDate < today;
            break;
          case "today":
            matchesDateFilter = plannedDate.getTime() === today.getTime();
            break;
          case "upcoming":
            matchesDateFilter = plannedDate >= tomorrow;
            break;
          default:
            matchesDateFilter = true;
        }
      }

      return matchesSearch && matchesDateFilter;
    });
  }, [delegation, debouncedSearchTerm, dateFilter]);

  const unifiedData = useMemo(() => {
    let pending = filteredDelegationTasks.map(task => ({
      ...task,
      unifiedType: 'pending',
      unifiedId: `p-${task.task_id}`
    }));

    let approvals = filteredApprovalData.map(item => ({
      ...item,
      unifiedType: 'approval',
      unifiedId: `a-${item.id}`
    }));

    if (unifiedTypeFilter === 'pending') approvals = [];
    if (unifiedTypeFilter === 'approval') pending = [];

    let combined = [...pending, ...approvals];

    // Apply Main Status Filter
    if (mainStatusFilter === 'pending') {
      combined = combined.filter(item => {
        if (item.unifiedType === 'pending') return true;
        return item.admin_done !== 'Done';
      });
    } else if (mainStatusFilter === 'completed') {
      combined = combined.filter(item => {
        if (item.unifiedType === 'approval') return item.admin_done === 'Done';
        return false; // Regular tasks in this view are usually 'pending' by definition
      });
    }

    // Apply Person Tab Filter (EA vs Gyan Ranjan Das)
    const targetName = "gyan ranjan das";
    const showNameTabs = userRole === 'admin' || userRole === 'super_admin' || (username || "").toLowerCase().includes(targetName);
    
    if (showNameTabs) {
      if (activeNameTab === "EA") {
        combined = combined.filter(item => !(item.name || "").toLowerCase().includes(targetName));
      } else if (activeNameTab === "Gyan Ranjan Das") {
        combined = combined.filter(item => (item.name || "").toLowerCase().includes(targetName));
      }
    }

    return combined.sort((a, b) => (b.task_id || 0) - (a.task_id || 0));
  }, [filteredDelegationTasks, filteredApprovalData, unifiedTypeFilter, mainStatusFilter, activeNameTab, userRole, username]);

  const StatusBadge = ({ status, adminDone, type }) => {
    // If it's an approval item and admin has marked it Done
    if (type === 'approval' && adminDone === 'Done') {
      return (
        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm bg-green-100 text-green-700 border border-green-200">
          Done
        </span>
      );
    }

    // If it's an approval item and NOT yet marked Done by admin
    if (type === 'approval') {
      return (
        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm bg-orange-100 text-orange-700 border border-orange-200">
          Pending Approval
        </span>
      );
    }

    // Otherwise it's a regular task
    const lowerStatus = (status || "").toString().toLowerCase().trim();
    
    switch (lowerStatus) {
      case 'pending':
        return (
          <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm bg-yellow-100 text-yellow-700 border border-yellow-200">
            Pending
          </span>
        );
      case 'partial done':
      case 'partial_done':
        return (
          <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm bg-blue-100 text-blue-700 border border-blue-200">
            Partial Done
          </span>
        );
      case 'completed':
      case 'done':
        return (
          <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm bg-green-100 text-green-700 border border-green-200">
            Done
          </span>
        );
      case 'extend date':
      case 'extend':
        return (
          <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm bg-purple-100 text-purple-700 border border-purple-200">
            Extended
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm bg-gray-100 text-gray-500 border border-gray-200">
            {status || "Pending"}
          </span>
        );
    }
  };

  const handleSelectItem = useCallback((id, isChecked) => {
    setSelectedItems((prev) => {
      const newSelected = new Set(prev);

      if (isChecked) {
        newSelected.add(id);
        setStatusData((prevStatus) => ({ ...prevStatus, [id]: "Done" }));
        
        // Pre-fill remark with the latest from history
        if (delegation_done && Array.isArray(delegation_done)) {
          const latestTask = delegation_done.find(d => d.task_id === id);
          if (latestTask && latestTask.reason) {
            setRemarksData(prevRemarks => ({
              ...prevRemarks,
              [id]: latestTask.reason
            }));
          }
        }
      } else {
        newSelected.delete(id);
        setStatusData((prevStatus) => {
          const newStatusData = { ...prevStatus };
          delete newStatusData[id];
          return newStatusData;
        });
        setNextTargetDate((prevDate) => {
          const newDateData = { ...prevDate };
          delete newDateData[id];
          return newDateData;
        });
      }

      return newSelected;
    });
  }, [delegation_done]);



  const handleImageUpload = useCallback((id, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedImages((prev) => ({
      ...prev,
      [id]: file,
    }));
  }, []);

  const handleStatusChange = useCallback((id, value) => {
    setStatusData((prev) => ({ ...prev, [id]: value }));
    if (value === "Done") {
      setNextTargetDate((prev) => {
        const newDates = { ...prev };
        delete newDates[id];
        return newDates;
      });
    }
  }, []);

  const handleNextTargetDateChange = useCallback((id, value) => {
    setNextTargetDate((prev) => ({ ...prev, [id]: value }));
  }, []);

  const fileToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }, []);

  // Helper to get latest remark for display
  const getLatestRemark = useCallback((taskId) => {
    if (!delegation_done || !Array.isArray(delegation_done)) return "";
    const latestTask = delegation_done.find(d => d.task_id === taskId);
    return latestTask ? (latestTask.reason || "") : "";
  }, [delegation_done]);

//   const handleSubmit = async () => {
//     const selectedItemsArray = Array.from(selectedItems);

//     if (selectedItemsArray.length === 0) {
//       alert("Please select at least one item to submit");
//       return;
//     }

//     const missingStatus = selectedItemsArray.filter((id) => !statusData[id]);
//     if (missingStatus.length > 0) {
//       alert(
//         `Please select a status for all selected items. ${missingStatus.length} item(s) are missing status.`
//       );
//       return;
//     }

//     const missingNextDate = selectedItemsArray.filter(
//       (id) => statusData[id] === "Extend date" && !nextTargetDate[id]
//     );
//     if (missingNextDate.length > 0) {
//       alert(
//         `Please select a next target date for all items with "Extend date" status. ${missingNextDate.length} item(s) are missing target date.`
//       );
//       return;
//     }

//     const missingRequiredImages = selectedItemsArray.filter((id) => {
//       const item = delegation.find((account) => account.task_id === id);
//       const requiresAttachment =
//         item.require_attachment &&
//         item.require_attachment.toUpperCase() === "YES";
//       return requiresAttachment && !uploadedImages[id] && !item.image;
//     });

//     if (missingRequiredImages.length > 0) {
//       alert(
//         `Please upload images for all required attachments. ${missingRequiredImages.length} item(s) are missing required images.`
//       );
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       const selectedData = selectedItemsArray.map((id) => {
//         const item = delegation.find((account) => account.task_id === id);

//         const dbStatus = statusData[id] === "Done" ? "done" :
//           statusData[id] === "Extend date" ? "extend" :
//             statusData[id];

//         return {
//   task_id: item.task_id,
//   given_by: item.given_by,
//   name: item.name,
//   task_description: item.task_description,
//   task_start_date: item.task_start_date,
//   planned_date: item.planned_date,
//   status: dbStatus,
//   next_extend_date: statusData[id] === "Extend date" ? nextTargetDate[id] : null,
//   reason: remarksData[id] || "",
//   image_url: uploadedImages[id] ? null : item.image,
//   require_attachment: item.require_attachment
// };

//       });

//       console.log("Selected Data for submission:", selectedData);

//       const submissionPromises = selectedData.map(async (taskData) => {
//         const taskImage = uploadedImages[taskData.task_id];

//         return dispatch(
//           insertDelegationDoneAndUpdate({
//             selectedDataArray: [taskData],
//             uploadedImages: taskImage ? { [taskData.task_id]: taskImage } : {},
//           })
//         );
//       });

//       const results = await Promise.allSettled(submissionPromises);

//       const failedSubmissions = results.filter(result => result.status === 'rejected');

//       if (failedSubmissions.length > 0) {
//         console.error('Some submissions failed:', failedSubmissions);
//         alert(`${failedSubmissions.length} out of ${selectedItemsArray.length} submissions failed. Please check the console for details.`);
//       } else {
//         setSuccessMessage(
//           `Successfully submitted ${selectedItemsArray.length} task records!`
//         );
//       }

//       setSelectedItems(new Set());
//       setAdditionalData({});
//       setRemarksData({});
//       setStatusData({});
//       setNextTargetDate({});

//       setTimeout(() => {
//         dispatch(delegationData());
//         // dispatch(delegation_DoneData());
//         dispatch(delegationDoneData());
//       }, 1000);

//     } catch (error) {
//       console.error('Submission error:', error);
//       alert('An error occurred during submission. Please try again.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };


// const handleSubmit = async () => {
//   if (selectedItems.size === 0) {
//     alert("Please select at least one task");
//     return;
//   }

//   const selectedData = Array.from(selectedItems).map((id) => {
//     const item = delegation.find((x) => x.task_id === id);

//     return {
//       task_id: item.task_id,
//       given_by: item.given_by,
//       name: item.name,
//       task_description: item.task_description,
//       task_start_date: item.task_start_date,
//       planned_date: item.planned_date,
//       status:
//         statusData[id] === "Done"
//           ? "done"
//           : statusData[id] === "Extend date"
//           ? "extend"
//           : null,
//       next_extend_date:
//         statusData[id] === "Extend date" ? nextTargetDate[id] : null,
//       reason: remarksData[id] || "",
//       image_url: null,
//       require_attachment: item.require_attachment,
//     };
//   });

//   const result = await dispatch(
//     insertDelegationDoneAndUpdate({
//       selectedDataArray: selectedData,
//     })
//   );

//   if (result.meta.requestStatus === "fulfilled") {
//     alert("Successfully submitted!");
//   } else {
//     alert("Submission failed!");
//     console.error(result.payload);
//   }

//   setSelectedItems(new Set());
//   setRemarksData({});
//   setNextTargetDate({});
//   setStatusData({});
// };


const handleSubmit = async () => {
  const selectedItemsArray = Array.from(selectedItems);

  if (selectedItemsArray.length === 0) {
    alert("Please select at least one task");
    return;
  }

  // Validation checks
  const missingStatus = selectedItemsArray.filter((id) => !statusData[id]);
  if (missingStatus.length > 0) {
    alert(`Please select status for all selected items. ${missingStatus.length} item(s) are missing status.`);
    return;
  }

  const missingNextDate = selectedItemsArray.filter(
    (id) => statusData[id] === "Extend date" && !nextTargetDate[id]
  );
  if (missingNextDate.length > 0) {
    alert(`Please select next target date for "Extend date" items. ${missingNextDate.length} item(s) are missing date.`);
    return;
  }

  const missingRequiredImages = selectedItemsArray.filter((id) => {
    const item = delegation.find((account) => account.task_id === id);
    const requiresAttachment = item.require_attachment?.toUpperCase() === "YES";
    return requiresAttachment && !uploadedImages[id] && !item.image;
  });

  if (missingRequiredImages.length > 0) {
    alert(`Please upload images for required attachments. ${missingRequiredImages.length} item(s) missing images.`);
    return;
  }

  setIsSubmitting(true);
  setError(null);

  try {
    console.log('🔄 Starting submission process...');

    // Convert to base64 - but check file sizes first
    const selectedData = await Promise.all(
      selectedItemsArray.map(async (id) => {
        const item = delegation.find((x) => x.task_id === id);
        const file = uploadedImages[id];

        let base64Image = null;
       if (file) {
  base64Image = await fileToBase64(file);   // Always correct base64
} else if (item.image) {
  base64Image = null;   // Prevent backend confusion
}


        return {
          task_id: item.task_id,
          department: item.department,
          given_by: item.given_by,
          name: item.name,
          task_description: item.task_description,
          task_start_date: item.task_start_date,
          planned_date: item.planned_date,
          status: statusData[id] === "Done" ? "done" : 
                 statusData[id] === "Partial Done" ? "partial_done" : 
                 statusData[id] === "Extend date" ? "extend" : null,
          next_extend_date: statusData[id] === "Extend date" ? nextTargetDate[id] : null,
          reason: remarksData[id] || "",
          image_base64: base64Image,
        };
      })
    );

    console.log('📦 Data prepared for submission:', {
      itemCount: selectedData.length,
      hasImages: selectedData.some(item => item.image_base64)
    });

    const result = await dispatch(
      insertDelegationDoneAndUpdate({ selectedDataArray: selectedData })
    );

    console.log('📨 Dispatch result:', result);

    if (result.meta.requestStatus === "fulfilled") {
      setSuccessMessage(`✅ Successfully submitted ${selectedItemsArray.length} tasks!`);
      
      // Reset form
      setSelectedItems(new Set());
      setRemarksData({});
      setNextTargetDate({});
      setStatusData({});
      setUploadedImages({});

      // Refresh data after a short delay
      setTimeout(() => {
        dispatch(delegationData());
        dispatch(delegationDoneData());
      }, 2000);

    } else {
      throw new Error(result.payload || "Submission failed on server");
    }

  } catch (error) {
    console.error('❌ Submission error:', error);
    
    let errorMessage = "Submission failed. ";
    
    if (error.message.includes('Network error') || error.message.includes('network')) {
      errorMessage += "Please check your internet connection and try again.";
    } else if (error.message.includes('timeout')) {
      errorMessage += "The request timed out. Please try again.";
    } else if (error.message.includes('large')) {
      errorMessage = error.message;
    } else {
      errorMessage += error.message;
    }
    
    setError(errorMessage);
    setSuccessMessage(`❌ ${errorMessage}`);
  } finally {
    setIsSubmitting(false);
  }
};


  // Handler for sending WhatsApp to selected items (Admin only)
  const handleSendWhatsApp = useCallback(async () => {
    if (selectedItems.size === 0) {
      alert("Please select at least one task");
      return;
    }

    setSendingWhatsApp(true);
    setSuccessMessage("");

    try {
      // Get selected task details from delegation array
      const selectedTasksData = delegation.filter(item => 
        selectedItems.has(item.task_id)
      );

      const result = await sendDelegationWhatsAppAPI(selectedTasksData);

      if (result.error) {
        setSuccessMessage(`❌ Error sending WhatsApp: ${result.error.message || 'Unknown error'}`);
      } else {
        setSuccessMessage(`✅ ${result.message}`);
      }
    } catch (error) {
      console.error("WhatsApp send error:", error);
      setSuccessMessage(`❌ Error: ${error.message}`);
    } finally {
      setSendingWhatsApp(false);
    }
  }, [selectedItems, delegation]);

  // Handle checkbox selection for delegation admin approval
  const handleDelegationItemSelect = useCallback((id, isChecked) => {
    if (isChecked) {
      setSelectedDelegationItems(prev => [...prev, { id: id }]);
    } else {
      setSelectedDelegationItems(prev => prev.filter(item => item.id !== id));
    }
  }, []);

  // Handle select all for delegation items without admin_done = 'Done' and status = 'completed'
  const handleUnifiedSelectAll = useCallback((isChecked) => {
    if (isChecked) {
      if (unifiedTypeFilter === 'all' || unifiedTypeFilter === 'pending') {
        const allPendingIds = filteredDelegationTasks.map(t => t.task_id);
        setSelectedItems(new Set(allPendingIds));
      }
      if (unifiedTypeFilter === 'all' || unifiedTypeFilter === 'approval') {
        const allApprovalItems = filteredApprovalData
          .filter(item => item.admin_done !== 'Done' && item.status === 'completed')
          .map(item => ({ id: item.id }));
        setSelectedDelegationItems(allApprovalItems);
      }
    } else {
      setSelectedItems(new Set());
      setSelectedDelegationItems([]);
    }
  }, [filteredDelegationTasks, filteredApprovalData, unifiedTypeFilter]);


  const isRowSelected = useCallback((item) => {
    if (item.unifiedType === 'pending') {
      return selectedItems.has(item.task_id);
    } else {
      return selectedDelegationItems.some(sel => sel.id === item.id);
    }
  }, [selectedItems, selectedDelegationItems]);

  const toggleRowSelection = useCallback((item, isChecked) => {
    if (item.unifiedType === 'pending') {
      handleSelectItem(item.task_id, isChecked);
    } else {
      handleDelegationItemSelect(item.id, isChecked);
    }
  }, [handleSelectItem, handleDelegationItemSelect]);

  // Mark selected items as approved
  const handleMarkDone = async () => {
    if (selectedDelegationItems.length === 0) return;
    setConfirmationModal({
      isOpen: true,
      itemCount: selectedDelegationItems.length,
      type: "delegation"
    });
  };

  const confirmMarkDone = async () => {
    setConfirmationModal({ isOpen: false, itemCount: 0, type: "delegation" });
    setMarkingAsDone(true);
    try {
      const payload = selectedDelegationItems.map(item => ({
        id: item.id,
        remarks: adminRemarks[item.id] || ""
      }));
      const result = await postDelegationAdminDoneAPI(payload);

      if (result.error) {
        throw new Error(result.error.message || "Failed to mark items as approved");
      }

      setSelectedDelegationItems([]);
      dispatch(delegationDoneData());
      
      setSuccessMessage(`✅ Successfully marked ${selectedDelegationItems.length} items as approved!`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error marking tasks as approved:", error);
      setSuccessMessage(`❌ Failed to approve tasks: ${error.message}`);
    } finally {
      setMarkingAsDone(false);
    }
  };
  // Confirmation Modal Component
  const ConfirmationModal = ({ isOpen, itemCount, onConfirm, onCancel }) => {
    if (!isOpen) return null;

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
    );
  };



  return (
    <AdminLayout>
      <div className="space-y-6 p-2 sm:p-4 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-purple-700">
              {CONFIG.PAGE_CONFIG.title}
            </h1>
            <p className="text-gray-500 text-sm italic">Unified view for tasks and approvals</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search everything..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-md focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
            
            <select
              value={unifiedTypeFilter}
              onChange={(e) => setUnifiedTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white"
            >
              <option value="all">All Items</option>
              <option value="pending">My Tasks</option>
              {(userRole === 'admin' || userRole === 'super_admin') && (
                <option value="approval">Approvals Queue</option>
              )}
            </select>

            {unifiedTypeFilter === 'pending' ? (
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={mainStatusFilter}
                  onChange={(e) => setMainStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="pending">Pending Approval</option>
                  <option value="completed">Approved</option>
                  <option value="all">All Status</option>
                </select>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            )}

            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={handleSubmit}
                disabled={selectedItems.size === 0 || isSubmitting}
                className="flex-1 rounded-md bg-purple-600 py-2 px-3 text-white hover:bg-purple-700 disabled:opacity-50 text-xs font-medium whitespace-nowrap"
              >
                {isSubmitting ? "..." : `Submit Tasks (${selectedItems.size})`}
              </button>
              {(userRole === 'admin' || userRole === 'super_admin') && (
                <>
                  <button
                    onClick={handleMarkDone}
                    disabled={selectedDelegationItems.length === 0 || markingAsDone}
                    className="flex-1 rounded-md bg-green-600 py-2 px-3 text-white hover:bg-green-700 disabled:opacity-50 text-xs font-medium whitespace-nowrap"
                  >
                    {markingAsDone ? "..." : `Approve (${selectedDelegationItems.length})`}
                  </button>
                  <button
                    onClick={handleSendWhatsApp}
                    disabled={selectedItems.size === 0 || sendingWhatsApp}
                    className="flex-1 rounded-md bg-emerald-500 py-2 px-3 text-white hover:bg-emerald-600 disabled:opacity-50 text-xs font-medium"
                  >
                    WhatsApp
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-3 rounded-md flex items-center justify-between text-sm sm:text-base">
            <div className="flex items-center">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-500 flex-shrink-0" />
              <span className="break-words">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-green-500 hover:text-green-700 ml-2 flex-shrink-0"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        )}

        <div className="rounded-lg border border-purple-200 shadow-md bg-white overflow-hidden">
          <div className="bg-linear-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-3 sm:p-4">
            <div className="flex justify-between items-center">
              {(userRole === 'admin' || userRole === 'super_admin' || (username || "").toLowerCase().includes("gyan ranjan das")) && (
                <div className="flex space-x-1 p-0.5 bg-purple-100 rounded-lg">
                  <button
                    onClick={() => setActiveNameTab("EA")}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                      activeNameTab === "EA"
                        ? "bg-white text-purple-700 shadow-sm"
                        : "text-purple-400 hover:text-purple-600"
                    }`}
                  >
                    EA
                  </button>
                  <button
                    onClick={() => setActiveNameTab("Gyan Ranjan Das")}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                      activeNameTab === "Gyan Ranjan Das"
                        ? "bg-white text-purple-700 shadow-sm"
                        : "text-purple-400 hover:text-purple-600"
                    }`}
                  >
                    Gyan Ranjan Das
                  </button>
                </div>
              )}
              {pendingApprovalCount > 0 && unifiedTypeFilter !== 'pending' && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse font-bold ml-auto">
                  {pendingApprovalCount} Awaiting Approval
                </span>
              )}
            </div>
            <div className="mt-4 flex justify-between items-center">
              <h2 className="text-purple-700 font-bold text-sm sm:text-lg flex items-center gap-2">
                <LayoutDashboard size={18} className="text-purple-500" />
                {unifiedTypeFilter === 'pending' ? 'My Tasks' : unifiedTypeFilter === 'approval' ? 'Approvals Queue' : 'Unified Task List'}
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-purple-600 text-sm sm:text-base">Loading...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
              {error} <button className="underline ml-2" onClick={() => window.location.reload()}>Try again</button>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {/* Desktop Unified Table */}
              <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Seq No.</th>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        onChange={(e) => handleUnifiedSelectAll(e.target.checked)}
                        checked={
                          unifiedData.length > 0 && 
                          unifiedData.every(item => 
                            (item.unifiedType === 'approval' && item.admin_done === 'Done') || isRowSelected(item)
                          )
                        }
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Submit Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Task ID</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Proof</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unifiedData.length > 0 ? (
                    unifiedData.map((item, index) => {
                      const isSelected = isRowSelected(item);
                      const isApproval = item.unifiedType === 'approval';
                      const isAlreadyApproved = isApproval && item.admin_done === "Done";
                      
                      const rowColorClass = !isApproval ? getRowColor(item.color_code_for) : "";
                      
                      return (
                        <tr key={item.unifiedId} className={`${isSelected ? (isApproval ? "bg-green-50" : "bg-purple-50") : isAlreadyApproved ? "bg-gray-50 opacity-60" : "hover:bg-gray-50"} ${rowColorClass} transition-colors`}>
                          <td className="px-6 py-4 text-xs text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4">
                            {!isAlreadyApproved && (
                              <input
                                type="checkbox"
                                disabled={isApproval && userRole !== 'admin' && userRole !== 'super_admin'}
                                className={`h-4 w-4 rounded border-gray-300 ${isApproval ? "text-green-600 focus:ring-green-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30" : "text-purple-600 focus:ring-purple-500 cursor-pointer"}`}
                                checked={isSelected}
                                onChange={(e) => toggleRowSelection(item, e.target.checked)}
                              />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={isApproval ? item.status : 'pending'} adminDone={isApproval ? item.admin_done : null} type={item.unifiedType} />
                          </td>
                          <td className="px-6 py-4 min-w-[200px]">
                            {isSelected ? (
                              <div className="space-y-2">
                                {item.unifiedType === 'pending' && (
                                  <select
                                    value={statusData[item.task_id] || ""}
                                    onChange={(e) => handleStatusChange(item.task_id, e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 w-full text-xs"
                                  >
                                    <option value="Done">Done</option>
                                    <option value="Partial Done">Partial Done</option>
                                    <option value="Extend date">Extend</option>
                                  </select>
                                )}
                                {item.unifiedType === 'pending' && statusData[item.task_id] === 'Extend date' && (
                                  <input
                                    type="date"
                                    value={nextTargetDate[item.task_id] || ""}
                                    onChange={(e) => handleNextTargetDateChange(item.task_id, e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 w-full text-xs"
                                  />
                                )}
                                <textarea
                                  placeholder={isApproval ? "Admin Remarks" : "Remarks"}
                                  value={isApproval ? (adminRemarks[item.id] || "") : (remarksData[item.task_id] || "")}
                                  onChange={(e) => isApproval 
                                    ? setAdminRemarks(prev => ({ ...prev, [item.id]: e.target.value }))
                                    : setRemarksData(prev => ({ ...prev, [item.task_id]: e.target.value }))
                                  }
                                  className="w-full border rounded p-1 text-xs h-16 focus:ring-1 focus:ring-purple-500 outline-none"
                                />
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 italic max-h-20 overflow-y-auto w-full wrap-break-word min-w-[150px]">
                                {isApproval ? (
                                  <>
                                    {item.reason && <div className="mb-1"><span className="font-semibold text-gray-400 not-italic">Doer:</span> {item.reason}</div>}
                                    {item.admin_done_remarks && <div><span className="font-semibold text-gray-400 not-italic">Admin:</span> {item.admin_done_remarks}</div>}
                                    {!item.reason && !item.admin_done_remarks && "—"}
                                  </>
                                ) : (
                                  getLatestRemark(item.task_id) || "—"
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-700">
                            <div>{item.name}</div>
                            <div className="text-[10px] text-gray-400 capitalize">{item.department || item.given_by}</div>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-800 min-w-[200px] max-w-[300px] wrap-break-word">
                            {item.task_description}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600 whitespace-nowrap">
                            {formatDateTimeForDisplay(isApproval ? item.next_extend_date || item.planned_date : item.planned_date)}
                          </td>
                          <td className="px-6 py-4 text-xs text-blue-600 font-medium whitespace-nowrap">
                            {item.submission_date ? formatDateTimeForDisplay(item.submission_date) : "—"}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-gray-700">{item.task_id}</td>
                          <td className="px-6 py-4 text-center">
                            {isSelected && item.unifiedType === 'pending' ? (
                              <label className="cursor-pointer text-purple-600 hover:text-purple-800 flex items-center justify-center gap-1">
                                <Upload size={14} />
                                <span className="text-[10px] font-bold uppercase">{uploadedImages[item.task_id] ? "Done" : "Upload"}</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(item.task_id, e)}
                                />
                              </label>
                            ) : (
                              (item.image || item.image_url) && (
                                <button
                                  onClick={() => window.open(item.image || item.image_url, "_blank")}
                                  className="text-purple-500 hover:text-purple-700"
                                  title="View Proof"
                                >
                                  <Upload size={16} />
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-6 py-10 text-center text-gray-400 italic">No items found matching your filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Mobile Card View (Simplified) */}
              <div className="sm:hidden space-y-3 p-3">
                {unifiedData.map((item, index) => {
                  const isSelected = isRowSelected(item);
                  const isApproval = item.unifiedType === 'approval';
                  return (
                    <div key={item.unifiedId} className={`p-3 border rounded-lg shadow-sm ${isSelected ? "bg-purple-50 border-purple-200" : "bg-white border-gray-200"}`}>
                      <div className="flex justify-between items-center mb-2">
                         <div className="flex items-center gap-2">
                           <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => toggleRowSelection(item, e.target.checked)}
                               disabled={isApproval && userRole !== 'admin' && userRole !== 'super_admin'}
                               className={`h-4 w-4 rounded ${isApproval && userRole !== 'admin' && userRole !== 'super_admin' ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                           />
                           <span className="text-xs font-bold text-gray-400">#{index+1}</span>
                         </div>
                         <StatusBadge status={isApproval ? item.status : 'pending'} adminDone={isApproval ? item.admin_done : null} type={item.unifiedType} />
                      </div>
                      <div className="text-sm font-medium mb-1">{item.task_description}</div>
                       <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                         <span>ID: {item.task_id}</span>
                         <span> {isApproval ? "ADMIN APPROVAL" : "MY TASK"}</span>
                       </div>
                       <div className="flex justify-between text-[10px] mb-2">
                         <span className="text-gray-600">Target: {formatDateTimeForDisplay(isApproval ? item.next_extend_date || item.planned_date : item.planned_date)}</span>
                         <span className="text-blue-600 font-medium">{item.submission_date ? `Submitted: ${formatDateTimeForDisplay(item.submission_date)}` : ""}</span>
                       </div>
                      {isSelected && (
                        <div className="pt-2 border-t space-y-2">
                           {/* Simplified mobile controls similar to desktop logic */}
                            {item.unifiedType === 'pending' && (
                              <>
                                <select 
                                  value={statusData[item.task_id] || "Done"} 
                                  className="w-full border rounded text-xs p-1" 
                                  onChange={(e) => handleStatusChange(item.task_id, e.target.value)}
                                >
                                  <option value="Done">Done</option>
                                  <option value="Partial Done">Partial Done</option>
                                  <option value="Extend date">Extend</option>
                                </select>
                                {statusData[item.task_id] === 'Extend date' && (
                                  <input
                                    type="date"
                                    value={nextTargetDate[item.task_id] || ""}
                                    onChange={(e) => handleNextTargetDateChange(item.task_id, e.target.value)}
                                    className="w-full border rounded text-xs p-1"
                                  />
                                )}
                              </>
                            )}
                           <textarea 
                            className="w-full border rounded text-xs p-1" 
                            rows="2" 
                            placeholder="Remarks..."
                            value={isApproval ? (adminRemarks[item.id] || "") : (remarksData[item.task_id] || "")}
                            onChange={(e) => isApproval 
                              ? setAdminRemarks(prev => ({ ...prev, [item.id]: e.target.value }))
                              : setRemarksData(prev => ({ ...prev, [item.task_id]: e.target.value }))
                            }
                           />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        itemCount={confirmationModal.itemCount}
        onConfirm={confirmMarkDone}
        onCancel={() => setConfirmationModal({ isOpen: false, itemCount: 0, type: "delegation" })}
      />
    </AdminLayout>
  );
}

export default DelegationDataPage;
