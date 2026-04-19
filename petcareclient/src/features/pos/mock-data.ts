export type HistoryTransaction = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerInitials: string;
  pet: string;
  total: string;
  date: string;
  time: string;
  status: string;
};

export const historyTransactions: HistoryTransaction[] = [
  {
    id: "#HD-2023-9841",
    customerName: "Nguyễn Văn An",
    customerPhone: "0908 123 456",
    customerInitials: "AN",
    pet: "Milo (Corgi)",
    total: "1.250.000đ",
    date: "24/10/2023",
    time: "14:30 PM",
    status: "ĐÃ THANH TOÁN",
  },
  {
    id: "#HD-2023-9842",
    customerName: "Lê Thị Tuyết",
    customerPhone: "0976 555 999",
    customerInitials: "LT",
    pet: "Luna (Mèo Anh)",
    total: "450.000đ",
    date: "24/10/2023",
    time: "11:15 AM",
    status: "ĐÃ THANH TOÁN",
  },
  {
    id: "#HD-2023-9843",
    customerName: "Phạm Minh",
    customerPhone: "0345 888 111",
    customerInitials: "PM",
    pet: "Gấu (Alaska)",
    total: "2.100.000đ",
    date: "23/10/2023",
    time: "17:45 PM",
    status: "ĐÃ THANH TOÁN",
  },
  {
    id: "#HD-2023-9844",
    customerName: "Kim Hoa",
    customerPhone: "0912 000 777",
    customerInitials: "KH",
    pet: "Bông (Poodle)",
    total: "890.000đ",
    date: "23/10/2023",
    time: "09:20 AM",
    status: "ĐÃ THANH TOÁN",
  },
];
