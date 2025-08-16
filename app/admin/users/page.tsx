import { getUsers, getRoles } from "@/lib/services/user.service"
import { UsersTable } from "@/components/admin/users/users-table"
import { UserFilters } from "@/components/admin/users/user-filters"
import { UserStats } from "@/components/admin/users/user-stats"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface SearchParams {
  role?: string
  status?: string
  search?: string
  page?: string
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const filters = {
    role: searchParams.role,
    status: searchParams.status,
    search: searchParams.search,
    page: searchParams.page ? Number.parseInt(searchParams.page) : 1,
  }

  const [usersData, roles] = await Promise.all([getUsers(filters), getRoles()])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Link href="/admin/users/invite">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </Link>
      </div>

      <UserStats />
      <UserFilters roles={roles} />

      <UsersTable
        users={usersData.users}
        pagination={{
          page: usersData.page,
          totalPages: usersData.totalPages,
          total: usersData.total,
        }}
      />
    </div>
  )
}
