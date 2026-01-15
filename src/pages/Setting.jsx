import React, { useEffect, useState } from 'react';
// import { Plus, User, Building, X, Save, Edit, Trash2, Settings, Search, ChevronDown, Calendar, RefreshCw } from 'lucide-react';
import { Plus, User, Building, X, Save, Edit, Trash2, Settings, Search, ChevronDown, Calendar, RefreshCw, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { useDispatch, useSelector } from 'react-redux';
import { createDepartment, createUser, deleteUser, departmentOnlyDetails, givenByDetails, departmentDetails, updateDepartment, updateUser, userDetails } from '../redux/slice/settingSlice';
import { uniqueDoerNameData } from '../redux/slice/assignTaskSlice';
// import supabase from '../SupabaseClient';

const Setting = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentDeptId, setCurrentDeptId] = useState(null);
  const [usernameFilter, setUsernameFilter] = useState('');
  const [usernameDropdownOpen, setUsernameDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeDeptSubTab, setActiveDeptSubTab] = useState('departments');
  // Leave Management State
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [remark, setRemark] = useState('');
  const [leaveUsernameFilter, setLeaveUsernameFilter] = useState('');
  const [showPasswords, setShowPasswords] = useState({}); // Track which passwords are visible
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  
  // Task Delegation Modal State
  const [showDelegationModal, setShowDelegationModal] = useState(false);
  const [selectedDoer, setSelectedDoer] = useState('');
  
  // Leave Transfer Popup State
  const [showLeavePopup, setShowLeavePopup] = useState(false);
  const [currentLeaveUser, setCurrentLeaveUser] = useState(null);
  const [popupLeaveStartDate, setPopupLeaveStartDate] = useState('');
  const [popupLeaveEndDate, setPopupLeaveEndDate] = useState('');
  const [popupDoer, setPopupDoer] = useState('');
  const [popupRemarks, setPopupRemarks] = useState('');
  
  // Individual Task Assignment State
  const [userTasks, setUserTasks] = useState([]);
  const [taskAssignments, setTaskAssignments] = useState({});
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [fetchError, setFetchError] = useState('');
  
  
  const { userData, department, departmentsOnly, givenBy, loading, error } = useSelector((state) => state.setting);
  const { doerName } = useSelector((state) => state.assignTask);
  // Get current logged-in user to check for super_admin role
  const { userData: currentUser } = useSelector((state) => state.login);
  const dispatch = useDispatch();

  const togglePasswordVisibility = (userId) => {
  setShowPasswords(prev => ({
    ...prev,
    [userId]: !prev[userId]
  }));
};

const fetchDeviceLogsAndUpdateStatus = async () => {
  return
  try {
    setIsRefreshing(true);
    // const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/logs/device-sync`);
    const data = await response.json();
    console.log(data.message);
    dispatch(userDetails());
  } catch (error) {
    console.error('Error syncing device logs:', error);
  } finally {
    setIsRefreshing(false);
  }
};



useEffect(() => {
  const intervalId = setInterval(fetchDeviceLogsAndUpdateStatus, 10000);

  return () => clearInterval(intervalId);
}, []);

  // Add real-time subscription
  // useEffect(() => {
  //   // Subscribe to users table changes
  //   const subscription = supabase
  //     .channel('users-changes')
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: '*',
  //         schema: 'public',
  //         table: 'users'
  //       },
  //       (payload) => {
  //         // console.log('Real-time update received:', payload);
  //         // Refresh user data when any change occurs
  //         dispatch(userDetails());
  //       }
  //     )
  //     .subscribe();

  //   // Set up interval to check device logs every 30 seconds
  //   const intervalId = setInterval(fetchDeviceLogsAndUpdateStatus, 30000);

  //   // Initial fetch of device logs
  //   fetchDeviceLogsAndUpdateStatus();

  //   return () => {
  //     subscription.unsubscribe();
  //     clearInterval(intervalId);
  //   };
  // }, [dispatch]);

  // Add this function to debug a specific user
const debugUserStatus = async () => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_name', 'Hem Kumar Jagat');
    
    if (error) {
      console.error('Error fetching user:', error);
      return;
    }
    
    if (users && users.length > 0) {
      const user = users[0];
      // console.log('🔍 DEBUG - Hem Kumar Jagat:', {
      //   id: user.id,
      //   username: user.user_name,
      //   employee_id: user.employee_id,
      //   current_status: user.status,
      //   last_punch_time: user.last_punch_time,
      //   last_punch_device: user.last_punch_device
      // });
    } else {
      console.log('User "Hem Kumar Jagat" not found');
    }
  } catch (error) {
    console.error('Error in debug:', error);
  }
};

// Call this to check the current status
// debugUserStatus();

  // Add manual refresh button handler
  // const handleManualRefresh = () => {
  //   fetchDeviceLogsAndUpdateStatus();
  // };

  // Your existing functions remain the same...
  const handleLeaveUsernameFilter = (username) => {
    setLeaveUsernameFilter(username);
  };

  const clearLeaveUsernameFilter = () => {
    setLeaveUsernameFilter('');
  };

  const handleUsernameFilterSelect = (username) => {
    setUsernameFilter(username);
    setUsernameDropdownOpen(false);
  };

  const clearUsernameFilter = () => {
    setUsernameFilter('');
    setUsernameDropdownOpen(false);
  };

  const toggleUsernameDropdown = () => {
    setUsernameDropdownOpen(!usernameDropdownOpen);
  };


  const handleAddButtonClick = () => {
    if (activeTab === 'users') {
      resetUserForm();
      setShowUserModal(true);
    } else if (activeTab === 'departments') {
      resetDeptForm();
      setShowDeptModal(true);
    }
    // No action for leave tab
  };



  const handleUserSelection = (userId, isSelected) => {
    if (isSelected) {
      // Open popup form when checkbox is checked
      const user = userData.find(u => u.id === userId);
      setCurrentLeaveUser(user);
      setShowLeavePopup(true);
      // Set today's date as default
      const today = new Date().toISOString().split('T')[0];
      setPopupLeaveStartDate(today);
      setPopupLeaveEndDate(today);
    } else {
      // Close popup and clear selection when unchecked
      setShowLeavePopup(false);
      setCurrentLeaveUser(null);
      setPopupLeaveStartDate('');
      setPopupLeaveEndDate('');
      setPopupDoer('');
      setPopupRemarks('');
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(userData.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

const handleSubmitLeave = async () => {
  if (selectedUsers.length === 0 || !leaveStartDate || !leaveEndDate) {
    alert('Please select at least one user and provide both start and end dates');
    return;
  }

  // Validate date range
  const startDate = new Date(leaveStartDate);
  const endDate = new Date(leaveEndDate);
  
  if (startDate > endDate) {
    alert('End date cannot be before start date');
    return;
  }

  // Show delegation modal instead of directly submitting
  setShowDelegationModal(true);
};

// New function to handle actual delegation after doer selection
const handleConfirmDelegation = async () => {
  if (!selectedDoer) {
    alert('Please select a doer to delegate tasks to');
    return;
  }

  try {
    // Call API to transfer tasks
    const transferPromises = selectedUsers.map(async (userId) => {
      const user = userData.find(u => u.id === userId);
      if (user && user.user_name) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/leave/transfer-tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: user.user_name,
              delegateTo: selectedDoer,
              startDate: leaveStartDate,
              endDate: leaveEndDate
            })
          });

          const result = await response.json();
          
          if (!response.ok) {
            console.error('Error transferring tasks:', result.message);
          } else {
            console.log(`Transferred ${result.tasksTransferred} tasks from ${user.user_name} to ${selectedDoer}`);
          }
        } catch (error) {
          console.error('Error in task transfer:', error);
        }
      }
    });

    await Promise.all(transferPromises);

    // Close modal and reset form
    setShowDelegationModal(false);
    setSelectedDoer('');
    setSelectedUsers([]);
    setLeaveStartDate('');
    setLeaveEndDate('');
    setRemark('');

    // Refresh data
    setTimeout(() => window.location.reload(), 1000);
    alert('Tasks transferred successfully to delegation');
  } catch (error) {
    console.error('Error submitting delegation:', error);
    alert('Error submitting delegation');
  }
};

  // Fetch user tasks when dates are selected
  useEffect(() => {
    const fetchUserTasks = async () => {
      if (!currentLeaveUser || !popupLeaveStartDate || !popupLeaveEndDate) {
        setUserTasks([]);
        setTaskAssignments({});
        return;
      }

      // Validate date range
      const startDate = new Date(popupLeaveStartDate);
      const endDate = new Date(popupLeaveEndDate);
      
      if (startDate > endDate) {
        setFetchError('End date cannot be before start date');
        setUserTasks([]);
        return;
      }

      setIsLoadingTasks(true);
      setFetchError('');

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/leave/user-tasks?username=${encodeURIComponent(currentLeaveUser.user_name)}&startDate=${popupLeaveStartDate}&endDate=${popupLeaveEndDate}`
        );

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch tasks');
        }

        setUserTasks(result.tasks || []);
        // Initialize task assignments with empty values
        const initialAssignments = {};
        (result.tasks || []).forEach(task => {
          initialAssignments[task.task_id] = '';
        });
        setTaskAssignments(initialAssignments);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setFetchError(error.message);
        setUserTasks([]);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    fetchUserTasks();
  }, [currentLeaveUser, popupLeaveStartDate, popupLeaveEndDate]);

  // Handler for individual task assignment
  const handleTaskAssignment = (taskId, assignedUser) => {
    setTaskAssignments(prev => ({
      ...prev,
      [taskId]: assignedUser
    }));
  };

  // Handler for Leave Transfer Popup submission
  const handleLeaveTransferSubmit = async () => {
    if (!popupLeaveStartDate || !popupLeaveEndDate) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate date range
    const startDate = new Date(popupLeaveStartDate);
    const endDate = new Date(popupLeaveEndDate);
    
    if (startDate > endDate) {
      alert('End date cannot be before start date');
      return;
    }

    // If there are tasks to assign individually
    if (userTasks.length > 0) {
      // Validate all tasks have assigned users
      const unassignedTasks = userTasks.filter(task => !taskAssignments[task.task_id]);
      if (unassignedTasks.length > 0) {
        alert(`Please assign all ${userTasks.length} tasks to users. ${unassignedTasks.length} task(s) still unassigned.`);
        return;
      }

      // Build assignments array
      const assignments = userTasks.map(task => ({
        task_id: task.task_id,
        username: task.name,
        delegateTo: taskAssignments[task.task_id],
        task_description: task.task_description,
        department: task.department,
        given_by: task.given_by,
        frequency: task.frequency,
        task_start_date: task.task_start_date,
        planned_date: task.planned_date
      }));

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/leave/assign-individual-tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignments })
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'Failed to assign tasks');
        }

        // Close popup and reset form
        setShowLeavePopup(false);
        setCurrentLeaveUser(null);
        setPopupLeaveStartDate('');
        setPopupLeaveEndDate('');
        setPopupDoer('');
        setPopupRemarks('');
        setUserTasks([]);
        setTaskAssignments({});
        setSelectedUsers([]);

        alert(`Successfully transferred ${result.tasksTransferred || 0} tasks with individual assignments!`);
        
        // Refresh data
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        console.error('Error assigning tasks:', error);
        alert(`Error: ${error.message}`);
      }
    } else {
      alert('No tasks found in the selected date range');
    }
  };

  // Add to your existing handleTabChange function
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'users') {
      dispatch(userDetails());
      dispatch(departmentDetails()); // Ensure departments are fetched
    } else if (tab === 'departments') {
      dispatch(departmentDetails());
    } else if (tab === 'leave') {
      dispatch(userDetails());
      dispatch(uniqueDoerNameData()); // Fetch all doer names for delegation
    }
  };

  // Add to your handleAddButtonClick function





  // Sample data
  // const [users, setUsers] = useState([
  //   {
  //     id: '1',
  //     username: 'john_doe',
  //     email: 'john@example.com',
  //     password: '********',
  //     department: 'IT',
  //     givenBy: 'admin',
  //     phone: '1234567890',
  //     role: 'user',
  //     status: 'active'
  //   },
  //   {
  //     id: '2',
  //     username: 'jane_smith',
  //     email: 'jane@example.com',
  //     password: '********',
  //     department: 'HR',
  //     givenBy: 'admin',
  //     phone: '0987654321',
  //     role: 'admin',
  //     status: 'active'
  //   }
  // ]);

  // const [departments, setDepartments] = useState([
  //   { id: '1', name: 'IT', givenBy: 'super_admin' },
  //   { id: '2', name: 'HR', givenBy: 'super_admin' },
  //   { id: '3', name: 'Finance', givenBy: 'admin' }
  // ]);

  // Form states
  // Change this in your form state initialization:
const [userForm, setUserForm] = useState({
  username: '',
  email: '',
  password: '',
  phone: '',
  departments: [], // Change from single department to array
  givenBy: '',
  role: 'user',
  status: 'active'
});

  const [deptForm, setDeptForm] = useState({
    name: '',
    givenBy: ''
  });

  useEffect(() => {
    dispatch(userDetails());
    dispatch(departmentDetails()); // Fetch departments on mount
  }, [dispatch])

  // In your handleAddUser function:
  // Modified handleAddUser
const handleAddUser = async (e) => {
  e.preventDefault();
  const newUser = {
    ...userForm,
    user_access: userForm.departments.join(','), // Join array into comma-separated string
  };

  try {
    await dispatch(createUser(newUser)).unwrap();
    resetUserForm();
    setShowUserModal(false);
    setTimeout(() => window.location.reload(), 1000);
  } catch (error) {
    console.error('Error adding user:', error);
  }
};

  // Modified handleUpdateUser
const handleUpdateUser = async (e) => {
  e.preventDefault();
  
  // Prepare updated user data
  const updatedUser = {
    user_name: userForm.username,
    email_id: userForm.email,
    number: userForm.phone,
    role: userForm.role,
    status: userForm.status,
    user_access: userForm.departments.join(',') // Join array into comma-separated string
  };

  // Only include password if it's not empty
  if (userForm.password.trim() !== '') {
    updatedUser.password = userForm.password;
  }

  try {
    await dispatch(updateUser({ id: currentUserId, updatedUser })).unwrap();
    resetUserForm();
    setShowUserModal(false);
    setTimeout(() => window.location.reload(), 1000);
  } catch (error) {
    console.error('Error updating user:', error);
  }
};

  // Modified handleAddDepartment
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    const newDept = { ...deptForm };

    try {
      await dispatch(createDepartment(newDept)).unwrap();
      resetDeptForm();
      setShowDeptModal(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error adding department:', error);
    }
  };

  // Modified handleUpdateDepartment
  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    const updatedDept = {
      department: deptForm.name,
      given_by: deptForm.givenBy
    };

    try {
      await dispatch(updateDepartment({ id: currentDeptId, updatedDept })).unwrap();
      resetDeptForm();
      setShowDeptModal(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error updating department:', error);
    }
  };

  // Modified handleDeleteUser
  const handleDeleteUser = async (userId) => {
    try {
      await dispatch(deleteUser(userId)).unwrap();
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };


  // User form handlers
const handleUserInputChange = (e) => {
  const { name, value, type, options } = e.target;
  
  if (name === 'departments') {
    // For multi-select dropdown
    const selectedValues = Array.from(options)
      .filter(option => option.selected)
      .map(option => option.value);
    
    setUserForm(prev => ({ ...prev, [name]: selectedValues }));
  } else {
    setUserForm(prev => ({ ...prev, [name]: value }));
  }
};

// Get unique departments from department data
const availableDepartments = React.useMemo(() => {
  if (department && department.length > 0) {
    return [...new Set(department.map(dept => dept.department))]
      .filter(deptName => deptName && deptName.trim() !== '')
      .sort();
  }
  return [];
}, [department]);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (showDeptDropdown && !event.target.closest('.relative')) {
      setShowDeptDropdown(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [showDeptDropdown]);

  // const handleAddUser = (e) => {
  //   e.preventDefault();
  //   const newUser = {
  //     ...userForm,
  //     id: (users.length + 1).toString(),
  //     password: '********'
  //   };
  //   setUsers([...users, newUser]);
  //   resetUserForm();
  //   setShowUserModal(false);
  // };
const handleEditUser = (userId) => {
  const user = userData.find(u => u.id === userId);
  setUserForm({
    username: user.user_name,
    email: user.email_id,
    password: user.password || '', // Pre-fill with existing password
    phone: user.number,
    departments: user.user_access ? user.user_access.split(',').map(d => d.trim()) : [], // Split comma-separated string into array
    role: user.role,
    status: user.status
  });
  setCurrentUserId(userId);
  setIsEditing(true);
  setShowUserModal(true);
};

  const handleEditDepartment = (deptId) => {
    const dept = department.find(d => d.id === deptId);
    setDeptForm({
      name: dept.department,  // Match your API response field names
      givenBy: dept.given_by
    });
    setCurrentDeptId(deptId);
    setShowDeptModal(true);
  };
  // const handleUpdateUser = (e) => {
  //   e.preventDefault();
  //   setUsers(users.map(user => 
  //     user.id === currentUserId ? { ...userForm, id: currentUserId } : user
  //   ));
  //   resetUserForm();
  //   setShowUserModal(false);
  // };



const resetUserForm = () => {
  setUserForm({
    username: '',
    email: '',
    password: '',
    phone: '',
    departments: [], // Reset to empty array
    givenBy: '',
    role: 'user',
    status: 'active'
  });
  setIsEditing(false);
  setCurrentUserId(null);
};

  // Department form handlers
  const handleDeptInputChange = (e) => {
    const { name, value } = e.target;
    setDeptForm(prev => ({ ...prev, [name]: value }));
  };

  // const handleAddDepartment = (e) => {
  //   e.preventDefault();
  //   const newDept = {
  //     ...deptForm,
  //     id: (departments.length + 1).toString()
  //   };
  //   setDepartments([...departments, newDept]);
  //   resetDeptForm();
  //   setShowDeptModal(false);
  // };


  //   const handleUpdateDepartment = (e) => {
  //     e.preventDefault();
  //     setDepartments(departments.map(dept => 
  //       dept.id === currentDeptId ? { ...deptForm, id: currentDeptId } : dept
  //     ));
  //     resetDeptForm();
  //     setShowDeptModal(false);
  //   };


  // const handleDeleteDepartment = (deptId) => {
  //   setDepartments(department.filter(dept => dept.id !== deptId));
  // };

  const resetDeptForm = () => {
    setDeptForm({
      name: '',
      givenBy: ''
    });
    setCurrentDeptId(null);
  };


  // Add this filtered users calculation for leave tab
  const filteredLeaveUsers = userData?.filter(user =>
    !leaveUsernameFilter || user.user_name.toLowerCase().includes(leaveUsernameFilter.toLowerCase())
  );


  const getStatusColor = (status) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-2">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
          {/* Top Row: Title and Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
            <div>
              <h1 className="text-lg font-bold text-gray-800">User Management System</h1>
              <p className="text-xs text-gray-500">Manage users, departments, and leave</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchDeviceLogsAndUpdateStatus}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              
              {activeTab !== 'leave' && localStorage.getItem('role') === 'super_admin' && (
                <button
                  onClick={handleAddButtonClick}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700"
                >
                  <Plus size={16} />
                  <span>{activeTab === 'users' ? 'Add User' : 'Add Department'}</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Bottom Row: Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'users' 
                  ? 'border-purple-600 text-purple-600 bg-purple-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => {
                handleTabChange('users');
                dispatch(userDetails());
              }}
            >
              <User size={18} />
              Users
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'departments' 
                  ? 'border-purple-600 text-purple-600 bg-purple-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => {
                handleTabChange('departments');
                dispatch(departmentOnlyDetails());
                dispatch(givenByDetails());
              }}
            >
              <Building size={18} />
              Departments
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'leave' 
                  ? 'border-purple-600 text-purple-600 bg-purple-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => {
                handleTabChange('leave');
                dispatch(userDetails());
              }}
            >
              <Calendar size={18} />
              Leave
            </button>
          </div>
        </div>
{/* <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="text-sm font-medium text-yellow-800">Debug Info</h3>
        <p className="text-xs text-yellow-700">
          Total Users: {userData?.length || 0} | 
          Active: {userData?.filter(u => u.status === 'active').length || 0} | 
          Inactive: {userData?.filter(u => u.status === 'inactive').length || 0}
        </p>
        <p className="text-xs text-yellow-700">
          Employee IDs in DB: {userData?.map(u => u.employee_id).filter(Boolean).join(', ') || 'None'}
        </p>
      </div> */}
        

        {/* Leave Management Tab */}
        {activeTab === 'leave' && (
          <div className="bg-white shadow rounded-lg overflow-hidden border border-purple-200">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple px-6 py-4 border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-purple-700">Leave Management</h2>

              <div className="flex items-center gap-4">
                {/* Username Search Filter for Leave Tab */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        list="leaveUsernameOptions"
                        placeholder="Filter by username..."
                        value={leaveUsernameFilter}
                        onChange={(e) => setLeaveUsernameFilter(e.target.value)}
                        className="w-48 pl-10 pr-8 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                      <datalist id="leaveUsernameOptions">
                        {userData?.map(user => (
                          <option key={user.id} value={user.user_name} />
                        ))}
                      </datalist>

                      {/* Clear button for input */}
                      {leaveUsernameFilter && (
                        <button
                          onClick={clearLeaveUsernameFilter}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                {/* Submit Button */}
                {/* Submit Button */}
                {localStorage.getItem('role') === 'super_admin' && (
                <button
                  onClick={handleSubmitLeave}
                  className="rounded-md bg-green-600 py-2 px-4 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Submit Leave
                </button>
                )}
              </div>
            </div>


            {/* Users List for Leave Selection - Updated with filter */}
            {/* Users List for Leave Selection */}
<div className="h-[calc(100vh-400px)] overflow-auto">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <input
            type="checkbox"
            onChange={handleSelectAll}
            checked={selectedUsers.length === filteredLeaveUsers?.length && filteredLeaveUsers?.length > 0}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Username
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Current Leave Start Date
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Current Leave End Date
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Current Remarks
        </th>
        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
          Action
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {filteredLeaveUsers?.map((user) => (
        <tr key={user.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <input
              type="checkbox"
              checked={selectedUsers.includes(user.id)}
              onChange={(e) => handleUserSelection(user.id, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm font-medium text-gray-900">{user.user_name}</div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">
              {user.leave_date ? new Date(user.leave_date).toLocaleDateString() : 'No leave set'}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">
              {user.leave_end_date ? new Date(user.leave_end_date).toLocaleDateString() : 'No end date set'}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">{user.remark || 'No remarks'}</div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            {localStorage.getItem('role') === 'super_admin' && (
              <button
                onClick={() => {
                  if(window.confirm(`Are you sure you want to clear leave for ${user.user_name}?`)) {
                     dispatch(updateUser({
                      id: user.id,
                      updatedUser: {
                        leave_date: null,
                        leave_end_date: null,
                        remark: null
                      }
                    })).then(() => {
                      setTimeout(() => window.location.reload(), 500);
                    });
                  }
                }}
                className="text-red-600 hover:text-red-900"
                title="Clear Leave (Does NOT delete user)"
              >
                <Trash2 size={18} />
              </button>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
          </div>
        )}


        {/* Users Tab */}
        {/* Users Tab */}
{activeTab === 'users' && (
  <div className="bg-white shadow rounded-lg overflow-hidden border border-purple-200">
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple px-6 py-4 border-gray-200 flex justify-between items-center">
      <h2 className="text-lg font-medium text-purple-700">User List</h2>

      {/* Username Filter */}
      <div className="relative">
        <div className="flex items-center gap-2">
          {/* Input with datalist for autocomplete */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              list="usernameOptions"
              placeholder="Filter by username..."
              value={usernameFilter}
              onChange={(e) => setUsernameFilter(e.target.value)}
              className="w-48 pl-10 pr-8 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <datalist id="usernameOptions">
              {userData?.map(user => (
                <option key={user.id} value={user.user_name} />
              ))}
            </datalist>

            {/* Clear button for input */}
            {usernameFilter && (
              <button
                onClick={clearUsernameFilter}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Dropdown button */}
          <button
            onClick={toggleUsernameDropdown}
            className="flex items-center gap-1 px-3 py-2 border border-purple-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
          >
            <ChevronDown size={16} className={`transition-transform ${usernameDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Dropdown menu */}
        {usernameDropdownOpen && (
          <div className="absolute z-50 mt-1 w-56 rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto top-full right-0">
            <div className="py-1">
              <button
                onClick={clearUsernameFilter}
                className={`block w-full text-left px-4 py-2 text-sm ${!usernameFilter ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                All Usernames
              </button>
              {userData?.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleUsernameFilterSelect(user.user_name)}
                  className={`block w-full text-left px-4 py-2 text-sm ${usernameFilter === user.user_name ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {user.user_name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

    <div className="h-[calc(100vh-275px)] overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3 p-3">
        {userData
          ?.filter(user => !usernameFilter || user.user_name.toLowerCase().includes(usernameFilter.toLowerCase()))
          .map((user, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user?.status)}`}>
                    {user?.status}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user?.role)}`}>
                    {user?.role}
                  </span>
                </div>
                <div className="flex space-x-2">
                  {localStorage.getItem('role') === 'super_admin' && (
                    <>
                      <button onClick={() => handleEditUser(user?.id)} className="text-blue-600" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteUser(user?.id)} className="text-red-600" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-2">{user?.user_name}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-500">Email:</span> <span className="font-medium">{user?.email_id || "—"}</span></div>
                <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{user?.number || "—"}</span></div>
                <div><span className="text-gray-500">Dept:</span> <span className="font-medium">{user?.user_access || "N/A"}</span></div>
              </div>
            </div>
          ))}
      </div>

      {/* Desktop Table View */}
      <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Username
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Password
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone No.
            </th>

            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Department
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
             {userData
            ?.filter(user =>
              !usernameFilter || user.user_name.toLowerCase().includes(usernameFilter.toLowerCase())
            )
            .map((user, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">{user?.user_name}</div>
                  </div>
                </td>
               <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono">
                        {showPasswords[user.id] ? user?.password : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(user.id)}
                        className="text-gray-500 hover:text-blue-600 text-xs"
                        title={showPasswords[user.id] ? "Hide Password" : "Show Password"}
                      >
                        {showPasswords[user.id] ? '👁️‍🗨️' : '👁️'}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(user?.password || '');
                          alert('Password copied to clipboard!');
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs bg-blue-50 px-2 py-1 rounded"
                        title="Copy Password"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user?.email_id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user?.number}</div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user?.user_access || 'N/A'}</div>
                </td>
                
                {/* Status Cell */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user?.status)}`}>
                      {user?.status}
                    </span>
                    {user?.status === 'active' && (
                      <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live Status"></span>
                    )}
                  </div>
                </td>
                
                {/* Role Cell */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user?.role)}`}>
                    {user?.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {localStorage.getItem('role') === 'super_admin' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditUser(user?.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit User"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user?.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
)}

        {/* Departments Tab */}
       {/* Departments Tab */}
{/* Departments Tab */}
{activeTab === 'departments' && (
  <div className="bg-white shadow rounded-lg overflow-hidden border border-purple-200">
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple px-4 sm:px-6 py-4 border-gray-200">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-lg font-medium text-purple-700">Department Management</h2>
        
        {/* Sub-tabs for Departments and Given By */}
        <div className="flex border border-purple-200 rounded-md overflow-hidden w-full sm:w-auto">
          <button
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium ${activeDeptSubTab === 'departments' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
            onClick={() => setActiveDeptSubTab('departments')}
          >
            Departments
          </button>
          <button
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium ${activeDeptSubTab === 'givenBy' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
            onClick={() => setActiveDeptSubTab('givenBy')}
          >
            Given By
          </button>
        </div>
      </div>
    </div>

    {/* Loading State */}
    {loading && (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    )}

    {/* Error State */}
    {error && (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md m-4">
        <p className="text-red-600">Error: {error}</p>
      </div>
    )}

    {/* Departments Sub-tab - Show only department names */}
    {activeDeptSubTab === 'departments' && !loading && (
      <div className="h-[calc(100vh-275px)] overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {department && department.length > 0 ? (
              // Get unique departments and show them
              Array.from(new Map(department.map(dept => [dept.department, dept])).values())
                .filter(dept => dept?.department && dept.department.trim() !== '')
                .map((dept, index) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        {localStorage.getItem('role') === 'super_admin' && (
                        <button
                          onClick={() => handleEditDepartment(dept.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit size={18} />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                  No departments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}

    {/* Given By Sub-tab - Show only given_by values */}
    {activeDeptSubTab === 'givenBy' && !loading && (
      <div className="h-[calc(100vh-275px)] overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Given By
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {department && department.length > 0 ? (
              // Get unique given_by values and show them
              Array.from(new Map(department.map(dept => [dept.given_by, dept])).values())
                .filter(dept => dept?.given_by && dept.given_by.trim() !== '')
                .map((dept, index) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.given_by}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        {localStorage.getItem('role') === 'super_admin' && (
                        <button
                          onClick={() => handleEditDepartment(dept.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit size={18} />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                  No given by data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {isEditing ? 'Edit User' : 'Create New User'}
                    </h3>
                    <button
                      onClick={() => setShowUserModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="mt-6">
                    <form onSubmit={isEditing ? handleUpdateUser : handleAddUser}>
                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username
                          </label>
                          <input
                            type="text"
                            name="username"
                            id="username"
                            value={userForm.username}
                            onChange={handleUserInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>

  {/* In the User Modal form */}
<div className="sm:col-span-3">
  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
    Password
  </label>
  <div className="relative mt-1">
    <input
      type={showModalPassword ? "text" : "password"}
      name="password"
      id="password"
      value={userForm.password}
      onChange={handleUserInputChange}
      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
      placeholder={isEditing ? "Leave empty to keep current password" : "Enter password"}
    />
    <button
      type="button"
      onClick={() => setShowModalPassword(!showModalPassword)}
      className="absolute inset-y-0 right-0 pr-3 flex items-center"
    >
      {showModalPassword ? (
        <EyeOff size={18} className="text-gray-400 hover:text-gray-600" />
      ) : (
        <Eye size={18} className="text-gray-400 hover:text-gray-600" />
      )}
    </button>
  </div>
  {isEditing && (
    <p className="mt-1 text-xs text-gray-500">
      Leave empty to keep current password
    </p>
  )}
</div>

                        <div className="sm:col-span-3">
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={userForm.email}
                            onChange={handleUserInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>

                        {!isEditing && (
                          <div className="sm:col-span-3">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                              Password
                            </label>
                            <input
                              type="password"
                              name="password"
                              id="password"
                              value={userForm.password}
                              onChange={handleUserInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                        )}

                        <div className="sm:col-span-3">
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={userForm.phone}
                            onChange={handleUserInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>





                        <div className="sm:col-span-3">
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                            Role
                          </label>
                          <select
                            id="role"
                            name="role"
                            value={userForm.role}
                            onChange={handleUserInputChange}
                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            {/* Only show/allow super_admin option if current user is super_admin (or you can decide policy) */}
                            {localStorage.getItem('role') === 'super_admin' && <option value="super_admin">Super Admin</option>}
                          </select>
                        </div>

                      {/* In the User Modal form - Replace the existing department field */}
<div className="sm:col-span-6">
  <label htmlFor="departments" className="block text-sm font-medium text-gray-700">
    Departments (Multiple Selection)
  </label>
  
  {/* Dropdown trigger button */}
  <div className="relative mt-1">
    <button
      type="button"
      onClick={() => setShowDeptDropdown(!showDeptDropdown)}
      className="w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-left focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
    >
      <div className="flex justify-between items-center">
        <span className="block truncate">
          {userForm.departments.length === 0 
            ? 'Select Departments' 
            : `${userForm.departments.length} department(s) selected`}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${showDeptDropdown ? 'rotate-180' : ''}`} />
      </div>
    </button>
    
    {/* Dropdown with checkboxes */}
    {showDeptDropdown && (
      <div className="absolute z-50 mt-1 w-full bg-white shadow-lg border border-gray-300 rounded-md max-h-60 overflow-y-auto">
        <div className="p-2">
          {/* Select All option */}
          <div className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
            <input
              type="checkbox"
              id="selectAllDepartments"
              checked={userForm.departments.length === availableDepartments.length && availableDepartments.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setUserForm(prev => ({ ...prev, departments: availableDepartments }));
                } else {
                  setUserForm(prev => ({ ...prev, departments: [] }));
                }
              }}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="selectAllDepartments" className="ml-3 text-sm text-gray-700 cursor-pointer">
              Select All
            </label>
          </div>
          
          <div className="border-t border-gray-200 my-2"></div>
          
          {/* Department checkboxes */}
          {availableDepartments.map((dept, index) => (
            <div key={index} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
              <input
                type="checkbox"
                id={`dept-${index}`}
                checked={userForm.departments.includes(dept)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setUserForm(prev => ({ 
                      ...prev, 
                      departments: [...prev.departments, dept] 
                    }));
                  } else {
                    setUserForm(prev => ({ 
                      ...prev, 
                      departments: prev.departments.filter(d => d !== dept) 
                    }));
                  }
                }}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`dept-${index}`} className="ml-3 text-sm text-gray-700 cursor-pointer">
                {dept}
              </label>
            </div>
          ))}
          
          {/* No departments available */}
          {availableDepartments.length === 0 && (
            <div className="p-3 text-center text-sm text-gray-500">
              No departments available
            </div>
          )}
        </div>
      </div>
    )}
  </div>
  
  {/* Selected departments display */}
  <div className="mt-2">
    <p className="text-xs font-medium text-gray-700 mb-1">Selected Departments:</p>
    <div className="flex flex-wrap gap-1">
      {userForm.departments.length > 0 ? (
        userForm.departments.map((dept, index) => (
          <span 
            key={index} 
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            {dept}
            <button
              type="button"
              onClick={() => {
                setUserForm(prev => ({
                  ...prev,
                  departments: prev.departments.filter(d => d !== dept)
                }));
              }}
              className="text-blue-600 hover:text-blue-800 focus:outline-none"
            >
              <X size={12} />
            </button>
          </span>
        ))
      ) : (
        <span className="text-xs text-gray-500">No departments selected</span>
      )}
    </div>
  </div>
</div>

                        <div className="sm:col-span-3">
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Status
                          </label>
                          <select
                            id="status"
                            name="status"
                            value={userForm.status}
                            onChange={handleUserInputChange}
                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowUserModal(false)}
                          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Save size={18} className="mr-2" />
                          {isEditing ? 'Update User' : 'Save User'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Department Modal */}
        {showDeptModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {currentDeptId ? 'Edit Department' : 'Create New Department'}
                    </h3>
                    <button
                      onClick={() => setShowDeptModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="mt-6">
                    <form onSubmit={currentDeptId ? handleUpdateDepartment : handleAddDepartment}>
                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-6">
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Department Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={deptForm.name}
                            onChange={handleDeptInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <label htmlFor="givenBy" className="block text-sm font-medium text-gray-700">
                            Given By
                          </label>
                          <input
                            type="text"
                            id="givenBy"
                            name="givenBy"
                            value={deptForm.givenBy}
                            onChange={handleDeptInputChange}
                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Enter Given By"
                          />
                        </div>

                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowDeptModal(false)}
                          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Save size={18} className="mr-2" />
                          {currentDeptId ? 'Update Department' : 'Save Department'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task Delegation Modal */}
        {showDelegationModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delegate Tasks
                    </h3>
                    <button
                      onClick={() => {
                        setShowDelegationModal(false);
                        setSelectedDoer('');
                      }}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Leave Start Date
                        </label>
                        <input
                          type="date"
                          value={leaveStartDate}
                          readOnly
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 cursor-not-allowed text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Leave End Date
                        </label>
                        <input
                          type="date"
                          value={leaveEndDate}
                          readOnly
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 cursor-not-allowed text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delegate To (Doer Name) <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedDoer}
                          onChange={(e) => setSelectedDoer(e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        >
                          <option value="">Select a doer...</option>
                          {doerName && doerName.length > 0 ? (
                            doerName.map((name, index) => (
                              <option key={index} value={name}>
                                {name}
                              </option>
                            ))
                          ) : (
                            <option value="" disabled>No doers available</option>
                          )}
                        </select>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-xs text-blue-800">
                          <strong>Note:</strong> Tasks from the selected date range will be transferred to the delegation system and assigned to the selected doer.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDelegationModal(false);
                        setSelectedDoer('');
                      }}
                      className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelegation}
                      className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:text-sm"
                    >
                      Submit Delegation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leave Transfer Popup Modal */}
        {showLeavePopup && currentLeaveUser && (
          <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="leave-transfer-modal" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => {
                setShowLeavePopup(false);
                setCurrentLeaveUser(null);
                setSelectedUsers([]);
              }}></div>
              
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Transfer Tasks for {currentLeaveUser.user_name}
                    </h3>
                    <button
                      onClick={() => {
                        setShowLeavePopup(false);
                        setCurrentLeaveUser(null);
                        setSelectedUsers([]);
                      }}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Leave Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={popupLeaveStartDate}
                          onChange={(e) => setPopupLeaveStartDate(e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Leave End Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={popupLeaveEndDate}
                          onChange={(e) => setPopupLeaveEndDate(e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        />
                      </div>
                      
                      {/* Tasks Table Section */}
                      {popupLeaveStartDate && popupLeaveEndDate && (
                        <div className="mt-4">
                          {isLoadingTasks ? (
                            <div className="text-center py-4">
                              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-2"></div>
                              <p className="text-sm text-gray-600">Loading tasks...</p>
                            </div>
                          ) : fetchError ? (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                              <p className="text-sm text-red-800">{fetchError}</p>
                            </div>
                          ) : userTasks.length === 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                              <p className="text-sm text-yellow-800">No tasks found for {currentLeaveUser.user_name} in the selected date range.</p>
                            </div>
                          ) : (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">
                                Tasks to Assign ({userTasks.length})
                              </h4>
                              <div className="border border-gray-300 rounded-md overflow-hidden">
                                <div className="max-h-64 overflow-y-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign To <span className="text-red-500">*</span></th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {userTasks.map((task) => (
                                        <tr key={task.task_id} className="hover:bg-gray-50">
                                          <td className="px-3 py-2 text-xs text-gray-900">{task.task_id}</td>
                                          <td className="px-3 py-2 text-xs text-gray-900" title={task.task_description}>
                                            <div className="max-w-xs truncate">{task.task_description}</div>
                                          </td>
                                          <td className="px-3 py-2 text-xs text-gray-900">
                                            {task.task_start_date ? new Date(task.task_start_date).toLocaleDateString() : '-'}
                                          </td>
                                          <td className="px-3 py-2">
                                            <select
                                              value={taskAssignments[task.task_id] || ''}
                                              onChange={(e) => handleTaskAssignment(task.task_id, e.target.value)}
                                              className="w-full text-xs border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                            >
                                              <option value="">Select user...</option>
                                              {userData && userData.length > 0 ? (
                                                userData.map((user) => (
                                                  <option key={user.id} value={user.user_name}>
                                                    {user.user_name}
                                                  </option>
                                                ))
                                              ) : (
                                                <option value="" disabled>No users available</option>
                                              )}
                                            </select>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Shift Doer Name field removed - now using individual task assignments */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Remarks
                        </label>
                        <textarea
                          value={popupRemarks}
                          onChange={(e) => setPopupRemarks(e.target.value)}
                          placeholder="Enter remarks (optional)"
                          rows="3"
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        />
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-xs text-blue-800">
                          <strong>Note:</strong> This will delete {currentLeaveUser.user_name}'s tasks from the checklist for the selected dates and assign them to the chosen doer in the delegation system.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowLeavePopup(false);
                        setCurrentLeaveUser(null);
                        setSelectedUsers([]);
                      }}
                      className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleLeaveTransferSubmit}
                      className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:text-sm"
                    >
                      Transfer Tasks
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Setting;










// <div className="space-y-8">
//   {/* Header and Tabs */}
//   <div className="my-5">
//     {/* Header */}
//     <div className="flex justify-between items-center mb-6">
//       <h1 className="text-xl md:text-2xl font-bold text-purple-600">User Management System</h1>
//     </div>

//     {/* Tabs and Add Button Container */}
//     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//       {/* Tabs */}
//       <div className="flex border border-purple-200 rounded-md overflow-hidden self-start w-full sm:w-auto">
//         <button
//           className={`flex flex-1 justify-center items-center px-3 py-2 md:px-4 md:py-3 text-sm font-medium ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
//           onClick={() => {
//             handleTabChange('users');
//             dispatch(userDetails());
//           }}
//         >
//           <User size={16} className="mr-1 md:mr-2" />
//           <span className="hidden xs:inline">Users</span>
//         </button>
//         <button
//           className={`flex flex-1 justify-center items-center px-3 py-2 md:px-4 md:py-3 text-sm font-medium ${activeTab === 'departments' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
//           onClick={() => {
//             handleTabChange('departments');
//             dispatch(departmentOnlyDetails());
//             dispatch(givenByDetails());
//           }}
//         >
//           <Building size={16} className="mr-1 md:mr-2" />
//           <span className="hidden xs:inline">Departments</span>
//         </button>
//         <button
//           className={`flex flex-1 justify-center items-center px-3 py-2 md:px-4 md:py-3 text-sm font-medium ${activeTab === 'leave' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
//           onClick={() => {
//             handleTabChange('leave');
//             dispatch(userDetails());
//           }}
//         >
//           <Calendar size={16} className="mr-1 md:mr-2" />
//           <span className="hidden xs:inline">Leave</span>
//         </button>
//       </div>

//       {/* Add button - hide for leave tab */}
//       {activeTab !== 'leave' && (
//         <button
//           onClick={handleAddButtonClick}
//           className="rounded-md gradient-bg py-2 px-3 md:px-4 text-white hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto"
//         >
//           <div className="flex items-center justify-center">
//             <Plus size={16} className="mr-1 md:mr-2" />
//             <span className="text-sm">
//               {activeTab === 'users' ? 'Add User' : 'Add Department'}
//             </span>
//           </div>
//         </button>
//       )}
//     </div>
//   </div>
