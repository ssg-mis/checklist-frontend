"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, X, CalendarDays, AlertCircle } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import {
  fetchHolidays,
  addHoliday,
  deleteHoliday,
  fetchWorkingDays,
  addWorkingDay,
  deleteWorkingDay
} from "../../redux/api/holidayApi";

export default function HolidayManagementPage() {
  const [activeTab, setActiveTab] = useState("holidays");
  const [holidays, setHolidays] = useState([]);
  const [workingDays, setWorkingDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const userRole = localStorage.getItem("role");

  // Form states
  const [holidayForm, setHolidayForm] = useState({ holiday_date: "", remarks: "" });
  const [workingDayForm, setWorkingDayForm] = useState({ working_date: "" });

  // Filter state for working days
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Load holidays
  const loadHolidays = async () => {
    try {
      setLoading(true);
      const data = await fetchHolidays();
      setHolidays(data.data || []);
    } catch (err) {
      setError("Failed to load holidays");
    } finally {
      setLoading(false);
    }
  };

  // Load working days
  const loadWorkingDays = async () => {
    try {
      setLoading(true);
      const data = await fetchWorkingDays(filterMonth, filterYear);
      setWorkingDays(data.data || []);
    } catch (err) {
      setError("Failed to load working days");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "holidays") {
      loadHolidays();
    } else {
      loadWorkingDays();
    }
  }, [activeTab, filterMonth, filterYear]);

  // Handle add holiday
  const handleAddHoliday = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await addHoliday(holidayForm);
      setSuccessMessage("Holiday added successfully! (Also removed from working days)");
      setHolidayForm({ holiday_date: "", remarks: "" });
      setShowAddForm(false);
      loadHolidays();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to add holiday");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete holiday
  const handleDeleteHoliday = async (id) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;
    try {
      setLoading(true);
      await deleteHoliday(id);
      setSuccessMessage("Holiday deleted successfully");
      loadHolidays();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to delete holiday");
    } finally {
      setLoading(false);
    }
  };

  // Handle add working day
  const handleAddWorkingDay = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await addWorkingDay(workingDayForm);
      setSuccessMessage("Working day added successfully");
      setWorkingDayForm({ working_date: "" });
      setShowAddForm(false);
      loadWorkingDays();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to add working day");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete working day
  const handleDeleteWorkingDay = async (id) => {
    if (!confirm("Are you sure you want to delete this working day?")) return;
    try {
      setLoading(true);
      await deleteWorkingDay(id);
      setSuccessMessage("Working day deleted successfully");
      loadWorkingDays();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to delete working day");
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Month names
  const months = [
    { value: 1, name: "January" }, { value: 2, name: "February" }, { value: 3, name: "March" },
    { value: 4, name: "April" }, { value: 5, name: "May" }, { value: 6, name: "June" },
    { value: 7, name: "July" }, { value: 8, name: "August" }, { value: 9, name: "September" },
    { value: 10, name: "October" }, { value: 11, name: "November" }, { value: 12, name: "December" }
  ];

  return (
    <AdminLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Holiday & Working Day Management</h1>
            <p className="text-sm text-gray-500">Manage holidays and working days</p>
          </div>
          {userRole === "super_admin" && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add {activeTab === "holidays" ? "Holiday" : "Working Day"}
          </button>
          )}
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("holidays")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "holidays"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Holiday List
          </button>
          <button
            onClick={() => setActiveTab("workingDays")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "workingDays"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Working Days
          </button>
        </div>

        {/* Working Days Filter */}
        {activeTab === "workingDays" && (
          <div className="flex gap-3 mb-4">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.name}</option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {[2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
              {activeTab === "holidays" ? (
                // Holiday List Table
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Remarks</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {holidays.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          No holidays found
                        </td>
                      </tr>
                    ) : (
                      holidays.map((holiday) => (
                        <tr key={holiday.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">{holiday.id}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">
                            {formatDate(holiday.holiday_date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{holiday.remarks || "-"}</td>
                          <td className="px-4 py-3 text-center">
                            {userRole === "super_admin" && (
                            <button
                              onClick={() => handleDeleteHoliday(holiday.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                // Working Days Table
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Day</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Week</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {workingDays.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          No working days found for selected month
                        </td>
                      </tr>
                    ) : (
                      workingDays.map((day) => (
                        <tr key={day.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">{day.id}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">
                            {formatDate(day.working_date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{day.day}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">Week {day.week_num}</td>
                          <td className="px-4 py-3 text-center">
                            {userRole === "super_admin" && (
                            <button
                              onClick={() => handleDeleteWorkingDay(day.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 flex gap-4 text-sm">
          <span className="text-purple-600 font-medium">
            {activeTab === "holidays" 
              ? `Total Holidays: ${holidays.length}` 
              : `Total Working Days: ${workingDays.length}`}
          </span>
        </div>

        {/* Add Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-800">
                  Add {activeTab === "holidays" ? "Holiday" : "Working Day"}
                </h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={activeTab === "holidays" ? handleAddHoliday : handleAddWorkingDay}>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={activeTab === "holidays" ? holidayForm.holiday_date : workingDayForm.working_date}
                      onChange={(e) => 
                        activeTab === "holidays"
                          ? setHolidayForm({ ...holidayForm, holiday_date: e.target.value })
                          : setWorkingDayForm({ ...workingDayForm, working_date: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  {activeTab === "holidays" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remarks / Description
                      </label>
                      <input
                        type="text"
                        value={holidayForm.remarks}
                        onChange={(e) => setHolidayForm({ ...holidayForm, remarks: e.target.value })}
                        placeholder="e.g., Republic Day, Company Holiday"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  )}

                  {activeTab === "holidays" && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                      <AlertCircle className="h-4 w-4 inline-block mr-1" />
                      Note: Adding a holiday will automatically remove the date from Working Days calendar.
                    </div>
                  )}
                </div>

                <div className="flex gap-3 p-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? "Adding..." : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
