"use client";

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CheckSquare,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  Database,
  ChevronDown,
  ChevronRight,
  Zap,
  Settings,
  CirclePlus,
  UserRound,
  CalendarCheck,
  BookmarkCheck,
  CrossIcon,
  X,
  History,
  Video,
  Calendar,
} from "lucide-react";

export default function AdminLayout({ children, darkMode, toggleDarkMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDataSubmenuOpen, setIsDataSubmenuOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  // Store page_access in state so sidebar re-renders reactively
  const [pageAccessObj, setPageAccessObj] = useState(null);

  const [isUserPopupOpen, setIsUserPopupOpen] = useState(false);

  // Check authentication and load fresh page_access from DB on every mount/reload
  useEffect(() => {
    const storedUsername = localStorage.getItem("user-name");
    const storedRole = localStorage.getItem("role");
    const storedEmail = localStorage.getItem("email_id");

    if (!storedUsername) {
      navigate("/login");
      return;
    }

    setUsername(storedUsername);
    setUserRole(storedRole || "user");
    setUserEmail(storedEmail);
    setIsSuperAdmin(storedUsername === "admin");

    // Fetch fresh page_access from DB (not just localStorage)
    // so admin-side changes take effect on user's next reload
    const fetchPageAccess = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/settings/users/${encodeURIComponent(storedUsername)}/page-access`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.page_access && typeof data.page_access === "object") {
            localStorage.setItem("page_access", JSON.stringify(data.page_access));
            setPageAccessObj(data.page_access);
          } else {
            localStorage.removeItem("page_access");
            setPageAccessObj(null);
          }
        }
      } catch (err) {
        // On network error, fall back to cached localStorage value
        const raw = localStorage.getItem("page_access");
        if (raw) {
          try { setPageAccessObj(JSON.parse(raw)); } catch (_) { setPageAccessObj(null); }
        }
      }
    };

    fetchPageAccess();
  }, [navigate]);

  // Re-read page_access when Settings updates the current user's permissions
  useEffect(() => {
    const handlePageAccessUpdate = () => {
      const raw = localStorage.getItem("page_access");
      if (raw) {
        try {
          setPageAccessObj(JSON.parse(raw));
        } catch (_) {
          setPageAccessObj(null);
        }
      } else {
        setPageAccessObj(null);
      }
    };

    window.addEventListener("page_access_updated", handlePageAccessUpdate);
    return () => {
      window.removeEventListener("page_access_updated", handlePageAccessUpdate);
    };
  }, []);

  // Handle logout — clear all auth data including page_access
  const handleLogout = () => {
    localStorage.removeItem("user-name");
    localStorage.removeItem("role");
    localStorage.removeItem("email_id");
    localStorage.removeItem("token");
    localStorage.removeItem("page_access");
    window.location.href = "/login";
  };

  // Filter dataCategories based on user role
  const dataCategories = [
    { id: "sales", name: "Checklist", link: "/dashboard/data/sales" },
  ];

  // All navigable pages — pageKey must match keys used in page_access DB column
  const routes = [
    {
      href: "/dashboard/admin",
      label: "Dashboard",
      icon: Database,
      active: location.pathname === "/dashboard/admin",
      showFor: ["admin", "user", "super_admin", "pc role"],
      pageKey: "dashboard",
    },
    {
      href: "/dashboard/quick-task",
      label: "Quick Task",
      icon: Zap,
      active: location.pathname === "/dashboard/quick-task",
      showFor: ["admin", "super_admin", "pc role"],
      pageKey: "quick_task",
    },
    {
      href: "/dashboard/assign-task",
      label: "Assign Task",
      icon: CheckSquare,
      active: location.pathname === "/dashboard/assign-task",
      showFor: ["admin", "super_admin", "pc role"],
      pageKey: "assign_task",
    },
    {
      href: "/dashboard/delegation",
      label: "Delegation",
      icon: ClipboardList,
      active: location.pathname === "/dashboard/delegation",
      showFor: ["admin", "user", "super_admin", "pc role"],
      pageKey: "delegation",
    },
    {
      href: "/dashboard/data/sales",
      label: "Checklist",
      icon: CalendarCheck,
      active: location.pathname === "/dashboard/data/sales",
      showFor: ["admin", "user", "super_admin", "pc role"],
      pageKey: "checklist",
    },
    {
      href: "/dashboard/history",
      label: "Admin Approval",
      icon: History,
      active: location.pathname === "/dashboard/history",
      showFor: ["admin", "super_admin", "pc role"],
      pageKey: "admin_approval",
    },
    {
      href: "/dashboard/calendar",
      label: "Calendar",
      icon: Calendar,
      active: location.pathname === "/dashboard/calendar",
      showFor: ["admin", "user", "super_admin", "pc role"],
      pageKey: "calendar",
    },
    {
      href: "/dashboard/holidays",
      label: "Holiday List",
      icon: CalendarCheck,
      active: location.pathname === "/dashboard/holidays",
      showFor: ["admin", "super_admin", "pc role"],
      pageKey: "holiday_list",
    },
    {
      href: "/dashboard/setting",
      label: "Settings",
      icon: Settings,
      active: location.pathname.includes("/dashboard/setting"),
      showFor: ["admin", "super_admin", "pc role"],
      pageKey: "settings",
    },
    {
      href: "/dashboard/training-video",
      label: "Training Video",
      icon: Video,
      active: location.pathname === "/dashboard/training-video",
      showFor: ["admin", "user", "super_admin", "pc role"],
      pageKey: "training_video",
    },
    {
      href: "/dashboard/delegation-task",
      label: "Delegation Task",
      icon: ClipboardList,
      active: location.pathname === "/dashboard/delegation-task",
      showFor: ["admin", "super_admin", "pc role"],
      pageKey: "delegation_task",
    },
  ];

  const getAccessibleDepartments = () => {
    return dataCategories.filter(
      (cat) => !cat.showFor || cat.showFor.includes(userRole)
    );
  };

  // Derive accessible routes from React state (not localStorage) so sidebar re-renders reactively
  const getAccessibleRoutes = () => {
    // super_admin sees everything
    if (userRole === "super_admin") {
      return routes;
    }

    // If page_access JSONB is set, it is the authority — show exactly those pages
    // (page_access overrides showFor so admins can grant any page to any user)
    if (pageAccessObj && Object.keys(pageAccessObj).length > 0) {
      return routes.filter(
        (route) =>
          // Dashboard always visible as minimum
          route.pageKey === "dashboard" || pageAccessObj[route.pageKey] === true
      );
    }

    // Fallback: role-based showFor (backward-compatible for users with no page_access set)
    return routes.filter((route) => route.showFor.includes(userRole));
  };

  // Check if the current path is a data category page
  const isDataPage = location.pathname.includes("/dashboard/data/");

  // If it's a data page, expand the submenu by default
  useEffect(() => {
    if (isDataPage && !isDataSubmenuOpen) {
      setIsDataSubmenuOpen(true);
    }
  }, [isDataPage, isDataSubmenuOpen]);

  // Get accessible routes and departments
  const accessibleRoutes = getAccessibleRoutes();
  const accessibleDepartments = getAccessibleDepartments();

  return (
    <div
      className={`flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50`}
    >
      {/* Sidebar for desktop */}
      <aside className="hidden w-56 flex-shrink-0 border-r border-blue-200 bg-white md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-blue-200 px-4 bg-gradient-to-r from-blue-100 to-purple-100">
          <Link
            to="/dashboard/admin"
            className="flex items-center gap-2 font-semibold text-blue-700"
          >
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <span>Checklist & Delegation </span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 slim-scrollbar">
          <ul className="space-y-1">
            {accessibleRoutes.map((route) => (
              <li key={route.label}>
                <Link
                  to={route.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${route.active
                    ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                    : "text-gray-700 hover:bg-blue-50"
                    }`}
                >
                  <route.icon
                    className={`h-4 w-4 ${route.active ? "text-blue-600" : ""
                      }`}
                  />
                  {route.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-blue-200 p-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex flex-col">
            {/* User info section */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="h-8 w-8 shrink-0 rounded-full gradient-bg flex items-center justify-center">
                  <span className="text-sm font-medium text-black">
                    {username ? username.charAt(0).toUpperCase() : "U"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-blue-700 truncate">
                    {username || "User"}{" "}
                    {userRole === "super_admin"
                      ? "(Super Admin)"
                      : userRole === "admin"
                      ? "(Admin)"
                      : userRole === "pc role"
                      ? "(PC Role)"
                      : ""}
                  </p>
                  <p className="text-xs text-blue-600 break-all">
                    {userEmail || "user@example.com"}
                  </p>
                </div>
              </div>

              {/* Dark mode toggle (if available) */}
              {toggleDarkMode && (
                <button
                  onClick={toggleDarkMode}
                  className="text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
                >
                  {darkMode ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                  )}
                  <span className="sr-only">
                    {darkMode ? "Light mode" : "Dark mode"}
                  </span>
                </button>
              )}
            </div>

            {/* Logout button positioned below user info */}
            <div className="mt-2 flex justify-center">
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-blue-700 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-100 text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-100 flex justify-center">
              <a
                href="https://www.botivate.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 group"
              >
                <span className="text-[10px] text-gray-500 group-hover:text-blue-600 transition-colors">Powered by</span>
                <span className="text-[11px] font-bold text-blue-600 group-hover:text-blue-700 transition-colors">BOTIVATE</span>
              </a>
            </div>
          </div>
      </aside>

      {/* Mobile menu button and sidebar - similar structure as desktop but with mobile classes */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden absolute left-4 top-3 z-50 text-blue-700 p-2 rounded-md hover:bg-blue-100"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </button>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <div className="flex h-14 items-center border-b border-blue-200 px-4 bg-gradient-to-r from-blue-100 to-purple-100">
              <Link
                to="/dashboard/admin"
                className="flex items-center gap-2 font-semibold text-blue-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ClipboardList className="h-5 w-5 text-blue-600" />
                <span>Checklist & Delegation</span>
              </Link>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 bg-white">
              <ul className="space-y-1">
                {accessibleRoutes.map((route) => (
                  <li key={route.label}>
                    <Link
                      to={route.href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${route.active
                        ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                        : "text-gray-700 hover:bg-blue-50"
                        }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <route.icon
                        className={`h-4 w-4 ${route.active ? "text-blue-600" : ""
                          }`}
                      />
                      {route.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-blue-200 p-4 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center">
                    <span className="text-sm font-medium text-black">
                      {username ? username.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      {username || "User"}{" "}
                      {userRole === "super_admin"
                        ? "(Super Admin)"
                        : userRole === "admin"
                        ? "(Admin)"
                        : ""}
                    </p>
                    <p className="text-xs text-blue-600">
                      {userEmail || "user@example.com"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {toggleDarkMode && (
                    <button
                      onClick={toggleDarkMode}
                      className="text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
                    >
                      {darkMode ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20.354 15.354A9 9 0 018.646 3.646A9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                          />
                        </svg>
                      )}
                      <span className="sr-only">
                        {darkMode ? "Light mode" : "Dark mode"}
                      </span>
                    </button>
                  )}
                  
                </div>
              </div>
               <div className="mt-2 flex justify-center">
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-blue-700 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-100 text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-100 flex justify-center">
              <a
                href="https://www.botivate.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 group"
              >
                <span className="text-[10px] text-gray-500 group-hover:text-blue-600 transition-colors">Powered by</span>
                <span className="text-[11px] font-bold text-blue-600 group-hover:text-blue-700 transition-colors">BOTIVATE</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-12 md:h-14 items-center justify-between border-b border-blue-200 bg-white px-3 md:px-6">
          <div className="flex md:hidden w-6"></div>
          <h1 className="text-sm md:text-lg font-semibold text-blue-700">
            Checklist & Delegation
          </h1>
          <div className="flex items-center">
            <img
              src="/shrishyam.png"
              alt="Company Logo"
              className="h-7 w-auto md:h-10 lg:h-12 transition-all duration-300"
            />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          {children}

          {/* Clean Minimal Footer Navigation */}
          <div className="fixed md:left-56 left-0 right-0 bottom-0 z-10">
            {/* Mobile Bottom Navigation */}
            <div className="sm:hidden">
              {/* Navigation Bar */}
              <div className="flex justify-around items-center px-4 py-2 bg-white border-t border-gray-200 shadow-lg">
                {/* Home */}
                <Link
                  to="/dashboard/admin"
                  className={`flex flex-col items-center p-1.5 rounded-lg transition-all ${
                    location.pathname === '/dashboard/admin'
                      ? 'text-purple-600'
                      : 'text-gray-500 hover:text-purple-500'
                  }`}
                >
                  <Home size={20} strokeWidth={location.pathname === '/dashboard/admin' ? 2.5 : 2} />
                  <span className="text-[9px] mt-0.5 font-medium">Home</span>
                </Link>

                {/* Checklist */}
                <Link
                  to="/dashboard/data/sales"
                  className={`flex flex-col items-center p-1.5 rounded-lg transition-all ${
                    location.pathname === '/dashboard/data/sales'
                      ? 'text-purple-600'
                      : 'text-gray-500 hover:text-purple-500'
                  }`}
                >
                  <CalendarCheck size={20} strokeWidth={location.pathname === '/dashboard/data/sales' ? 2.5 : 2} />
                  <span className="text-[9px] mt-0.5 font-medium">Checklist</span>
                </Link>

                {/* Add Task - Floating Button */}
                <Link
                  to="/dashboard/assign-task"
                  className="relative -mt-6"
                >
                  <div className={`p-3 rounded-full shadow-lg gradient-bg transition-transform hover:scale-105 ${
                    location.pathname === '/dashboard/assign-task' ? 'scale-110 ring-2 ring-purple-300' : ''
                  }`}>
                    <CirclePlus size={22} className="text-white" strokeWidth={2} />
                  </div>
                </Link>

                {/* Tasks */}
                <Link
                  to="/dashboard/delegation"
                  className={`flex flex-col items-center p-1.5 rounded-lg transition-all ${
                    location.pathname === '/dashboard/delegation'
                      ? 'text-purple-600'
                      : 'text-gray-500 hover:text-purple-500'
                  }`}
                >
                  <BookmarkCheck size={20} strokeWidth={location.pathname === '/dashboard/delegation' ? 2.5 : 2} />
                  <span className="text-[9px] mt-0.5 font-medium">Tasks</span>
                </Link>

                {/* Profile */}
                <div
                  onClick={() => setIsUserPopupOpen(true)}
                  className="flex flex-col items-center p-1.5 rounded-lg cursor-pointer text-gray-500 hover:text-purple-500 transition-all"
                >
                  <UserRound size={20} strokeWidth={2} />
                  <span className="text-[9px] mt-0.5 font-medium">Profile</span>
                </div>
              </div>

              {/* Powered by Botivate - Compact */}
              <a
                href="https://www.botivate.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 py-1 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <span className="text-[8px] text-gray-500">Powered by</span>
                <span className="text-[9px] font-bold text-purple-600">BOTIVATE</span>
              </a>
            </div>

          </div>
        </main>

        {/* User Popup */}
        {isUserPopupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
              {/* <div onClick={() => setIsUserPopupOpen(false)}  className="flex justify-end"><X size={25}/></div> */}

              <div className="flex flex-col items-center justify-between">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-20 w-20 rounded-full gradient-bg flex items-center justify-center">
                    <span className="text-3xl font-medium text-white">
                      {username ? username.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      {username || "User"}{" "}
                      {userRole === "super_admin"
                        ? "(Super Admin)"
                        : userRole === "admin"
                        ? "(Admin)"
                        : ""}
                    </p>
                    <p className="text-xs text-blue-600">
                      {userEmail || "user@example.com"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center  justify-around w-full gap-2 mt-4">
                  <button
                    onClick={() => setIsUserPopupOpen(false)}
                    className="outline p-1 rounded-md px-2"
                  >
                    <span className="flex justify-center items-center">
                      Cancel
                    </span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="bg-blue-700 text-white hover:bg-blue-900 p-1 rounded-md px-2"
                  >
                    <span className="flex justify-center items-center">
                      Log out <LogOut className="h-4 w-4" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
