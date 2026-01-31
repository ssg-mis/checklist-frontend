"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CheckCircle2,
  Upload,
  X,
  Search,
  Filter,
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
  const [activeTab, setActiveTab] = useState("pending"); // 'pending' or 'approval'
  const [selectedDelegationItems, setSelectedDelegationItems] = useState([]);
  const [adminRemarks, setAdminRemarks] = useState({});
  const [markingAsDone, setMarkingAsDone] = useState(false);
  const [approvalStatusFilter, setApprovalStatusFilter] = useState("pending"); // 'all', 'pending', 'completed'
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
        if (approvalStatusFilter === "pending") {
          return item.admin_done !== 'Done' && item.status === 'completed';
        } else if (approvalStatusFilter === "completed") {
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
  }, [delegation_done, debouncedSearchTerm, startDate, endDate, userRole, username, approvalStatusFilter]);

  const pendingApprovalCount = filteredApprovalData.filter(item => item.admin_done !== 'Done' && item.status === 'completed').length;

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

  const handleCheckboxClick = useCallback(
    (e, id) => {
      e.stopPropagation();
      const isChecked = e.target.checked;
      handleSelectItem(id, isChecked);
    },
    [handleSelectItem]
  );

  const handleSelectAllItems = useCallback(
    (e) => {
      e.stopPropagation();
      const checked = e.target.checked;

      if (checked) {
        const allIds = delegation.map((item) => item.task_id);
        setSelectedItems(new Set(allIds));

        const newStatusData = {};
        const newRemarksData = {};
        
        allIds.forEach((id) => {
          newStatusData[id] = "Done";
          
          // Pre-fill remarks
          if (delegation_done && Array.isArray(delegation_done)) {
            const latestTask = delegation_done.find(d => d.task_id === id);
            if (latestTask && latestTask.reason) {
              newRemarksData[id] = latestTask.reason;
            }
          }
        });
        
        setStatusData((prev) => ({ ...prev, ...newStatusData }));
        setRemarksData((prev) => ({ ...prev, ...newRemarksData }));
      } else {
        setSelectedItems(new Set());
        setRemarksData({});
        setStatusData({});
        setNextTargetDate({});
      }
    },
    [delegation, delegation_done]
  );

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
  const handleSelectAllDelegation = useCallback((isChecked) => {
    if (isChecked) {
      const pendingItems = filteredApprovalData
        .filter(item => item.admin_done !== 'Done' && item.status === 'completed')
        .map(item => ({ id: item.id }));
      setSelectedDelegationItems(pendingItems);
    } else {
      setSelectedDelegationItems([]);
    }
  }, [filteredApprovalData]);

  const isDelegationItemSelected = useCallback((id) => {
    return selectedDelegationItems.some(item => item.id === id);
  }, [selectedDelegationItems]);

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


  const selectedItemsCount = selectedItems.size;

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
        <div className="flex flex-col gap-3 sm:gap-4">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-purple-700">
            {CONFIG.PAGE_CONFIG.title}
          </h1>

          {/* Tab Switcher */}
          {(userRole === 'admin' || userRole === 'super_admin') && (
            <div className="flex bg-white rounded-lg p-1 shadow-sm border border-purple-100 w-full sm:w-fit">
              <button
                onClick={() => {
                  setActiveTab("pending");
                  setSearchTerm("");
                }}
                className={`flex-1 sm:flex-none py-1.5 px-4 text-sm font-medium rounded-md transition-all ${
                  activeTab === "pending"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-purple-50"
                }`}
              >
                Pending Tasks
              </button>
              <button
                onClick={() => {
                  setActiveTab("approval");
                  setSearchTerm("");
                }}
                className={`flex-1 sm:flex-none py-1.5 px-4 text-sm font-medium rounded-md transition-all relative ${
                  activeTab === "approval"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-purple-50"
                }`}
              >
                Admin Approval
                {pendingApprovalCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                    {pendingApprovalCount}
                  </span>
                )}
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              />
            </div>

            <div className="flex items-center gap-2">
              {activeTab === "pending" ? (
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="flex-1 sm:flex-none border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm"
                >
                  {filterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={approvalStatusFilter}
                  onChange={(e) => setApprovalStatusFilter(e.target.value)}
                  className="flex-1 sm:flex-none border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm bg-white"
                >
                  <option value="pending">Pending Approval</option>
                  <option value="completed">Approved</option>
                  <option value="all">All Status</option>
                </select>
              )}
              {activeTab === "approval" && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm bg-white"
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm bg-white"
                    placeholder="End Date"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {activeTab === "pending" ? (
                <>
                  <button
                    onClick={handleSubmit}
                    disabled={selectedItemsCount === 0 || isSubmitting}
                    className="flex-1 sm:flex-none rounded-md gradient-bg py-2 px-3 sm:px-4 text-white hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {isSubmitting
                      ? "Processing..."
                      : (
                        <>
                          <span className="hidden sm:inline">Submit Selected ({selectedItemsCount})</span>
                          <span className="sm:hidden">Submit ({selectedItemsCount})</span>
                        </>
                      )}
                  </button>

                  {(userRole === 'admin' || userRole === 'super_admin') && (
                    <button
                      onClick={handleSendWhatsApp}
                      disabled={selectedItemsCount === 0 || sendingWhatsApp}
                      className="flex-1 sm:flex-none rounded-md bg-green-600 py-2 px-3 sm:px-4 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center gap-2"
                      title="Send WhatsApp to selected"
                    >
                      {sendingWhatsApp ? (
                        <span>Sending...</span>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          <span className="hidden sm:inline">WhatsApp ({selectedItemsCount})</span>
                          <span className="sm:hidden">WA</span>
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={handleMarkDone}
                    disabled={selectedDelegationItems.length === 0 || markingAsDone}
                    className="flex-1 sm:flex-none rounded-md bg-green-600 py-2 px-3 sm:px-4 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center gap-2 shadow-md"
                  >
                    <CheckCircle2 size={18} />
                    {markingAsDone ? "Approving..." : `Approve Selected (${selectedDelegationItems.length})`}
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
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-3 sm:p-4">
            <h2 className="text-purple-700 font-medium text-sm sm:text-base">
              {activeTab === "pending" 
                ? `Pending ${CONFIG.SOURCE_SHEET_NAME} Tasks` 
                : `${CONFIG.SOURCE_SHEET_NAME} Tasks for Approval`}
            </h2>
            <p className="text-purple-600 text-xs sm:text-sm mt-1">
              {activeTab === "pending" 
                ? CONFIG.PAGE_CONFIG.description 
                : "Approve tasks that have been submitted by doers"}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-purple-600 text-sm sm:text-base">Loading task data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-800 text-center text-sm sm:text-base">
              {error}{" "}
              <button
                className="underline ml-2"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              {activeTab === "pending" ? (
                <>
                  {/* Mobile Card View for Pending */}
                  <div className="sm:hidden space-y-3 p-3">
                    {filteredDelegationTasks.length > 0 ? (
                      filteredDelegationTasks.map((account, index) => {
                        const isSelected = selectedItems.has(account.task_id);
                        const rowColorClass = getRowColor(account.color_code_for);
                        const sequenceNumber = index + 1;
                        return (
                          <div key={index} className={`bg-white border rounded-lg p-3 shadow-sm ${rowColorClass}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-purple-600"
                                  checked={isSelected}
                                  onChange={(e) => handleCheckboxClick(e, account.task_id)}
                                />
                                <span className="text-xs font-semibold text-gray-700">#{sequenceNumber}</span>
                              </div>
                              <span className="text-xs text-gray-500">ID: {account.task_id}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-2">{account.task_description || "—"}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              <div><span className="text-gray-500">Name:</span> <span className="font-medium">{account.name || "—"}</span></div>
                              <div><span className="text-gray-500">Dept:</span> <span className="font-medium">{account.department || "—"}</span></div>
                              <div><span className="text-gray-500">Given By:</span> <span className="font-medium">{account.given_by || "—"}</span></div>
                              <div><span className="text-gray-500">End Date:</span> <span className="font-medium">{formatDateTimeForDisplay(account.task_start_date)}</span></div>
                              <div className="col-span-2"><span className="text-gray-500">Planned:</span> <span className="font-medium">{formatDateTimeForDisplay(account.planned_date)}</span></div>
                            </div>
                            {isSelected && (
                              <div className="border-t pt-2 mt-2 space-y-2">
                                <select
                                  value={statusData[account.task_id] || ""}
                                  onChange={(e) => handleStatusChange(account.task_id, e.target.value)}
                                  className="border border-gray-300 rounded-md px-2 py-1 w-full text-xs"
                                >
                                  <option value="">Select Status...</option>
                                  <option value="Done">Done</option>
                                  <option value="Extend date">Extend</option>
                                </select>
                                {statusData[account.task_id] === "Extend date" && (
                                  <input
                                    type="date"
                                    value={nextTargetDate[account.task_id] || ""}
                                    onChange={(e) => handleNextTargetDateChange(account.task_id, e.target.value)}
                                    className="border border-gray-300 rounded-md px-2 py-1 w-full text-xs"
                                  />
                                )}
                                <textarea
                                  placeholder="Remarks"
                                  value={remarksData[account.task_id] || ""}
                                  onChange={(e) => setRemarksData((prev) => ({ ...prev, [account.task_id]: e.target.value }))}
                                  className="border border-gray-300 rounded-md px-2 py-1 w-full text-xs resize-none"
                                  rows="2"
                                />
                                {uploadedImages[account.task_id] || account.image ? (
                                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                                    <img
                                      src={uploadedImages[account.task_id] ? URL.createObjectURL(uploadedImages[account.task_id]) : account.image}
                                      alt="Receipt"
                                      className="h-10 w-10 object-cover rounded-md flex-shrink-0"
                                    />
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <span className="text-xs text-gray-600 truncate">
                                        {uploadedImages[account.task_id]?.name || "Uploaded"}
                                      </span>
                                      {uploadedImages[account.task_id] ? (
                                        <span className="text-xs text-green-600">Ready to upload</span>
                                      ) : (
                                        <button
                                          className="text-xs text-purple-600 hover:text-purple-800 text-left"
                                          onClick={() => window.open(account.image, "_blank")}
                                        >
                                          View Image
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <label
                                    className={`flex items-center justify-center gap-2 cursor-pointer ${account.require_attachment?.toUpperCase() === "YES"
                                        ? "text-red-600 font-medium bg-red-50"
                                        : "text-purple-600 bg-purple-50"
                                      } hover:bg-opacity-80 px-3 py-2 rounded-md border ${account.require_attachment?.toUpperCase() === "YES"
                                        ? "border-red-300"
                                        : "border-purple-300"
                                      }`}
                                  >
                                    <Upload className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-xs">
                                      {account.require_attachment?.toUpperCase() === "YES"
                                        ? "Upload Image (Required)"
                                        : "Upload Image"}
                                    </span>
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept="image/*"
                                      onChange={(e) => handleImageUpload(account.task_id, e)}
                                    />
                                  </label>
                                )}
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

                  {/* Desktop Table View for Pending */}
                  <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Seq No.</th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            checked={filteredDelegationTasks.length > 0 && selectedItems.size === filteredDelegationTasks.length}
                            onChange={handleSelectAllItems}
                          />
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Task ID</th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Department</th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Given By</th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Name</th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Task Description</th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-yellow-50">End Date</th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-green-50">Planned Date</th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-blue-50">Status</th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-indigo-50">Next Target</th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px] bg-purple-50">Remarks</th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-orange-50">Upload</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDelegationTasks.length > 0 ? (
                        filteredDelegationTasks.map((account, index) => {
                          const isSelected = selectedItems.has(account.task_id);
                          const rowColorClass = getRowColor(account.color_code_for);
                          return (
                            <tr key={index} className={`${isSelected ? "bg-purple-50" : ""} hover:bg-gray-50 ${rowColorClass}`}>
                              <td className="px-2 sm:px-6 py-2 sm:py-4"><div className="text-xs sm:text-sm text-gray-900">{index + 1}</div></td>
                              <td className="px-2 sm:px-6 py-2 sm:py-4">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                  checked={isSelected}
                                  onChange={(e) => handleCheckboxClick(e, account.task_id)}
                                />
                              </td>
                              <td className="px-2 sm:px-6 py-2 sm:py-4"><div className="text-xs sm:text-sm text-gray-900">{account.task_id || "—"}</div></td>
                              <td className="px-2 sm:px-6 py-2 sm:py-4"><div className="text-xs sm:text-sm text-gray-900">{account.department || "—"}</div></td>
                              <td className="px-2 sm:px-6 py-2 sm:py-4"><div className="text-xs sm:text-sm text-gray-900">{account.given_by || "—"}</div></td>
                              <td className="px-2 sm:px-6 py-2 sm:py-4"><div className="text-xs sm:text-sm text-gray-900">{account.name || "—"}</div></td>
                              <td className="px-2 sm:px-6 py-2 sm:py-4 min-w-[300px] whitespace-normal"><div className="text-xs sm:text-sm text-gray-900 break-words" title={account.task_description}>{account.task_description || "—"}</div></td>
                              <td className="px-2 sm:px-6 py-2 sm:py-4 bg-yellow-50"><div className="text-xs sm:text-sm text-gray-900">{formatDateTimeForDisplay(account.task_start_date)}</div></td>
                              <td className="px-2 sm:px-6 py-2 sm:py-4 bg-green-50"><div className="text-xs sm:text-sm text-gray-900">{formatDateTimeForDisplay(account.planned_date)}</div></td>
                              <td className="px-2 sm:px-6 py-2 sm:py-4 bg-blue-50">
                                <select
                                  disabled={!isSelected}
                                  value={statusData[account.task_id] || ""}
                                  onChange={(e) => handleStatusChange(account.task_id, e.target.value)}
                                  className="border border-gray-300 rounded-md px-2 py-1 w-full disabled:bg-gray-100 disabled:cursor-not-allowed text-xs sm:text-sm"
                                >
                                  <option value="">Select</option>
                                  <option value="Done">Done</option>
                                  <option value="Extend date">Extend</option>
                                </select>
                              </td>
                              <td className="px-2 sm:px-6 py-2 sm:py-4 bg-indigo-50">
                                <input
                                  type="date"
                                  disabled={!isSelected || statusData[account.task_id] !== "Extend date"}
                                  value={nextTargetDate[account.task_id] || ""}
                                  onChange={(e) => handleNextTargetDateChange(account.task_id, e.target.value)}
                                  className="border border-gray-300 rounded-md px-2 py-1 w-full disabled:bg-gray-100 disabled:cursor-not-allowed text-xs sm:text-sm"
                                />
                              </td>
                              <td className="px-2 sm:px-6 py-2 sm:py-4 min-w-[150px] max-w-[250px] bg-purple-50">
                                {isSelected ? (
                                  <textarea
                                    placeholder="Enter remarks"
                                    value={remarksData[account.task_id] || ""}
                                    onChange={(e) => setRemarksData((prev) => ({ ...prev, [account.task_id]: e.target.value }))}
                                    className="border rounded-md px-2 py-1 w-full border-gray-300 text-xs sm:text-sm resize-none focus:ring-purple-500 focus:border-purple-500"
                                    rows="2"
                                  />
                                ) : (
                                  <div className="text-xs sm:text-sm text-gray-700 break-words p-1">
                                    {getLatestRemark(account.task_id) || <span className="text-gray-400 italic">No remarks</span>}
                                  </div>
                                )}
                              </td>
                              <td className="px-2 sm:px-6 py-2 sm:py-4 bg-orange-50">
                                {uploadedImages[account.task_id] ? (
                                  <div className="flex items-center">
                                    <img src={URL.createObjectURL(uploadedImages[account.task_id])} alt="Receipt" className="h-8 w-8 sm:h-10 sm:w-10 object-cover rounded-md mr-2" />
                                    <div className="flex flex-col min-w-0"><span className="text-xs text-gray-500 truncate">{uploadedImages[account.task_id].name}</span><span className="text-xs text-green-600 font-medium">Ready</span></div>
                                  </div>
                                ) : account.image ? (
                                  <div className="flex items-center">
                                    <img src={account.image} alt="Receipt" className="h-8 w-8 sm:h-10 sm:w-10 object-cover rounded-md mr-2" />
                                    <div className="flex flex-col min-w-0"><span className="text-xs text-gray-500">Uploaded</span><button className="text-xs text-purple-600 hover:text-purple-800 text-left font-medium" onClick={() => window.open(account.image, "_blank")}>View</button></div>
                                  </div>
                                ) : (
                                  <label htmlFor={`file-upload-${account.task_id}`} className={`flex items-center cursor-pointer ${account.require_attachment?.toUpperCase() === "YES" ? "text-red-600 font-semibold" : "text-purple-600 font-medium"} hover:opacity-80`}>
                                    <Upload className="h-4 w-4 mr-1" />
                                    <span className="text-xs">{account.require_attachment?.toUpperCase() === "YES" ? "Required*" : "Upload"}</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(account.task_id, e)} disabled={!isSelected} id={`file-upload-${account.task_id}`} />
                                  </label>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan={13} className="px-4 sm:px-6 py-10 text-center text-gray-500 text-xs sm:text-sm font-medium">No tasks found matching your criteria.</td></tr>
                      )}
                    </tbody>
                  </table>
                </>
              ) : (
                <>
                  {/* Mobile Card View for Approval */}
                  <div className="sm:hidden space-y-3 p-3">
                    {filteredApprovalData.length > 0 ? (
                      filteredApprovalData.map((item, index) => {
                        const isSelected = isDelegationItemSelected(item.id);
                        const isAlreadyApproved = item.admin_done === "Done";
                        return (
                          <div key={index} className={`bg-white border rounded-lg p-3 shadow-sm ${isAlreadyApproved ? "border-green-200 bg-green-50/30" : "border-gray-200"}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                {!isAlreadyApproved && (
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-green-600"
                                    checked={isSelected}
                                    onChange={(e) => handleDelegationItemSelect(item.id, e.target.checked)}
                                  />
                                )}
                                <span className="text-xs font-semibold text-gray-700">#{index + 1}</span>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isAlreadyApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                {isAlreadyApproved ? "Approved" : "Pending Approval"}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-2">{item.task_description || "—"}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              <div><span className="text-gray-500">Name:</span> <span className="font-medium">{item.name || "—"}</span></div>
                              <div><span className="text-gray-500">Task ID:</span> <span className="font-medium">{item.task_id || "—"}</span></div>
                              <div><span className="text-gray-500">Submitted:</span> <span className="font-medium">{formatDateTimeForDisplay(item.created_at)}</span></div>
                            </div>
                            {isSelected && (
                              <div className="border-t pt-2 mt-2 space-y-2">
                                <textarea
                                  placeholder="Admin Remarks"
                                  value={adminRemarks[item.id] || ""}
                                  onChange={(e) => setAdminRemarks(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  className="border border-gray-300 rounded-md px-2 py-1 w-full text-xs resize-none h-16"
                                />
                              </div>
                            )}
                            {item.image_url && (
                              <div className="mt-2">
                                <button className="text-xs text-purple-600 font-medium hover:underline" onClick={() => window.open(item.image_url, "_blank")}>View Proof Image</button>
                              </div>
                            )}
                            {item.reason && (
                              <div className="mt-1 p-2 bg-gray-50 rounded text-[10px] text-gray-600 italic">
                                Doer Remark: {item.reason}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-10 text-gray-500 text-sm italic">No items found for approval.</div>
                    )}
                  </div>

                  {/* Desktop Table View for Approval */}
                  <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Seq No.</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            onChange={(e) => handleSelectAllDelegation(e.target.checked)}
                            checked={filteredApprovalData.length > 0 && selectedDelegationItems.length === filteredApprovalData.filter(i => i.admin_done !== 'Done' && i.status === 'completed').length}
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Admin Remark</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Task ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Given By</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Submitted</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Doer Remark</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Proof</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredApprovalData.length > 0 ? (
                        filteredApprovalData.map((item, index) => {
                          const isSelected = isDelegationItemSelected(item.id);
                          const isAlreadyApproved = item.admin_done === "Done";
                          return (
                            <tr key={index} className={`${isSelected ? "bg-green-50" : isAlreadyApproved ? "bg-gray-50/50 opacity-80" : "hover:bg-gray-50"} transition-colors`}>
                              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">{index + 1}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {!isAlreadyApproved && (
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    checked={isSelected}
                                    onChange={(e) => handleDelegationItemSelect(item.id, e.target.checked)}
                                  />
                                )}
                              </td>
                              <td className="px-6 py-4 min-w-[180px]">
                                {isSelected ? (
                                  <textarea
                                    className="w-full border rounded p-1 text-xs h-16 focus:ring-1 focus:ring-green-500 outline-none shadow-sm"
                                    placeholder="Enter admin remarks..."
                                    value={adminRemarks[item.id] || ""}
                                    onChange={(e) => setAdminRemarks(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  />
                                ) : (
                                  <div className="text-xs text-gray-600 italic truncate max-w-[150px]" title={item.admin_done_remarks}>{item.admin_done_remarks || "—"}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">{item.task_id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">{item.given_by}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 font-medium">{item.name}</td>
                              <td className="px-6 py-4 text-xs text-gray-700 min-w-[200px] max-w-[300px] break-words">{item.task_description}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-[10px] text-purple-700 font-medium">{formatDateTimeForDisplay(item.created_at)}</td>
                              <td className="px-6 py-4 text-xs text-gray-500 italic max-w-[150px] truncate" title={item.reason}>{item.reason || "—"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-xs">
                                {item.image_url && (
                                  <button onClick={() => window.open(item.image_url, "_blank")} className="text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium underline">
                                    View
                                  </button>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm ${isAlreadyApproved ? "bg-green-100 text-green-700 border border-green-200" : "bg-yellow-100 text-yellow-700 border border-yellow-200"}`}>
                                  {isAlreadyApproved ? "Approved" : "Pending"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan={14} className="px-6 py-10 text-center text-gray-500 text-sm font-medium italic">No delegation tasks found for approval.</td></tr>
                      )}
                    </tbody>
                  </table>
                </>
              )}
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
