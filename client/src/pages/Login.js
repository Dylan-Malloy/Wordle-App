import React, { useState } from "react";
import { signInWithEmailAndPasswordHandler } from "../config/firebase";
import { useNavigate } from "react-router-dom";
const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await signInWithEmailAndPasswordHandler(email, password);
      console.log("Signed in ", user);
      // Redirect or show success message here
      setError("Success! You have Logged In");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          value={email}
          type="text"
          id="email"
          name="email"
          onChange={(e) => setEmail(e.target.value)}
        ></input>

        <label>Password</label>
        <input
          value={password}
          type="password"
          id="password"
          name="password"
          onChange={(e) => setPassword(e.target.value)}
        ></input>

        <button type="submit">Login</button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </>
  );
};

export default Login;
