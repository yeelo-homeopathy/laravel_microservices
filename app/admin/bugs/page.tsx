import { BugList } from "@/components/admin/bug-tracking/bug-list"
import { BugReportForm } from "@/components/admin/bug-tracking/bug-report-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function BugsPage() {
  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Bug List</TabsTrigger>
          <TabsTrigger value="report">Report Bug</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-6">
          <BugList />
        </TabsContent>
        <TabsContent value="report" className="mt-6">
          <BugReportForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
