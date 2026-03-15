import CustomerRow from "./customer-row"

export default function CustomerTable({ customers }: any) {

  return (
    <div className="bg-white rounded-2xl shadow border overflow-hidden">

      <table className="w-full text-sm">

        <thead>
          <tr>
            <th className="p-4 text-left">Khách hàng</th>
            <th className="p-4 text-left">SĐT</th>
            <th className="p-4 text-center">Thú cưng</th>
            <th className="p-4 text-left">Chi tiêu</th>
            <th className="p-4 text-left">Lần mua gần nhất</th>
            <th className="p-4 text-right">Thao tác</th>
          </tr>
        </thead>

        <tbody>

          {customers.map((c: any) => (
            <CustomerRow key={c.id} c={c} />
          ))}

        </tbody>

      </table>
      

    </div>
  )
}