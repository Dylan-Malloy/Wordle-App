import React, { useState } from "react";
import { useAuth } from "../../config/useAuth";
const Create = () => {
  const response = useAuth();
  const user = response.currentUser;
  console.log(user);
  const [lobbyName, setLobbyName] = useState("");
  const [word, setWord] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (word.length != 5) {
      setError("Word must be 5 letters.");
      return;
    }
    try {
      const lobby = await createLobby(lobbyName, word, user.uid);
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <>
      <h1>Create Lobby</h1>
      <form onSubmit={handleSubmit}>
        <label>Enter Lobby Name</label>
        <input
          value={lobbyName}
          type="text"
          id="lobbyName"
          name="lobbyName"
          onChange={(e) => setLobbyName(e.target.value)}
        ></input>

        <label>Wordle Word</label>
        <input
          value={word}
          type="text"
          id="word"
          name="word"
          onChange={(e) => setWord(e.target.value)}
        ></input>

        <button type="submit">Create Lobby</button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </>
  );
};

export default Create;
