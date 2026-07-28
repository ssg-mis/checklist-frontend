const API_BASE = `${import.meta.env.VITE_API_BASE_URL}`;

// =========================
// FETCH CHECKLIST (PAGINATED)
// =========================
export const fetchChecklistData = async (
  page = 0,
  pageSize = 50,
  nameFilter = "",
  startDate = "",
  endDate = "",
  givenByFilter = "",
  frequencyFilter = "",
  reminderFilter = "",
  attachmentFilter = ""
) => {
  const res = await fetch(`${API_BASE}/tasks/checklist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page,
      pageSize,
      nameFilter,
      startDate,
      endDate,
      givenByFilter,
      frequencyFilter,
      reminderFilter,
      attachmentFilter
    }),
  });

  return res.json();
};

export const fetchQuickTaskChecklistFilterOptions = async () => {
  const res = await fetch(`${API_BASE}/tasks/checklist-filter-options`);
  return res.json();
};

// =========================
// FETCH DELEGATION
// =========================
export const fetchDelegationData = async (
  page = 0,
  pageSize = 50,
  nameFilter = "",
  startDate = "",
  endDate = "",
  givenByFilter = "",
  frequencyFilter = "",
  reminderFilter = "",
  attachmentFilter = ""
) => {
  const res = await fetch(`${API_BASE}/tasks/delegation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page,
      pageSize,
      nameFilter,
      startDate,
      endDate,
      givenByFilter,
      frequencyFilter,
      reminderFilter,
      attachmentFilter
    }),
  });

  return res.json();
};

// =========================
// DELETE CHECKLIST TASKS
// =========================
export const deleteChecklistTasksApi = async ({ tasks, deleteScope }) => {
  const res = await fetch(`${API_BASE}/tasks/delete-checklist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tasks, deleteScope }),
  });

  return res.json();
};

// =========================
// DELETE DELEGATION TASKS
// =========================
export const deleteDelegationTasksApi = async (taskIds) => {
  const res = await fetch(`${API_BASE}/tasks/delete-delegation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskIds }),
  });

  return res.json();
};

// =========================
// UPDATE CHECKLIST TASK
// =========================
export const updateChecklistTaskApi = async (updatedTask, originalTask) => {
  const res = await fetch(`${API_BASE}/tasks/update-checklist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updatedTask, originalTask }),
  });

  return res.json();
};

// =========================
// FETCH USERS
// =========================
export const fetchUsersData = async () => {
  const res = await fetch(`${API_BASE}/tasks/users`);
  return res.json();
};
