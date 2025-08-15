import { getOrders } from "@/lib/services/order.service"
import { OrdersTable } from "@/components/admin/orders/orders-table"
import { OrderFilters } from "@/components/admin/orders/order-filters"
import { OrderStats } from "@/components/admin/orders/order-stats"

interface SearchParams {
  status?: string
  payment_status?: string
  search?: string
  page?: string
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const filters = {
    status: searchParams.status,
    payment_status: searchParams.payment_status,
    search: searchParams.search,
    page: searchParams.page ? Number.parseInt(searchParams.page) : 1,
  }

  const ordersData = await getOrders(filters)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders and fulfillment</p>
        </div>
      </div>

      <OrderStats />
      <OrderFilters />

      <OrdersTable
        orders={ordersData.orders}
        pagination={{
          page: ordersData.page,
          totalPages: ordersData.totalPages,
          total: ordersData.total,
        }}
      />
    </div>
  )
}
