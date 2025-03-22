import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import Create from "./pages/lobby/Create";
import Join from "./pages/lobby/Join";
import Lobby from "./pages/lobby/Lobby";
import Navbar from "./components/Navbar";

import "./App.css";

function App() {
  return (
    <Router>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Private Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lobby/create" element={<Create />} />
          <Route path="/lobby/join" element={<Join />} />
          <Route path="/lobby/:lobbyId" element={<Lobby />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
