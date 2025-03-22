import React, { useState } from "react";
import { signUpWithEmailAndPassword } from "../config/firebase";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await signUpWithEmailAndPassword(email, password);
      console.log("User created:", user);
      setError("Success! You have signed up");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="signup-container">
      <h1 className="signup-title">Signup</h1>
      <form className="signup-form" onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          className="signup-input"
          value={email}
          type="text"
          id="email"
          name="email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="password">Password</label>
        <input
          className="signup-input"
          value={password}
          type="password"
          id="password"
          name="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="signup-button" type="submit">Submit</button>

        {error && <p className="signup-error">{error}</p>}
      </form>
    </div>
  );
};

export default Signup;