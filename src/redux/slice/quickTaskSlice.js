import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { 
  deleteChecklistTasksApi, 
  deleteDelegationTasksApi, 
  fetchChecklistData, 
  fetchDelegationData,
  fetchUsersData,
  updateChecklistTaskApi,
  fetchQuickTaskChecklistFilterOptions
} from "../api/quickTaskApi";

export const fetchUsers = createAsyncThunk(
  'fetch/users',
  async () => {
    const users = await fetchUsersData();
    return users;
  }
);

export const uniqueChecklistTaskData = createAsyncThunk(
  'fetch/checklistTask',
  async ({ 
    page = 0, 
    pageSize = 50, 
    nameFilter = '', 
    startDate = '',
    endDate = '',
    givenByFilter = '',
    frequencyFilter = '',
    reminderFilter = '',
    attachmentFilter = '',
    append = false 
  }) => {
    const result = await fetchChecklistData(
      page, 
      pageSize, 
      nameFilter,
      startDate,
      endDate,
      givenByFilter,
      frequencyFilter,
      reminderFilter,
      attachmentFilter
    );
    return { ...result, append };
  }
);

export const fetchQuickTaskFilterOptions = createAsyncThunk(
  'fetch/quickTaskFilterOptions',
  async () => {
    return await fetchQuickTaskChecklistFilterOptions();
  }
);

export const uniqueDelegationTaskData = createAsyncThunk(
  'fetch/delegationTask',
  async ({
    page = 0,
    pageSize = 50,
    nameFilter = '',
    startDate = '',
    endDate = '',
    givenByFilter = '',
    frequencyFilter = '',
    reminderFilter = '',
    attachmentFilter = '',
    append = false
  }) => {
    const result = await fetchDelegationData(
      page,
      pageSize,
      nameFilter,
      startDate,
      endDate,
      givenByFilter,
      frequencyFilter,
      reminderFilter,
      attachmentFilter
    );
    return { ...result, append };
  }
);

export const deleteChecklistTask = createAsyncThunk(
  'delete/checklistTask',
  async (deletePayload, { rejectWithValue }) => {
    try {
      return await deleteChecklistTasksApi(deletePayload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteDelegationTask = createAsyncThunk(
  'delete/delegationTask',
  async (taskIds, { rejectWithValue }) => {
    try {
      return await deleteDelegationTasksApi(taskIds);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateChecklistTask = createAsyncThunk(
  'update/checklistTask',
  async ({ updatedTask, originalTask }, { rejectWithValue }) => {
    try {
      console.log("Redux action called with:", { updatedTask, originalTask });
      const result = await updateChecklistTaskApi(updatedTask, originalTask);
      return result;
    } catch (error) {
      console.error("Redux action error:", error);
      return rejectWithValue(error.message);
    }
  }
);

const quickTaskSlice = createSlice({
  name: 'quickTask',
  initialState: {
    quickTask: [],
    delegationTasks: [],
    users: [],
    error: null,
    loading: false,
    checklistPage: 0,
    checklistTotal: 0,
    checklistHasMore: true,
    delegationPage: 0,
    delegationTotal: 0,
    delegationHasMore: true,
    filterOptions: {
      givenBy: [],
      names: [],
      frequencies: []
    }
  },
  reducers: {
    resetChecklistPagination: (state) => {
      state.quickTask = [];
      state.checklistPage = 0;
      state.checklistHasMore = true;
    },
    resetDelegationPagination: (state) => {
      state.delegationTasks = [];
      state.delegationPage = 0;
      state.delegationHasMore = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uniqueChecklistTaskData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uniqueChecklistTaskData.fulfilled, (state, action) => {
        state.loading = false;
        const { data, total, append } = action.payload;
        
        if (append) {
          state.quickTask = [...state.quickTask, ...data];
          state.checklistPage += 1;
        } else {
          state.quickTask = data;
          state.checklistPage = 1;
        }
        
        state.checklistTotal = total;
        state.checklistHasMore = state.quickTask.length < total;
      })
      .addCase(uniqueChecklistTaskData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(uniqueDelegationTaskData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uniqueDelegationTaskData.fulfilled, (state, action) => {
        state.loading = false;
        const { data, total, append } = action.payload;
        
        if (append) {
          state.delegationTasks = [...state.delegationTasks, ...data];
          state.delegationPage += 1;
        } else {
          state.delegationTasks = data;
          state.delegationPage = 1;
        }
        
        state.delegationTotal = total;
        state.delegationHasMore = state.delegationTasks.length < total;
      })
      .addCase(uniqueDelegationTaskData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteChecklistTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteChecklistTask.fulfilled, (state, action) => {
        state.loading = false;
        const deletedTaskIds = (action.payload?.deletedTaskIds || []).map(String);
        state.quickTask = state.quickTask.filter(
          task => !deletedTaskIds.includes(String(task.task_id))
        );
      })
      .addCase(deleteChecklistTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteDelegationTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteDelegationTask.fulfilled, (state, action) => {
        state.loading = false;
        state.delegationTasks = state.delegationTasks.filter(
          task => !action.payload.includes(task.task_id)
        );
      })
      .addCase(deleteDelegationTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateChecklistTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateChecklistTask.fulfilled, (state, action) => {
        state.loading = false;
        const updatedTasks = action.payload;
        if (Array.isArray(updatedTasks)) {
          updatedTasks.forEach(updatedTask => {
            const index = state.quickTask.findIndex(task => task.task_id === updatedTask.task_id);
            if (index !== -1) {
              state.quickTask[index] = updatedTask;
            }
          });
        }
      })
      .addCase(updateChecklistTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchQuickTaskFilterOptions.fulfilled, (state, action) => {
        state.filterOptions = {
          givenBy: action.payload.givenBy || [],
          names: action.payload.names || [],
          frequencies: action.payload.frequencies || []
        };
      });
  },
});

export const { resetChecklistPagination, resetDelegationPagination } = quickTaskSlice.actions;
export default quickTaskSlice.reducer;
