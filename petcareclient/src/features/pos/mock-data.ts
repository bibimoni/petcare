export type TransactionStatus = "COMPLETED" | "CANCELLED" | "PENDING";

export type HistoryTransaction = {
  id: string;
  pet: string;
  date: string;
  time: string;
  total: string;
  numericId: number; // Thêm ID số để truyền vào Modal
  customerName: string;
  customerPhone: string;
  customerInitials: string;
  status: TransactionStatus;
};

export const historyTransactions: HistoryTransaction[] = [
  {
    id: "POS-0922",
    numericId: 922,
    customerName: "Nguyễn Văn A",
    customerPhone: "0987.654.321",
    customerInitials: "NA",
    pet: "Lu (Chó Poodle)",
    total: "637.200đ",
    date: "24/10/2023",
    time: "14:30 PM",
    status: "COMPLETED",
  },
  {
    id: "POS-0920",
    numericId: 920,
    customerName: "Khách lẻ",
    customerPhone: "0999.111.222",
    customerInitials: "KL",
    pet: "Mimi (Mèo Anh)",
    total: "350.000đ",
    date: "24/10/2023",
    time: "11:15 AM",
    status: "PENDING",
  },
  {
    id: "POS-0919",
    numericId: 919,
    customerName: "Lê Văn Tùng",
    customerPhone: "0999.888.777",
    customerInitials: "LT",
    pet: "Không có",
    total: "110.000đ",
    date: "20/10/2023",
    time: "08:45 AM",
    status: "CANCELLED",
  },
  {
    id: "POS-0918",
    numericId: 918,
    customerName: "Phạm Minh",
    customerPhone: "0345.888.111",
    customerInitials: "PM",
    pet: "Gấu (Alaska)",
    total: "2.100.000đ",
    date: "20/10/2023",
    time: "08:00 AM",
    status: "COMPLETED",
  },
];
