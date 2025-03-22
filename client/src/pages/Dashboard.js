import React from "react";
import { useAuth } from "../config/useAuth";

const Dashboard = () => {
  const response = useAuth();
  const user = response.currentUser;
  console.log(user);
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
      <a href="/lobby/join">Join Lobby</a>
      <a href="/lobby/create">Create Lobby</a>
    </>
  );
};

export default Dashboard;
