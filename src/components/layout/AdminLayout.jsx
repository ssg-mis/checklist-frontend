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

  const [isUserPopupOpen, setIsUserPopupOpen] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const storedUsername = localStorage.getItem("user-name");
    const storedRole = localStorage.getItem("role");
    const storedEmail = localStorage.getItem("email_id");

    if (!storedUsername) {
      // Redirect to login if not authenticated
      navigate("/login");
      return;
    }

    setUsername(storedUsername);
    setUserRole(storedRole || "user");
    setUserEmail(storedEmail);

    // Check if this is the super admin (username = 'admin')
    setIsSuperAdmin(storedUsername === "admin");
  }, [navigate]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user-name");
    localStorage.removeItem("role");
    localStorage.removeItem("email_id");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Filter dataCategories based on user role
  const dataCategories = [
    { id: "sales", name: "Checklist", link: "/dashboard/data/sales" },
  ];

  // Update the routes array based on user role and super admin status
  const routes = [
    {
      href: "/dashboard/admin",
      label: "Dashboard",
      icon: Database,
      active: location.pathname === "/dashboard/admin",
      showFor: ["admin", "user"],
    },
    {
      href: "/dashboard/quick-task",
      label: "Quick Task",
      icon: Zap,
      active: location.pathname === "/dashboard/quick-task",
      // Only show for super admin (username = 'admin')
      showFor: isSuperAdmin ? ["admin"] : [],
    },
    {
      href: "/dashboard/assign-task",
      label: "Assign Task",
      icon: CheckSquare,
      active: location.pathname === "/dashboard/assign-task",
      showFor: ["admin"],
    },
    {
      href: "/dashboard/delegation",
      label: "Delegation",
      icon: ClipboardList,
      active: location.pathname === "/dashboard/delegation",
      showFor: ["admin", "user"],
    },
    {
      href: "/dashboard/data/sales",
      label: "Checklist",
      icon: CalendarCheck,
      active: location.pathname === "/dashboard/data/sales",
      showFor: ["admin", "user"],
    },
    {
      href: "/dashboard/history",
      label: "Admin Approval",
      icon: History,
      active: location.pathname === "/dashboard/history",
      showFor: ["admin", "user"],
    },
    // {
    //   href: "/dashboard/mis-report",
    //   label: "MIS Report",
    //   icon: CheckSquare,
    //   active: location.pathname.includes("/dashboard/mis-report"),
    //   // Only show for super admin (username = 'admin')
    //   showFor: isSuperAdmin ? ["admin"] : [],
    // },
    {
      href: "/dashboard/setting",
      label: "Settings",
      icon: Settings,
      active: location.pathname.includes("/dashboard/setting"),
      // Only show for super admin (username = 'admin')
      showFor: isSuperAdmin ? ["admin"] : [],
    },
    {
      href: "/dashboard/training-video",
      label: "Training Video",
      icon: Video,
      active: location.pathname === "/dashboard/training-video",
      showFor: ["admin", "user"],
    },
  ];

  const getAccessibleDepartments = () => {
    const userRole = localStorage.getItem("role") || "user";
    return dataCategories.filter(
      (cat) => !cat.showFor || cat.showFor.includes(userRole)
    );
  };

  // Filter routes based on user role and super admin status
  const getAccessibleRoutes = () => {
    const userRole = localStorage.getItem("role") || "user";
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
      <aside className="hidden w-64 flex-shrink-0 border-r border-blue-200 bg-white md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-blue-200 px-4 bg-gradient-to-r from-blue-100 to-purple-100">
          <Link
            to="/dashboard/admin"
            className="flex items-center gap-2 font-semibold text-blue-700"
          >
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <span>Checklist & Delegation </span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center">
                  <span className="text-sm font-medium text-black">
                    {username ? username.charAt(0).toUpperCase() : "U"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-blue-700 truncate">
                    {username || "User"}{" "}
                    {userRole === "admin"
                      ? isSuperAdmin
                        ? "(Super Admin)"
                        : "(Admin)"
                      : ""}
                  </p>
                  <p className="text-xs text-blue-600 truncate">
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
                      {userRole === "admin"
                        ? isSuperAdmin
                          ? "(Super Admin)"
                          : "(Admin)"
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
          <div className="fixed md:left-64 left-0 right-0 bottom-0 z-10">
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

            {/* Desktop Footer */}
            <a
              href="https://www.botivate.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center justify-center gap-2 py-1.5 gradient-bg hover:opacity-95 transition-opacity"
            >
              <span className="text-xs text-white/80">Powered by</span>
              <span className="font-bold text-white text-xs tracking-wide">BOTIVATE</span>
              <svg className="w-3 h-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
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
                      {userRole === "admin"
                        ? isSuperAdmin
                          ? "(Super Admin)"
                          : "(Admin)"
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
