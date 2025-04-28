import React from "react";
import { useNavigate, Link } from "react-router-dom";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="text-lg font-bold">
        <Link to="/">Asset Manager</Link>
      </div>

      <div className="flex gap-4 items-center">
        {token ? (
          <>
            <span className="text-sm bg-gray-700 px-3 py-1 rounded-full">{role}</span>
            <button
              onClick={logout}
              className="text-sm bg-red-500 px-3 py-1 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 text-sm">
              Login
            </Link>
            <Link to="/register" className="bg-green-600 px-3 py-1 rounded hover:bg-green-700 text-sm">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
