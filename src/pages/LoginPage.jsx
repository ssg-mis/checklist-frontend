"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { loginUser } from "../redux/slice/loginSlice"
import { LoginCredentialsApi } from "../redux/api/loginApi"

const LoginPage = () => {
  const navigate = useNavigate()
  const { isLoggedIn, userData, error } = useSelector((state) => state.login);
  const dispatch = useDispatch();

  const [isDataLoading, setIsDataLoading] = useState(false)
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [masterData, setMasterData] = useState({
    userCredentials: {},
    userRoles: {}
  })
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [toast, setToast] = useState({ show: false, message: "", type: "" })

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoginLoading(true);
    dispatch(loginUser(formData));
  };

  useEffect(() => {
    if (isLoggedIn && userData) {
      console.log("User Data received:", userData);

      localStorage.setItem('user-name', userData.user_name || userData.username || "");
      localStorage.setItem('role', userData.role || "");
      localStorage.setItem('email_id', userData.email_id || userData.email || "");

      console.log("Stored email:", userData.email_id || userData.email);

      navigate("/dashboard/admin")
    } else if (error) {
      showToast(error, "error");
      setIsLoginLoading(false);
    }
  }, [isLoggedIn, userData, error, navigate]);

  useEffect(() => {
    let subscription;

    const checkUserStatus = async () => {
      const username = localStorage.getItem('user-name');

      if (!username) return;

      // Subscribe to Supabase for real-time user status updates
      subscription = supabase
        .channel('user-status-watch')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `user_name=eq.${username}`,
          },
          (payload) => {
            const updatedUser = payload.new;
            if (updatedUser.status !== 'active') {
              localStorage.clear();
              setToast({ show: true, message: "Your account has been deactivated.", type: "error" });
              setTimeout(() => {
                navigate("/login");
              }, 2000);
            }
          }
        )
        .subscribe();
    };

    checkUserStatus();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" })
    }, 5000)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md shadow-lg border border-blue-200 rounded-lg bg-white">
        <div className="space-y-1 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-t-lg">
          <img
            src="/shrishyam.png"
            alt="Shri Shyam Logo"
            className="h-16 w-auto mx-auto"
          />
          <h2 className="text-2xl font-bold text-blue-700 p-2 text-center">Checklist & Delegation</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="flex items-center text-blue-700">
              <i className="fas fa-user h-4 w-4 mr-2"></i>
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="flex items-center text-blue-700">
              <i className="fas fa-key h-4 w-4 mr-2"></i>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 -mx-4 -mb-4 mt-4 rounded-b-lg">
            <button
              type="submit"
              className="w-full py-2 px-4 gradient-bg text-white rounded-md font-medium gradient-bg:hover disabled:opacity-50"
              disabled={isLoginLoading || isDataLoading}
            >
              {isLoginLoading ? "Logging in..." : isDataLoading ? "Loading..." : "Login"}
            </button>
          </div>
        </form>

        {/* Powered by Botivate Branding */}
        <div className="fixed left-0 right-0 bottom-0 py-2 px-4 text-center shadow-lg z-10 gradient-bg">
          <a
            href="https://www.botivate.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
            style={{ textDecoration: 'none' }}
          >
            <span className="text-white/85 text-sm">Powered by</span>
            <span className="font-bold text-white text-base tracking-wide drop-shadow-sm">
              BOTIVATE
            </span>
            <svg 
              className="w-3.5 h-3.5 text-white/80" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${toast.type === "success"
          ? "bg-green-100 text-green-800 border-l-4 border-green-500"
          : "bg-red-100 text-red-800 border-l-4 border-red-500"
          }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default LoginPage
