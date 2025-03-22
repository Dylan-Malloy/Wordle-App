import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../config/useAuth"; 

const PrivateRoute = () => {
    const currentUser = useAuth();
  
    return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
  };

export default PrivateRoute;