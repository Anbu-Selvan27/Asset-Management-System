import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AssetSearch from "./pages/AssetSearch";
import CreateCategory from "./pages/CreateCategory";
import ManageCategory from "./pages/ManageCategory"; 
import AddAsset from "./pages/AddAsset";
import ReassignForm from "./pages/ReassignForm";
import UploadExcel from "./pages/UploadExcel";
import DeleteAsset from "./pages/DeleteAsset";
import Export from "./pages/Export";
import DashboardPage from "./pages/DashboardPage";


const App = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  return (
    <Router>
      <Navbar />

      <Routes>
        {/* Root path redirects based on login status */}
        <Route
          path="/"
          element={
            token ? (
              role === "admin" ? (
                <Navigate to="/admin-dashboard" />
              ) : (
                <Navigate to="/user-dashboard" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        /* Login route */
        <Route
          path="/login"
          element={
            token ? (
              role === "admin" ? (
                <Navigate to="/admin-dashboard" />
              ) : (
                <Navigate to="/user-dashboard" />
              )
            ) : (
              <Login />
            )
          }
        />

        <Route
          path="/register"
          element={
            token ? (
              role === "admin" ? (
                <Navigate to="/admin-dashboard" />
              ) : (
                <Navigate to="/user-dashboard" />
              )
            ) : (
              <Register />
            )
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
        
          <Route index element={<DashboardPage />} />

          <Route path="upload-excel" element={<UploadExcel/>}/>
          <Route path="register" element={<Register />} />
          <Route path="asset-search" element={<AssetSearch />} />
          <Route path="add-asset" element={<AddAsset />} />
          <Route path="delete-asset" element={<DeleteAsset />} />
          <Route path="reassign-asset" element={<ReassignForm />} />
          <Route path="create-category" element={<CreateCategory />} />
          <Route path="manage-category" element={<ManageCategory />} />
          <Route path="/admin-dashboard/export-data" element={<Export />} />
        </Route>

        <Route
          path="/user-dashboard"
          element={
            <ProtectedRoute role="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
