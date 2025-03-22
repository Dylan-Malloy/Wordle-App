import React, { useState } from "react";
import { useAuth } from "../../config/useAuth";
import { db } from "../../config/firebase";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";
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
      navigate(`/lobby/${user.uid}`);
    } catch (error) {
      setError(error.message);
    }
  };

  const createLobby = async (lobbyName, word, userId) => {
    const lobbyRef = doc(db, "lobbies", lobbyName);
    await setDoc(lobbyRef, {
      lobbyName,
      word,
      host: userId,
      createdAt: serverTimestamp(),
    });
  
    const usersRef = collection(lobbyRef, "users");
    await setDoc(doc(usersRef, userId), {
      uid: userId,
      guesses: [],
      hasGuessedCorrectly: false,
      joinedAt: new Date(),
    });
  };

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
        />

        <label>Wordle Word</label>
        <input
          value={word}
          type="text"
          id="word"
          name="word"
          onChange={(e) => setWord(e.target.value)}
        />

        <button type="submit">Create Lobby</button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </>
  );
};

export default Create;
