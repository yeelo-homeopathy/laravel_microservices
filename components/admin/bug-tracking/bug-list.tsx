"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { AlertCircle, Bug, Zap, AlertTriangle, Clock, CheckCircle, XCircle, User } from "lucide-react"

interface BugReport {
  id: string
  title: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  status: "open" | "in-progress" | "resolved" | "closed"
  reporter: string
  assignee?: string
  createdAt: string
  updatedAt: string
}

// Mock data
const mockBugs: BugReport[] = [
  {
    id: "bug-1",
    title: "Login form validation not working",
    description: "Email validation fails for valid email addresses",
    severity: "high",
    status: "open",
    reporter: "John Doe",
    assignee: "Jane Smith",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "bug-2",
    title: "Product images not loading",
    description: "Images fail to load on product detail pages",
    severity: "medium",
    status: "in-progress",
    reporter: "Alice Johnson",
    assignee: "Bob Wilson",
    createdAt: "2024-01-14T14:20:00Z",
    updatedAt: "2024-01-15T09:15:00Z",
  },
  {
    id: "bug-3",
    title: "Cart total calculation incorrect",
    description: "Tax calculation shows wrong amount",
    severity: "critical",
    status: "resolved",
    reporter: "Mike Brown",
    assignee: "Sarah Davis",
    createdAt: "2024-01-13T16:45:00Z",
    updatedAt: "2024-01-14T11:30:00Z",
  },
]

export function BugList() {
  const [bugs, setBugs] = useState<BugReport[]>(mockBugs)
  const [filter, setFilter] = useState({
    status: "all",
    severity: "all",
    search: "",
  })

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "medium":
        return <Bug className="h-4 w-4 text-yellow-500" />
      case "low":
        return <Zap className="h-4 w-4 text-blue-500" />
      default:
        return <Bug className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "closed":
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Bug className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800 border-red-200"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const filteredBugs = bugs.filter((bug) => {
    const matchesStatus = filter.status === "all" || bug.status === filter.status
    const matchesSeverity = filter.severity === "all" || bug.severity === filter.severity
    const matchesSearch =
      filter.search === "" ||
      bug.title.toLowerCase().includes(filter.search.toLowerCase()) ||
      bug.description.toLowerCase().includes(filter.search.toLowerCase())

    return matchesStatus && matchesSeverity && matchesSearch
  })

  const updateBugStatus = (bugId: string, newStatus: BugReport["status"]) => {
    setBugs(
      bugs.map((bug) => (bug.id === bugId ? { ...bug, status: newStatus, updatedAt: new Date().toISOString() } : bug)),
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bug Tracking Dashboard</CardTitle>
          <CardDescription>Manage and track bug reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search bugs..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="md:w-1/3"
            />
            <Select value={filter.status} onValueChange={(value) => setFilter({ ...filter, status: value })}>
              <SelectTrigger className="md:w-1/4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filter.severity} onValueChange={(value) => setFilter({ ...filter, severity: value })}>
              <SelectTrigger className="md:w-1/4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bug List */}
      <div className="space-y-4">
        {filteredBugs.map((bug) => (
          <Card key={bug.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{bug.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(bug.severity)}>
                      {getSeverityIcon(bug.severity)}
                      <span className="ml-1 capitalize">{bug.severity}</span>
                    </Badge>
                    <Badge className={getStatusColor(bug.status)}>
                      {getStatusIcon(bug.status)}
                      <span className="ml-1 capitalize">{bug.status.replace("-", " ")}</span>
                    </Badge>
                  </div>
                </div>
                <Select
                  value={bug.status}
                  onValueChange={(value: BugReport["status"]) => updateBugStatus(bug.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{bug.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Reporter: {bug.reporter}
                  </span>
                  {bug.assignee && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Assignee: {bug.assignee}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span>Created: {new Date(bug.createdAt).toLocaleDateString()}</span>
                  <span>Updated: {new Date(bug.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBugs.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Bug className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No bugs found matching your criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
