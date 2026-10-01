"use client"

import { useState, useEffect } from "react"
import { getTotalUsersCountApi } from "../../../redux/api/dashboardApi"
import { exportDateRangeReport } from "../../../utils/exportReportPdf"

export default function DashboardHeader({
  dashboardType,
  setDashboardType,
  dashboardStaffFilter,
  setDashboardStaffFilter,
  availableStaff,
  userRole,
  username,
  departmentFilter,
  setDepartmentFilter,
  availableDepartments,
  isLoadingMore,
  onDateRangeChange // Add this prop to handle date range selection
}) {
  const [totalUsersCount, setTotalUsersCount] = useState(0)
  const [showDateRangePicker, setShowDateRangePicker] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const [showExportModal, setShowExportModal] = useState(false)
  const [exportStartDate, setExportStartDate] = useState("")
  const [exportEndDate, setExportEndDate] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState("")

  // Fetch total users count
  useEffect(() => {
    const fetchTotalUsers = async () => {
      try {
        const count = await getTotalUsersCountApi()
        setTotalUsersCount(count)
      } catch (error) {
        console.error('Error fetching total users count:', error)
      }
    }

    fetchTotalUsers()
  }, [])

  // Apply date range filter
  const applyDateRange = () => {
    if (startDate && endDate && onDateRangeChange) {
      onDateRangeChange(startDate, endDate)
      setShowDateRangePicker(false)
    }
  }

  // Clear date range filter
  const clearDateRange = () => {
    setStartDate("")
    setEndDate("")
    if (onDateRangeChange) {
      onDateRangeChange(null, null)
    }
    setShowDateRangePicker(false)
  }

  // Get today's date in YYYY-MM-DD format for max date
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  const handleExportSubmit = async () => {
    if (!exportStartDate || !exportEndDate) return
    setIsExporting(true)
    setExportError("")
    try {
      await exportDateRangeReport({
        type: dashboardType,
        startDate: exportStartDate,
        endDate: exportEndDate,
      })
      setShowExportModal(false)
      setExportStartDate("")
      setExportEndDate("")
    } catch (error) {
      console.error("❌ Export report failed:", error)
      setExportError("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-purple-500">Dashboard</h1>
        { (userRole === "admin" || userRole === "super_admin") && (
          <div className="flex items-center gap-3 ml-auto mr-5">
            <button
              onClick={() => setShowExportModal(true)}
              className="rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
            >
              Export Report
            </button>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">Total Users</div>
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {totalUsersCount}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile & Tablet View - Dropdowns in grid layout */}
      <div className="md:hidden">
        <div className="grid grid-cols-2 gap-2">
          {/* Date Range Filter */}
          {(userRole === "admin" || userRole === "super_admin") && (
            <div className="relative">
              <button
                onClick={() => setShowDateRangePicker(!showDateRangePicker)}
                className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm text-left bg-white"
              >
                {startDate && endDate ? `${startDate} to ${endDate}` : "Date Range"}
              </button>

              {showDateRangePicker && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-purple-200 rounded-md shadow-lg z-10 p-3 w-64">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">From Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={endDate || getTodayDate()}
                        className="w-full rounded border border-gray-300 p-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">To Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        max={getTodayDate()}
                        className="w-full rounded border border-gray-300 p-1 text-sm"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={applyDateRange}
                        disabled={!startDate || !endDate}
                        className="flex-1 bg-purple-500 text-white py-1 px-2 rounded text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Apply
                      </button>
                      <button
                        onClick={clearDateRange}
                        className="flex-1 bg-gray-500 text-white py-1 px-2 rounded text-sm"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <select
            value={dashboardType}
            onChange={(e) => setDashboardType(e.target.value)}
            className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
          >
            <option value="checklist">Checklist</option>
            <option value="delegation">Delegation</option>
          </select>

          {/* Department Filter - Only show for checklist */}
          {dashboardType === "checklist" && (userRole === "admin" || userRole === "super_admin") && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
            >
              <option value="all">All Departments</option>
              {availableDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          )}

          {/* Dashboard Staff Filter */}
          {(userRole === "admin" || userRole === "super_admin") ? (
            <select
              value={dashboardStaffFilter}
              onChange={(e) => setDashboardStaffFilter(e.target.value)}
              className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
            >
              <option value="all">All Staff Members</option>
              {availableStaff.map((staffName) => (
                <option key={staffName} value={staffName}>
                  {staffName}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={username || ""}
              disabled={true}
              className="w-full rounded-md border border-gray-300 p-2 bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
            >
              <option value={username || ""}>{username || "Current User"}</option>
            </select>
          )}
        </div>
      </div>

      {/* Desktop View - Original layout */}
      <div className="hidden md:flex items-center gap-2">
        {/* Date Range Filter */}
        {(userRole === "admin" || userRole === "super_admin") && (
          <div className="relative">
            <button
              onClick={() => setShowDateRangePicker(!showDateRangePicker)}
              className="w-[140px] sm:w-[180px] rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-left bg-white hover:bg-gray-50"
            >
              {startDate && endDate ? `${startDate} to ${endDate}` : "Date Range"}
            </button>

            {showDateRangePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-purple-200 rounded-md shadow-lg z-10 p-4 w-80">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">Select Date Range</h3>
                    {startDate && endDate && (
                      <button
                        onClick={clearDateRange}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">From Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={endDate || getTodayDate()}
                        className="w-full rounded border border-gray-300 p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">To Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        max={getTodayDate()}
                        className="w-full rounded border border-gray-300 p-2 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={applyDateRange}
                    disabled={!startDate || !endDate}
                    className="w-full bg-purple-500 text-white py-2 px-4 rounded text-sm hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Apply Date Range
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <select
          value={dashboardType}
          onChange={(e) => setDashboardType(e.target.value)}
          className="w-[110px] sm:w-[140px] rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="checklist">Checklist</option>
          <option value="delegation">Delegation</option>
        </select>

        {/* Department Filter - Only show for checklist */}
        {dashboardType === "checklist" && (userRole === "admin" || userRole === "super_admin") && (
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-[110px] sm:w-[160px] rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All Departments</option>
            {availableDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        )}

        {/* Dashboard Staff Filter */}
        {(userRole === "admin" || userRole === "super_admin") ? (
          <select
            value={dashboardStaffFilter}
            onChange={(e) => setDashboardStaffFilter(e.target.value)}
            className="w-[140px] sm:w-[180px] rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All Staff Members</option>
            {availableStaff.map((staffName) => (
              <option key={staffName} value={staffName}>
                {staffName}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={username || ""}
            disabled={true}
            className="w-[180px] rounded-md border border-gray-300 p-2 bg-gray-100 text-gray-600 cursor-not-allowed"
          >
            <option value={username || ""}>{username || "Current User"}</option>
          </select>
        )}
      </div>

      {/* Close date picker when clicking outside */}
      {showDateRangePicker && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDateRangePicker(false)}
        />
      )}

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-gray-800">
              Export {dashboardType === "checklist" ? "Checklist" : "Delegation"} Report
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Select a date range to export the user-wise summary and task-wise detail report (same format as the monthly reports).
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From Date</label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  max={exportEndDate || getTodayDate()}
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To Date</label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  min={exportStartDate}
                  max={getTodayDate()}
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                />
              </div>
            </div>

            {exportError && (
              <p className="mt-3 text-xs text-red-600">{exportError}</p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setShowExportModal(false)
                  setExportError("")
                }}
                disabled={isExporting}
                className="flex-1 rounded border border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExportSubmit}
                disabled={!exportStartDate || !exportEndDate || isExporting}
                className="flex-1 rounded bg-purple-600 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isExporting ? "Exporting..." : "Export PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}