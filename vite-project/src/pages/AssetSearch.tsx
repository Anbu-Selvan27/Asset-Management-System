import { useEffect, useState } from "react";
import axios from "axios";
import GenericAssetDisplay from "../components/GenericAssetDisplay";

const AssetSearch = () => {
  const [tableName, setTableName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<Record<string, any>[] | null>(null);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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
        setError("❌ Failed to load categories.");
      }
    };

    fetchCategories();
  }, []);

  const handleSearch = async () => {
    if (!tableName || !identifier) {
      setError("⚠️ Please select a category and enter an asset tag/code.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.get("http://127.0.0.1:8000/search-asset", {
        params: {
          table_name: tableName,
          identifier,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setResult(response.data);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.response?.data?.detail || "❌ Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Search Asset</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <select
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          className="border p-2 rounded w-full"
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
          className="border p-2 rounded w-full"
        />

        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {result && result.length > 0 ? (
        <GenericAssetDisplay asset={result[0]} />
      ) : result && result.length === 0 ? (
        <p className="text-gray-600">No asset found with the given identifier.</p>
      ) : null}
    </div>
  );
};

export default AssetSearch;
