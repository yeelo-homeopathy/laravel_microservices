"use client"

import type React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import AdminLayout from "@/components/Layout/AdminLayout"
import Dashboard from "@/pages/Dashboard"
import UserManagement from "@/pages/Users/UserManagement"
import Login from "@/pages/Auth/Login"
import { Loader2 } from "lucide-react"

const AppRouter: React.FC = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/admin" replace />} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={user ? <AdminLayout /> : <Navigate to="/login" replace />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          {/* Add more admin routes here */}
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to={user ? "/admin" : "/login"} replace />} />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
