// checkListApi.js
// const BASE_URL = "http://localhost:5050/api/checklist";
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/checklist`;

// =======================================================
// 1️⃣ Fetch Pending Checklist (AWS Backend)
// =======================================================
export const fetchChechListDataSortByDate = async (filters = {}) => {
  const username = localStorage.getItem("user-name");
  const role = localStorage.getItem("role");

  // Construct query parameters
  const params = new URLSearchParams({
    username: username || "",
    role: role || "",
    ...filters
  });

  const response = await fetch(`${BASE_URL}/pending?${params.toString()}`);
  return await response.json();
};


// =======================================================
// 2️⃣ Fetch Checklist History (AWS Backend)
// =======================================================
export const fetchChechListDataForHistory = async (filters = {}) => {
  const username = localStorage.getItem("user-name");
  const role = localStorage.getItem("role");

  const params = new URLSearchParams({
    username: username || "",
    role: role || "",
    page: filters.page || 1,
    search: (filters.search || "").trim(),
    approvalStatus: filters.approvalStatus || "all",
  });

  if (filters.name) params.append("name", filters.name);
  if (filters.department) params.append("department", filters.department);
  if (filters.file) params.append("file", filters.file);
  if (filters.status) params.append("status", filters.status);
  if (filters.submission) params.append("submission", filters.submission);
  if (filters.deadline) params.append("deadline", filters.deadline);
  if (filters.fromDate) params.append("fromDate", filters.fromDate);
  if (filters.toDate) params.append("toDate", filters.toDate);
  if (filters.remarks) params.append("remarks", filters.remarks);
  if (filters.frequency) params.append("frequency", filters.frequency);
  if (filters.givenBy) params.append("givenBy", filters.givenBy);
  if (filters.reminder) params.append("reminder", filters.reminder);
  if (filters.attachment) params.append("attachment", filters.attachment);

  const response = await fetch(`${BASE_URL}/history?${params.toString()}`);
  return await response.json();
};

export const fetchChecklistFilterOptionsAPI = async () => {
  const response = await fetch(`${BASE_URL}/filter-options`);
  return await response.json();
};


// =======================================================
// 3️⃣ Submit Checklist (AWS Backend)
// =======================================================
export const updateChecklistData = async (submissionData) => {
  try {
    const response = await fetch(`${BASE_URL}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submissionData),
    });

    if (!response.ok) {
      throw new Error("Update failed");
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error("❌ Error Updating Checklist:", error);
    throw error;
  }
};

// =======================================================
// 4️⃣ Admin Done API (AWS Backend)
// =======================================================
export const postChecklistAdminDoneAPI = async (selectedItems) => {
  try {
    const response = await fetch(`${BASE_URL}/admin-done`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedItems),
    });

    const json = await response.json();
    return json;
  } catch (error) {
    console.error("❌ Error Marking Admin Done:", error);
    return { error };
  }
};

// =======================================================
// 4b️⃣ Revert Admin Done API (AWS Backend)
// =======================================================
export const revertChecklistAdminDoneAPI = async (task_id) => {
  try {
    const response = await fetch(`${BASE_URL}/admin-done-revert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id }),
    });

    const json = await response.json();
    return json;
  } catch (error) {
    console.error("❌ Error Reverting Admin Done:", error);
    return { error };
  }
};

// =======================================================
// 5️⃣ Send WhatsApp Notification API (Admin Only)
// =======================================================
export const sendChecklistWhatsAppAPI = async (selectedItems) => {
  try {
    const response = await fetch(`${BASE_URL}/send-whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: selectedItems }),
    });

    const json = await response.json();
    return json;
  } catch (error) {
    console.error("❌ Error Sending WhatsApp:", error);
    return { error };
  }
};
