"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useState } from "react"
import LoginPage from "./pages/LoginPage"
import AdminDashboard from "./pages/admin/Dashboard"
import AdminAssignTask from "./pages/admin/AssignTask"
import DataPage from "./pages/admin/DataPage"
import AdminDataPage from "./pages/admin/admin-data-page"
import AccountDataPage from "./pages/delegation"
import QuickTask from "./pages/QuickTask"
import AdminDelegationTask from "./pages/delegation-data"
import "./index.css"
import Demo from "./pages/user/Demo"
import Setting from "./pages/Setting"
import MisReport from "./pages/MisReport"
import HistoryPage from "./pages/admin/HistoryPage"
import TrainingVideoPage from "./pages/admin/TrainingVideoPage"
import CalendarPage from "./pages/admin/CalendarPage"
import HolidayManagementPage from "./pages/admin/HolidayManagementPage"
import RealtimeLogoutListener from "./components/RealtimeLogoutListener"   // ✅ Added listener

// Map from route path to pageKey (must match keys stored in page_access DB column)
const ROUTE_PAGE_KEYS = {
  "/dashboard/admin": "dashboard",
  "/dashboard/quick-task": "quick_task",
  "/dashboard/assign-task": "assign_task",
  "/dashboard/delegation": "delegation",
  "/dashboard/data/sales": "checklist",
  "/dashboard/history": "admin_approval",
  "/dashboard/calendar": "calendar",
  "/dashboard/holidays": "holiday_list",
  "/dashboard/setting": "settings",
  "/dashboard/training-video": "training_video",
  "/dashboard/delegation-task": "delegation_task",
};

// Auth wrapper component to protect routes
const ProtectedRoute = ({ children, allowedRoles = [], pageKey = null }) => {
  const username = localStorage.getItem("user-name")
  const userRole = localStorage.getItem("role")

  // Not logged in → redirect to login
  if (!username) {
    return <Navigate to="/login" replace />
  }

  // super_admin bypasses everything
  if (userRole === "super_admin") {
    return children
  }

  // Parse page_access JSONB: { dashboard: true, delegation: true, ... }
  let pageAccessObj = null
  try {
    const raw = localStorage.getItem("page_access")
    if (raw) pageAccessObj = JSON.parse(raw)
  } catch (_) {
    pageAccessObj = null
  }

  // If page_access is set, it is the SOLE authority for this route
  if (pageKey && pageAccessObj && Object.keys(pageAccessObj).length > 0) {
    // Dashboard is always accessible as minimum landing page
    if (pageKey !== "dashboard" && pageAccessObj[pageKey] !== true) {
      return <Navigate to="/dashboard/admin" replace />
    }
    return children
  }

  // No page_access set → fall back to role-based allowedRoles guard
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard/admin" replace />
  }

  return children
}

function App() {
  return (
    <Router>
      {/* ✅ Realtime listener inside Router so useNavigate works */}
      {/* <RealtimeLogoutListener /> */}

      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login route */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/demo" element={<Demo />} />

        {/* Dashboard redirect */}
        <Route path="/dashboard" element={<Navigate to="/dashboard/admin" replace />} />

        {/* Admin & User Dashboard route */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute pageKey="dashboard">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/quick-task"
          element={
            <ProtectedRoute allowedRoles={["admin", "super_admin", "pc role"]} pageKey="quick_task">
              <QuickTask />
            </ProtectedRoute>
          }
        />

        {/* Assign Task route - only for admin */}
        <Route
          path="/dashboard/assign-task"
          element={
            <ProtectedRoute pageKey="assign_task">
              <AdminAssignTask />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/delegation-task"
          element={
            <ProtectedRoute allowedRoles={["admin", "super_admin", "pc role"]} pageKey="delegation_task">
              <AdminDelegationTask />
            </ProtectedRoute>
          }
        />

        {/* Delegation route for user */}
        <Route
          path="/dashboard/delegation"
          element={
            <ProtectedRoute pageKey="delegation">
              <AccountDataPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/setting"
          element={
            <ProtectedRoute pageKey="settings">
              <Setting />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/mis-report"
          element={
            <ProtectedRoute>
              <MisReport />
            </ProtectedRoute>
          }
        />

        {/* Training Video page route */}
        <Route
          path="/dashboard/training-video"
          element={
            <ProtectedRoute pageKey="training_video">
              <TrainingVideoPage />
            </ProtectedRoute>
          }
        />

        {/* History page route */}
        <Route
          path="/dashboard/history"
          element={
            <ProtectedRoute pageKey="admin_approval">
              <HistoryPage />
            </ProtectedRoute>
          }
        />

        {/* Calendar page route */}
        <Route
          path="/dashboard/calendar"
          element={
            <ProtectedRoute pageKey="calendar">
              <CalendarPage />
            </ProtectedRoute>
          }
        />

        {/* Holiday Management page route */}
        <Route
          path="/dashboard/holidays"
          element={
            <ProtectedRoute pageKey="holiday_list">
              <HolidayManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Data routes */}
        <Route
          path="/dashboard/data/:category"
          element={
            <ProtectedRoute pageKey="checklist">
              <DataPage />
            </ProtectedRoute>
          }
        />

        {/* Specific route for Admin Data Page */}
        <Route
          path="/dashboard/data/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "super_admin", "pc role"]}>
              <AdminDataPage />
            </ProtectedRoute>
          }
        />

        {/* Backward compatibility redirects */}
        <Route path="/admin/*" element={<Navigate to="/dashboard/admin" replace />} />
        <Route path="/admin/dashboard" element={<Navigate to="/dashboard/admin" replace />} />
        <Route path="/admin/quick" element={<Navigate to="/dashboard/quick-task" replace />} />
        <Route path="/admin/assign-task" element={<Navigate to="/dashboard/assign-task" replace />} />
        <Route path="/admin/delegation-task" element={<Navigate to="/dashboard/delegation-task" replace />} />
        <Route path="/admin/mis-report" element={<Navigate to="/dashboard/mis-report" replace />} />
        <Route path="/admin/data/:category" element={<Navigate to="/dashboard/data/:category" replace />} />
        <Route path="/user/*" element={<Navigate to="/dashboard/admin" replace />} />
      </Routes>
    </Router>
  )
}

export default App
