export default function CustomerPagination({ page, setPage, totalPages }: any) {
  return (
    <div className="flex justify-end items-center gap-2 mt-4">
      <button
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
        className="px-3 py-1 border rounded disabled:opacity-40"
      >
        ←
      </button>

      {[...Array(totalPages)].map((_, i) => (
        <button
          key={i}
          onClick={() => setPage(i + 1)}
          className={`px-3 py-1 rounded
          ${page === i + 1 ? "bg-orange-400 text-white" : "border"}`}
        >
          {i + 1}
        </button>
      ))}

      <button
        disabled={page === totalPages}
        onClick={() => setPage(page + 1)}
        className="px-3 py-1 border rounded disabled:opacity-40"
      >
        →
      </button>
    </div>
  );
}
