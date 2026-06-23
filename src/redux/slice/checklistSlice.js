import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { 
  fetchChechListDataForHistory, 
  fetchChechListDataSortByDate, 
  postChecklistAdminDoneAPI, 
  updateChecklistData 
} from "../api/checkListApi";


// ============================================================
// 1️⃣ FETCH PENDING CHECKLIST
// ============================================================
export const checklistData = createAsyncThunk(
  "fetch/checklist",
  async ({ page = 1, search = '' } = {}) => {
    const { data, totalCount } = await fetchChechListDataSortByDate(page, search);
    return { data, totalCount, page, search };
  }
);


// ============================================================
// 2️⃣ FETCH HISTORY CHECKLIST
// ============================================================
export const checklistHistoryData = createAsyncThunk(
  "fetch/history",
  async (page = 1) => {
    const { data, totalCount } = await fetchChechListDataForHistory(page);
    return { data, totalCount, page };
  }
);


// ============================================================
// 3️⃣ UPDATE CHECKLIST (USER SUBMISSION)
// ============================================================
export const updateChecklist = createAsyncThunk(
  "update/checklist",
  async (submissionData) => {
    const updated = await updateChecklistData(submissionData);
    return updated;  // returns only message
  }
);


// ============================================================
// 4️⃣ ADMIN DONE
// ============================================================
export const checklistAdminDone = createAsyncThunk(
  "insert/admin_done",
  async (items) => {
    const admin_done = await postChecklistAdminDoneAPI(items);
    return admin_done;
  }
);


// ============================================================
// 5️⃣ SLICE
// ============================================================
const checkListSlice = createSlice({
  name: "checklist",
  initialState: {
    checklist: [],
    history: [],
    loading: false,
    error: null,
    hasMore: true,
    currentPage: 1,
    totalCount: 0,
    historyTotalCount: 0,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder

      // -----------------------------
      // FETCH PENDING CHECKLIST
      // -----------------------------
      .addCase(checklistData.pending, (state) => {
        state.loading = true;
      })

      .addCase(checklistData.fulfilled, (state, action) => {
        state.loading = false;
        // Always replace – frontend handles pagination by requesting specific pages
        state.checklist = action.payload.data;
        state.currentPage = action.payload.page;
        state.totalCount = action.payload.totalCount;
        state.hasMore = action.payload.data.length === 50; // 50 = backend page size
      })

      .addCase(checklistData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Failed fetching checklist";
      })



      // -----------------------------
      // FETCH HISTORY
      // -----------------------------
      .addCase(checklistHistoryData.pending, (state) => {
        state.loading = true;
      })

      .addCase(checklistHistoryData.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload.data;
        state.historyTotalCount = action.payload.totalCount;
      })

      .addCase(checklistHistoryData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Failed fetching history";
      })



      // -----------------------------
      // UPDATE CHECKLIST (USER SUBMIT)
      // -----------------------------
      .addCase(updateChecklist.pending, (state) => {
        state.loading = true;
      })

      .addCase(updateChecklist.fulfilled, (state) => {
        state.loading = false;
        // No need to update state.checklist – backend already saved
      })

      .addCase(updateChecklist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Failed updating checklist";
      })



      // -----------------------------
      // ADMIN DONE
      // -----------------------------
      .addCase(checklistAdminDone.pending, (state) => {
        state.loading = true;
      })

      .addCase(checklistAdminDone.fulfilled, (state) => {
        state.loading = false;
      })

      .addCase(checklistAdminDone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Admin update failed";
      });
  },
});

export default checkListSlice.reducer;
