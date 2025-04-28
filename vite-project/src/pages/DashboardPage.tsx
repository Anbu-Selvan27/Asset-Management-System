import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer
  } from "recharts";
  

const DashboardPage = () => {
  const [stats, setStats] = useState({ categories: 0, assets: 0, users: 0 });
  const [categories, setCategories] = useState<string[]>([]);
  const [assetCountsByCategory, setAssetCountsByCategory] = useState<Record<string, number>>({});
  const [activeAssetCountsByCategory, setActiveAssetCountsByCategory] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [showAssetPopup, setShowAssetPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await axios.get("http://127.0.0.1:8000/dashboard-stats", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        const categoriesRes = await axios.get("http://127.0.0.1:8000/get-categories", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        setStats(statsRes.data);
        setCategories(categoriesRes.data.map((cat: any) => cat.table));
        setAssetCountsByCategory(statsRes.data.asset_counts_by_category);
        setActiveAssetCountsByCategory(statsRes.data.active_asset_counts_by_category || {});
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to fetch data");
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">📊 Admin Dashboard</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Total Categories with Popup */}
        <div
          className="relative bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow transition"
          onMouseEnter={() => setShowPopup(true)}
          onMouseLeave={() => setShowPopup(false)}
        >
          <div className="text-gray-700 text-lg font-medium mb-1">📁 Total Categories</div>
          <div className="text-2xl font-bold text-gray-900">{stats.categories}</div>

          {showPopup && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-300 rounded-xl shadow-lg p-4 z-10">
              <h3 className="font-semibold text-base mb-3 text-gray-800 border-b pb-2">Category List</h3>
              <ul className="text-sm text-gray-700 max-h-60 overflow-y-auto space-y-2">
                {categories.length === 0 ? (
                  <li>No categories available</li>
                ) : (
                  categories.map((cat) => <li key={cat}>• {cat}</li>)
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Total Assets with Hover Popup */}
<div
  className="relative bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow transition"
  onMouseEnter={() => setShowAssetPopup(true)}
  onMouseLeave={() => setShowAssetPopup(false)}
>
  <div className="text-gray-700 text-lg font-medium mb-1">🧾 Total Assets</div>
  <div className="text-2xl font-bold text-gray-900">{stats.assets}</div>

  {showAssetPopup && (
    <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-300 rounded-xl shadow-lg p-4 z-10">
      <h3 className="font-semibold text-base mb-3 text-gray-800 border-b pb-2">Assets by Category</h3>
      <ul className="text-sm text-gray-700 max-h-60 overflow-y-auto space-y-2">
      {Object.entries(assetCountsByCategory).map(([category, count]) => (
  <li
    key={category}
    className="flex justify-between items-center px-2 py-1 rounded hover:bg-gray-100 transition"
  >
    <div>
      <span className="capitalize font-medium">{category}</span>
      <div className="text-xs text-gray-500">
        Active: {activeAssetCountsByCategory[category] ?? 0}
      </div>
    </div>
    <span className="font-semibold text-gray-900">{count ?? 0}</span>
  </li>
))}
      </ul>
    </div>
  )}
</div>


        {/* Total Users */}
        <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow transition">
          <div className="text-gray-700 text-lg font-medium mb-1">👥 Registered Users</div>
          <div className="text-2xl font-bold text-gray-900">{stats.users}</div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4 text-gray-800">⚡ Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded border border-gray-300 transition"
          onClick={() => navigate("/admin-dashboard/add-asset")}
        >
          ➕ Add New Asset
        </button>
        <button
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded border border-gray-300 transition"
          onClick={() => navigate("/admin-dashboard/create-category")}
        >
          🖥️ Create New Category
        </button>
        <button
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded border border-gray-300 transition"
          onClick={() => navigate("/admin-dashboard/asset-search")}
        >
          🔍 Search Asset
        </button>
        <button
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded border border-gray-300 transition"
          onClick={() => navigate("/admin-dashboard/delete-asset")}
        >
          ❌ Delete Asset
        </button>
      </div>
      <h2 className="text-xl font-semibold mb-4 mt-8 text-gray-800">📊 Assets by Category (Bar Chart)</h2>

<div className="bg-white p-6 rounded-lg shadow border">
  {Object.keys(assetCountsByCategory).length === 0 ? (
    <p className="text-gray-500">No data to display</p>
  ) : (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={Object.entries(assetCountsByCategory).map(([category, count]) => ({ category, count }))}>
        <XAxis dataKey="category" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#4f46e5" />
      </BarChart>
    </ResponsiveContainer>
  )}
</div>
    </div>
    
  );
};

export default DashboardPage;
