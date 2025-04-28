import { Link, Outlet } from "react-router-dom";
import { useState } from "react";

const AdminDashboard = () => {
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-6">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
        <nav className="flex flex-col gap-4">
          <Link to="/admin-dashboard" className="w-full text-left">
            🏠 Dashboard
          </Link>
          <Link to="/admin-dashboard/upload-excel" className="w-full text-left">
            🔗 Upload Excel
          </Link>
    
          {/* Asset Management Menu */}
          <div>
            <button
              onClick={() => setShowAssetDropdown(!showAssetDropdown)}
              className="w-full text-left"
            >
              ⚙️ Asset Management
            </button>
            {showAssetDropdown && (
              <div className="ml-4 mt-2 flex flex-col gap-2">
                <Link to="/admin-dashboard/asset-search" className="w-full text-left">
                  🔍 Asset Search
                </Link>
                <Link to="/admin-dashboard/add-asset" className="w-full text-left">
                  ➕ Add Asset
                </Link>
                <Link to="/admin-dashboard/reassign-asset" className="w-full text-left">
                  🔄 Reassign Asset
                </Link>
                <Link to="/admin-dashboard/delete-asset" className="w-full text-left">
                  ❌ Delete Asset
                </Link>
        
              </div>
            )}
          </div>

          {/* User Management Menu */}
          <div>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="w-full text-left"
            >
              👥 User Management
            </button>
            {showUserDropdown && (
              <div className="ml-4 mt-2 flex flex-col gap-2">
                <Link to="/admin-dashboard/register" className="w-full text-left">
                  ➕ Add User
                </Link>
              </div>
            )}
          </div>

          {/* Category Management Menu */}
          <div>
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full text-left"
            >
              🖥️ Category Management
            </button>
            {showCategoryDropdown && (
              <div className="ml-4 mt-2 flex flex-col gap-2">
                <Link to="/admin-dashboard/create-category" className="w-full text-left">
                  ➕ Create Category
                </Link>
                <Link to="/admin-dashboard/manage-category" className="w-full text-left">
                  🛠️ Manage Category
                </Link>
              </div>
            )}
          </div>

          {/* Data Export */}
          <div>
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="w-full text-left"
            >
              📦 Data Export
            </button>
            {showExportDropdown && (
              <div className="ml-4 mt-2 flex flex-col gap-2">
                <Link to="/admin-dashboard/export-data" className="w-full text-left">
                  📁 Export Asset Data
                </Link>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboard;
