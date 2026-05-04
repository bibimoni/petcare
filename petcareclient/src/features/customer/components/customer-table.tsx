import type { CustomerListItem } from "../api/customer-api";

import CustomerRow from "./customer-row";

type CustomerTableProps = {
  customers: CustomerListItem[];
  onEditCustomer: (customer: CustomerListItem) => void;
};

export default function CustomerTable({
  customers,
  onEditCustomer,
}: CustomerTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="p-4 text-left">Khách hàng</th>
            <th className="p-4 text-left">SĐT</th>
            <th className="p-4 text-center">Thú cưng</th>
            {/* <th className="p-4 text-left">Chi tiêu</th> */}
            <th className="p-4 text-left">Lần mua gần nhất</th>
            <th className="p-4 text-right">Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((c, index) => (
            <CustomerRow
              key={String(c.customer_id ?? c.id ?? index)}
              c={c}
              onEditCustomer={onEditCustomer}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
