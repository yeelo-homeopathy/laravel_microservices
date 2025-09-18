import { ExpiryAlerts } from "@/components/admin/inventory/expiry-alerts"
import { getExpiryAlerts, dismissAlert, createDiscountOffer } from "@/lib/services/batch.service"

export default async function ExpiryAlertsPage() {
  const alerts = await getExpiryAlerts()

  return (
    <div className="container mx-auto py-6">
      <ExpiryAlerts alerts={alerts} onDismissAlert={dismissAlert} onCreateDiscountOffer={createDiscountOffer} />
    </div>
  )
}
