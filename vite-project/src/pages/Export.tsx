import { useEffect, useState } from "react";
import axios from "axios";

const Export = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/get-categories", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const tableNames = res.data
          .map((cat: any) => cat.table)
          .filter((name: string) => name !== "category_info" && name !== "users");
        setCategories(tableNames);
      } catch (err: any) {
        setError("Failed to load tables");
        console.error(err);
      }
    };

    fetchTables();
  }, [token]);

  const downloadFile = async (url: string, filename: string) => {
    try {
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Download failed");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📦 Export Asset Data</h1>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <div className="flex flex-col gap-4">
        <button
          onClick={() => downloadFile("http://127.0.0.1:8000/download-all-tables", "all_assets.xlsx")}
          className="bg-green-600 text-white px-4 py-2 rounded w-fit"
        >
          Export All Tables
        </button>

        <div className="flex items-center gap-2">
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">Select Table</option>
            {categories.map((table) => (
              <option key={table} value={table}>
                {table}
              </option>
            ))}
          </select>

          <button
            disabled={!selectedTable}
            onClick={() =>
              downloadFile(
                `http://127.0.0.1:8000/download-table?table_name=${selectedTable}`,
                `${selectedTable}.xlsx`
              )
            }
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Export Selected Table
          </button>
        </div>
      </div>
    </div>
  );
};

export default Export;
