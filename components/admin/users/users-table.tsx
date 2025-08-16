"use client"

import { useState } from "react"
import type { UserProfile } from "@/lib/services/user.service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Shield, Ban, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { updateUserStatus } from "@/lib/services/user.service"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface UsersTableProps {
  users: (UserProfile & { user_roles?: any[] })[]
  pagination: {
    page: number
    totalPages: number
    total: number
  }
}

export function UsersTable({ users, pagination }: UsersTableProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800"
      case "admin":
        return "bg-purple-100 text-purple-800"
      case "seller":
        return "bg-blue-100 text-blue-800"
      case "support":
        return "bg-orange-100 text-orange-800"
      case "customer":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleStatusUpdate = async (userId: string, newStatus: UserProfile["status"]) => {
    setLoading(userId)
    try {
      await updateUserStatus(userId, newStatus)
      toast.success(`User status updated to ${newStatus}`)
      router.refresh()
    } catch (error) {
      toast.error(`Failed to update user status: ${error}`)
    } finally {
      setLoading(null)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.avatar_url || "/placeholder.svg"}
                        alt={`${user.first_name} ${user.last_name}`}
                      />
                      <AvatarFallback>{getInitials(user.first_name, user.last_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getRoleColor(user.role)}>{user.role.replace("_", " ")}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{user.last_login_at ? formatDate(user.last_login_at) : "Never"}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{formatDate(user.created_at)}</div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading === user.id}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/users/${user.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          View Profile
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link href={`/admin/users/${user.id}/roles`}>
                          <Shield className="h-4 w-4 mr-2" />
                          Manage Roles
                        </Link>
                      </DropdownMenuItem>

                      {user.status === "active" && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(user.id, "suspended")}>
                          <Ban className="h-4 w-4 mr-2" />
                          Suspend User
                        </DropdownMenuItem>
                      )}

                      {user.status === "suspended" && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(user.id, "active")}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Activate User
                        </DropdownMenuItem>
                      )}

                      {user.status === "pending" && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(user.id, "active")}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve User
                        </DropdownMenuItem>
                      )}

                      {user.status !== "inactive" && (
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(user.id, "inactive")}
                          className="text-red-600"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Deactivate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {users.length} of {pagination.total} users
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled={pagination.page <= 1} asChild>
            <Link href={`?page=${pagination.page - 1}`}>Previous</Link>
          </Button>
          <div className="text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} asChild>
            <Link href={`?page=${pagination.page + 1}`}>Next</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
