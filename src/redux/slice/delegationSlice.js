import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchDelegationDataSortByDate,
  fetchDelegation_DoneDataSortByDate,
  insertDelegationDoneAndUpdate,
  fetchDelegationFilterOptions,
} from "../api/delegationApi";

export const delegationData = createAsyncThunk(
  "delegation/fetchPending",
  async (filters = {}) => {
    return await fetchDelegationDataSortByDate(filters);
  }
);

export const delegationDoneData = createAsyncThunk(
  "delegation/fetchDone",
  async (filters = {}) => {
    return await fetchDelegation_DoneDataSortByDate(filters);
  }
);

export const getDelegationFilterOptionsThunk = createAsyncThunk(
  "delegation/fetchFilterOptions",
  async () => {
    return await fetchDelegationFilterOptions();
  }
);

export const submitDelegation = createAsyncThunk(
  "delegation/submit",
  async (payload) => {
    return await insertDelegationDoneAndUpdate(payload);
  }
);

const delegationSlice = createSlice({
  name: "delegation",
  initialState: {
    delegation: [],
    delegation_done: [],
    loading: false,
    error: null,
    filterOptions: {
      doers: [],
      creators: []
    }
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Pending
      .addCase(delegationData.pending, (state) => {
        state.loading = true;
      })
      .addCase(delegationData.fulfilled, (state, action) => {
        state.loading = false;
        state.delegation = action.payload;
      })
      .addCase(delegationData.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to fetch delegation";
      })

      // Fetch Done
      .addCase(delegationDoneData.pending, (state) => {
        state.loading = true;
      })
      .addCase(delegationDoneData.fulfilled, (state, action) => {
        state.loading = false;
        state.delegation_done = action.payload;
      })
      .addCase(delegationDoneData.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to fetch done delegation";
      })

      // Fetch Filter Options
      .addCase(getDelegationFilterOptionsThunk.fulfilled, (state, action) => {
        state.filterOptions = action.payload;
      })

      // Submit
      .addCase(submitDelegation.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitDelegation.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(submitDelegation.rejected, (state) => {
        state.loading = false;
        state.error = "Submission failed";
      });
  },
});

export default delegationSlice.reducer;
