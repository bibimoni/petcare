export default function CustomerTabs({ tab, setTab }: any) {
  const tabs = [
    { id: "all", label: "Tất cả" },
    { id: "new", label: "Khách hàng mới" },
    { id: "high", label: "Chi tiêu cao" },
    { id: "vip", label: "⭐ VIP" },
  ];

  return (
    <div className="flex gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition
          ${tab === t.id ? "bg-black text-white" : "border hover:bg-gray-100"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
