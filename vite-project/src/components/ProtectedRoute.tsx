import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  role: string;
  children: React.ReactNode;
}

const ProtectedRoute = ({ role, children }: ProtectedRouteProps) => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");
  
    if (!token || userRole?.toLowerCase() !== role.toLowerCase()) {
      return <Navigate to="/login" />;
    }
  
    return <>{children}</>;
  };
  

export default ProtectedRoute;
