import { useEffect, useState } from "react";
import axios from "axios";

const DeleteAsset = () => {
  const [tableName, setTableName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For loading state

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/get-categories", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const tableNames = response.data.map((cat: any) => cat.table);
        setCategories(tableNames);
      } catch (err: any) {
        console.error("Failed to fetch categories:", err);
        setError("Failed to load categories");
      }
    };

    fetchCategories();
  }, []);

  const handleDelete = async () => {
    if (!tableName || !identifier) {
      setError("Please select a table and enter an identifier.");
      setMessage("");
      return;
    }

    setIsLoading(true); // Start loading

    try {
      const response = await axios.delete("http://127.0.0.1:8000/delete-asset", {
        params: {
          table_name: tableName,
          identifier,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setMessage(response.data.detail || "Asset deleted successfully.");
      setError("");
      setTableName(""); // Clear the table name input
      setIdentifier(""); // Clear the identifier input
    } catch (err: any) {
      setError(err.response?.data?.detail || "Something went wrong");
      setMessage("");
    } finally {
      setIsLoading(false); // End loading
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl mb-4 font-semibold">🗑️ Delete Asset</h1>

      <div className="flex gap-2 mb-4">
        <select
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          className="border p-2 rounded w-1/2"
        >
          <option value="">Select Category Table</option>
          {categories.map((table) => (
            <option key={table} value={table}>
              {table}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Enter asset tag or code"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="border p-2 rounded w-1/2"
        />

        <button
          onClick={handleDelete}
          className={`bg-blue-600 text-white px-4 py-2 rounded ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
          disabled={isLoading} // Disable button while loading
        >
          {isLoading ? "Deleting..." : "Delete"}
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {message && <p className="text-green-600">{message}</p>}
    </div>
  );
};

export default DeleteAsset;
