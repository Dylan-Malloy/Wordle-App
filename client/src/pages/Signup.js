import React, { useState } from "react";

import { signUpWithEmailAndPassword } from "../config/firebase";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await signUpWithEmailAndPassword(email, password);
      console.log("User created:", user);
      // Redirect or show success message here 
      setError("Success! You have sign up")
    } catch (error) {
      setError(error.message);
    }
  };
  
  return (
    <>
      <h1>signup</h1>
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

        <button type="submit">Submit</button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </>
  );
};

export default Signup;
