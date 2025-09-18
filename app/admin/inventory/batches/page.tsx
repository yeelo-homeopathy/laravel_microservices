import { BatchManagement } from "@/components/admin/inventory/batch-management"
import { getBatches, createBatch, updateBatch } from "@/lib/services/batch.service"

export default async function BatchesPage() {
  const batches = await getBatches()

  return (
    <div className="container mx-auto py-6">
      <BatchManagement batches={batches} onCreateBatch={createBatch} onUpdateBatch={updateBatch} />
    </div>
  )
}
