import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// ========================
// HOLIDAY API
// ========================

// Fetch all holidays
export const fetchHolidays = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/holidays`);
    return response.data;
  } catch (error) {
    console.error("Error fetching holidays:", error);
    throw error;
  }
};

// Add holiday
export const addHoliday = async (holidayData) => {
  try {
    const response = await axios.post(`${API_URL}/api/holidays`, holidayData);
    return response.data;
  } catch (error) {
    console.error("Error adding holiday:", error);
    throw error;
  }
};

// Delete holiday
export const deleteHoliday = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/holidays/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting holiday:", error);
    throw error;
  }
};

// ========================
// WORKING DAY API
// ========================

// Fetch all working days
export const fetchWorkingDays = async (month, year) => {
  try {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    
    const response = await axios.get(`${API_URL}/api/working-days`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching working days:", error);
    throw error;
  }
};

// Add working day
export const addWorkingDay = async (workingDayData) => {
  try {
    const response = await axios.post(`${API_URL}/api/working-days`, workingDayData);
    return response.data;
  } catch (error) {
    console.error("Error adding working day:", error);
    throw error;
  }
};

// Delete working day
export const deleteWorkingDay = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/working-days/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting working day:", error);
    throw error;
  }
};
