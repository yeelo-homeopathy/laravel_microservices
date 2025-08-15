"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getInventoryMovements } from "@/lib/services/inventory.service"
import { formatDate } from "@/lib/utils"
import { TrendingUp, TrendingDown, RotateCcw, AlertTriangle } from "lucide-react"

export function InventoryMovements() {
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        const data = await getInventoryMovements({
          movement_type: filter === "all" ? undefined : filter,
          limit: 20,
        })
        setMovements(data.movements)
      } catch (error) {
        console.error("Failed to fetch movements:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMovements()
  }, [filter])

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "inbound":
      case "return":
      case "found":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "outbound":
      case "damage":
      case "loss":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "adjustment":
        return <RotateCcw className="h-4 w-4 text-blue-600" />
      case "transfer":
        return <RotateCcw className="h-4 w-4 text-purple-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const getMovementColor = (type: string) => {
    switch (type) {
      case "inbound":
      case "return":
      case "found":
        return "bg-green-100 text-green-800"
      case "outbound":
      case "damage":
      case "loss":
        return "bg-red-100 text-red-800"
      case "adjustment":
        return "bg-blue-100 text-blue-800"
      case "transfer":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Inventory Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Inventory Movements</CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All movements</SelectItem>
              <SelectItem value="inbound">Inbound</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
              <SelectItem value="adjustment">Adjustments</SelectItem>
              <SelectItem value="transfer">Transfers</SelectItem>
              <SelectItem value="return">Returns</SelectItem>
              <SelectItem value="damage">Damage</SelectItem>
              <SelectItem value="loss">Loss</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{movement.products?.name}</div>
                    <div className="text-sm text-muted-foreground">SKU: {movement.products?.sku}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getMovementIcon(movement.movement_type)}
                    <Badge className={getMovementColor(movement.movement_type)}>{movement.movement_type}</Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {movement.movement_type === "outbound" ||
                    movement.movement_type === "damage" ||
                    movement.movement_type === "loss"
                      ? "-"
                      : "+"}
                    {movement.quantity}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{movement.reason || "N/A"}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {movement.profiles?.first_name} {movement.profiles?.last_name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{formatDate(movement.created_at)}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {movements.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No inventory movements found</div>
        )}
      </CardContent>
    </Card>
  )
}
