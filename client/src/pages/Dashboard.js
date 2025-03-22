import React from "react";

import { useAuth } from "../config/useAuth";

const Dashboard = () => {
  const user = useAuth();

  return (
    <>
      <h1>Dashboard</h1>
      {user ? (
        <div>
          <p>Welcome, {user.email}</p>
          <p>User ID: {user.uid}</p>
        </div>
      ) : (
        <p>Loading user...</p>
      )}
    </>
  );
};

export default Dashboard;
