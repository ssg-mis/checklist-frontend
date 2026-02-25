"use client"
import { useState, useEffect } from "react"
import { Play, Video } from "lucide-react"
import AdminLayout from "../../components/layout/AdminLayout"

function TrainingVideoPage() {
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")

  useEffect(() => {
    const role = localStorage.getItem("role")
    const user = localStorage.getItem("user-name")
    setUserRole(role || "")
    setUsername(user || "")
  }, [])

  // Video URLs for different roles
  const videoConfig = {
    admin: {
      title: "Admin Training Video",
      description: "Complete guide for administrators on how to manage tasks, users, and the system.",
      url: "https://www.youtube.com/embed/0kL9aXvXE-A",
    },
    user: {
      title: "User Training Video", 
      description: "Learn how to use the checklist and delegation system effectively.",
      url: "https://www.youtube.com/embed/YxEfdVlax8Y",
    }
  }

  // Get video based on role - admin and super_admin see admin video, user sees user video
  const currentVideo = (userRole === "admin" || userRole === "super_admin") ? videoConfig.admin : videoConfig.user

  return (
    <AdminLayout>
      <div className="space-y-6 p-2 sm:p-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-purple-700 flex items-center gap-2">
            <Video className="h-6 w-6" />
            Training Videos
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Watch the training video to learn how to use the system
          </p>
        </div>

        {/* Video Section - Shows only one video based on role */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 border-b border-purple-100">
            <h2 className="text-lg font-semibold text-purple-700 flex items-center gap-2">
              <Play className="h-5 w-5" />
              {currentVideo.title}
            </h2>
            <p className="text-purple-600 text-sm mt-1">
              {currentVideo.description}
            </p>
          </div>
          
          <div className="p-4">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src={currentVideo.url}
                title={currentVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-purple-700 mb-3">Quick Tips</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-purple-500">•</span>
              Watch the video in full screen for better visibility
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500">•</span>
              Enable subtitles if available for better understanding
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500">•</span>
              Contact your administrator if you have any questions
            </li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  )
}

export default TrainingVideoPage
