import React, { useState } from "react";
import { useAuth } from "../../config/useAuth";
import { db } from "../../config/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Create = () => {
  const { currentUser: user } = useAuth();
  const navigate = useNavigate();

  const [lobbyName, setLobbyName] = useState("");
  const [word, setWord] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (word.length !== 5) {
      setError("Word must be 5 letters.");
      return;
    }

    try {
      await createLobby(lobbyName, word, user.uid);
      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    }
  };

  const createLobby = async (lobbyName, word, userId) => {
    const lobbyRef = doc(db, "lobbies", lobbyName);
    await setDoc(lobbyRef, {
      lobbyName,
      hostEmail: user.email,
      word,
      host: userId,
      createdAt: serverTimestamp(),
    });
  };

  return (
    <div className="create-lobby-container">
      <h1 className="create-lobby-title">Create Lobby</h1>
      <form className="create-lobby-form" onSubmit={handleSubmit}>
        <label htmlFor="lobbyName">Enter Lobby Name</label>
        <input
          className="create-lobby-input"
          value={lobbyName}
          type="text"
          id="lobbyName"
          name="lobbyName"
          onChange={(e) => setLobbyName(e.target.value)}
        />

        <label htmlFor="word">Wordle Word</label>
        <input
          className="create-lobby-input"
          value={word}
          type="text"
          id="word"
          name="word"
          onChange={(e) => setWord(e.target.value)}
        />

        <button className="create-lobby-button" type="submit">Create Lobby</button>

        {error && <p className="create-lobby-error">{error}</p>}
      </form>
    </div>
  );
};

export default Create;