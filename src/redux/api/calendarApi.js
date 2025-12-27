import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch tasks for calendar (filtered by user for non-admin)
export const fetchCalendarTasks = async (month, year, username, role) => {
  try {
    const params = {};
    if (month && year) {
      params.month = month;
      params.year = year;
    }
    if (username) {
      params.username = username;
    }
    if (role) {
      params.role = role;
    }
    
    const response = await axios.get(`${API_URL}/api/calendar/tasks`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching calendar tasks:", error);
    throw error;
  }
};
