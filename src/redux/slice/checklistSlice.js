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

export const fetchAllChecklistData = createAsyncThunk(
  "fetch/allChecklist",
  async ({ search = '' } = {}) => {
    // Fetch first page to get totalCount
    const firstPage = await fetchChechListDataSortByDate(1, search);
    let allData = [...firstPage.data];
    const totalCount = firstPage.totalCount;
    const totalPages = Math.ceil(totalCount / 50); // Assuming 50 is page size
    
    // If more pages exist, fetch them concurrently
    if (totalPages > 1) {
      const promises = [];
      for (let i = 2; i <= totalPages; i++) {
        promises.push(fetchChechListDataSortByDate(i, search));
      }
      const results = await Promise.all(promises);
      results.forEach(res => {
        allData = [...allData, ...res.data];
      });
    }
    
    return { data: allData, totalCount, search };
  }
);


// ============================================================
// 2️⃣ FETCH HISTORY CHECKLIST
// ============================================================
export const checklistHistoryData = createAsyncThunk(
  "fetch/history",
  async (arg = 1) => {
    // Backward compatible: accepts a page number or { page, search, approvalStatus }
    const page = typeof arg === "object" ? arg.page ?? 1 : arg;
    const search = typeof arg === "object" ? arg.search ?? "" : "";
    const approvalStatus = typeof arg === "object" ? arg.approvalStatus ?? "all" : "all";
    const { data, totalCount } = await fetchChechListDataForHistory(page, search, approvalStatus);
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
      // FETCH ALL PENDING CHECKLIST
      // -----------------------------
      .addCase(fetchAllChecklistData.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchAllChecklistData.fulfilled, (state, action) => {
        state.loading = false;
        state.checklist = action.payload.data;
        state.totalCount = action.payload.totalCount;
        state.hasMore = false; // We fetched everything
      })

      .addCase(fetchAllChecklistData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Failed fetching all checklists";
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
