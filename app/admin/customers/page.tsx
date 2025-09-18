import { CustomerManagement } from "@/components/admin/customers/customer-management"
import {
  getCustomers,
  getCustomerTypes,
  createCustomer,
  updateCustomer,
  updateCreditLimit,
} from "@/lib/services/customer.service"

export default async function CustomersPage() {
  const [customers, customerTypes] = await Promise.all([getCustomers(), getCustomerTypes()])

  return (
    <div className="container mx-auto py-6">
      <CustomerManagement
        customers={customers}
        customerTypes={customerTypes}
        onCreateCustomer={createCustomer}
        onUpdateCustomer={updateCustomer}
        onUpdateCreditLimit={updateCreditLimit}
      />
    </div>
  )
}
