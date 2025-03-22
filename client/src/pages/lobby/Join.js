import React, { useState } from "react";
import { db } from "../../config/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../config/useAuth";

const Join = () => {
  const [lobbyName, setLobbyName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lobbyName) {
      setError("Lobby name is required.");
      return;
    }

    try {
      const lobbyRef = doc(db, "lobbies", lobbyName);
      const lobbySnap = await getDoc(lobbyRef);

      if (!lobbySnap.exists()) {
        setError("Lobby not found.");
        return;
      }

      const usersRef = collection(lobbyRef, "users");
      const userDocRef = doc(usersRef, currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      const userDocs = await getDocs(usersRef);
      if (!userDoc.exists() && userDocs.size >= 5) {
        setError("Lobby is full.");
        return;
      }

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: currentUser.uid,
          email: currentUser.email, // ✅ Store email here
          guesses: [],
          hasGuessedCorrectly: false,
          joinedAt: new Date(),
        });
      }

      const { host } = lobbySnap.data();
      navigate(`/lobby/${host}`);
    } catch (err) {
      console.error(err);
      setError("Failed to join lobby.");
    }
  };

  return (
    <>
      <h1>Join Lobby</h1>
      <form onSubmit={handleSubmit}>
        <label>Enter Lobby Name</label>
        <input
          type="text"
          value={lobbyName}
          onChange={(e) => setLobbyName(e.target.value)}
        />
        <button type="submit">Join</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </>
  );
};

export default Join;
