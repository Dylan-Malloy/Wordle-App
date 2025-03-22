import React from "react";


const Landing = () => {
  return (
    <div className="landing-container">
      <h1 className="landing-title">Welcome to the WordleApp</h1>
      <div className="landing-links">
        <a className="landing-link" href="/login">Login</a>
        <a className="landing-link" href="/signup">Signup</a>
      </div>
    </div>
  );
};

export default Landing;
