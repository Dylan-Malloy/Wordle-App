import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "../../config/useAuth";

const MAX_GUESSES = 6;

const Lobby = () => {
  const { lobbyId } = useParams();
  const { currentUser: user, loading: authLoading } = useAuth();

  const [lobby, setLobby] = useState(null);
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [hasWon, setHasWon] = useState(false);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!lobbyId || !user) return;

    const fetchLobby = async () => {
      try {
        const q = query(collection(db, "lobbies"), where("host", "==", lobbyId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError("Lobby not found.");
          return;
        }

        const lobbyDoc = snapshot.docs[0];
        const lobbyData = lobbyDoc.data();
        setLobby({ ...lobbyData, id: lobbyDoc.id });

        const userRef = doc(db, "lobbies", lobbyDoc.id, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setGuesses(userData.guesses || []);
          setHasWon(userData.hasGuessedCorrectly || false);
        } else {
          setError("You are not a participant in this lobby.");
        }

        const usersRef = collection(lobbyDoc.ref, "users");
        onSnapshot(usersRef, (snapshot) => {
          const players = snapshot.docs.map((doc) => doc.data());
          setAllPlayers(players);
        });
      } catch (err) {
        console.error(err);
        setError("Failed to fetch lobby.");
      } finally {
        setLoading(false);
      }
    };

    fetchLobby();
  }, [lobbyId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedGuess = guess.trim().toLowerCase();

    if (normalizedGuess.length !== 5) {
      alert("Guess must be 5 letters.");
      return;
    }

    if (hasWon || guesses.length >= MAX_GUESSES) {
      alert("No more guesses allowed.");
      return;
    }

    const updatedGuesses = [...guesses, normalizedGuess];
    const correct = normalizedGuess === lobby.word.toLowerCase();

    try {
      const userRef = doc(db, "lobbies", lobby.id, "users", user.uid);
      await updateDoc(userRef, {
        guesses: arrayUnion(normalizedGuess),
        hasGuessedCorrectly: correct,
      });

      setGuesses(updatedGuesses);
      setHasWon(correct);
      setGuess("");
    } catch (err) {
      console.error(err);
      alert("Error submitting guess.");
    }
  };

  const getLetterColor = (letter, index, word) => {
    if (word[index] === letter) return "green";
    if (word.includes(letter)) return "goldenrod";
    return "lightgray";
  };

  if (authLoading || loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <>
      <h1>Lobby</h1>
      <p>Hosted by: <strong>{lobby.hostEmail || lobbyId}</strong></p>
      <h2>Guess the word!</h2>

      {hasWon && <h3 style={{ color: "green" }}>🎉 You guessed the word!</h3>}
      {!hasWon && guesses.length >= MAX_GUESSES && (
        <h3 style={{ color: "red" }}>❌ No more guesses. The word was: {lobby.word}</h3>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          maxLength={5}
          value={guess}
          onChange={(e) => setGuess(e.target.value.toUpperCase())}
          disabled={hasWon || guesses.length >= MAX_GUESSES}
        />
        <button type="submit" disabled={hasWon || guesses.length >= MAX_GUESSES}>
          Submit
        </button>
      </form>

      <div style={{ marginTop: "2rem" }}>
        <h3>Your Guesses</h3>
        {guesses.map((g, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
            {g.split("").map((char, idx) => (
              <div
                key={idx}
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: getLetterColor(char, idx, lobby.word.toLowerCase()),
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  borderRadius: 4,
                }}
              >
                {char.toUpperCase()}
              </div>
            ))}
          </div>
        ))}
      </div>

      <hr />

      <div style={{ marginTop: "2rem" }}>
        <h3>Other Players' Progress</h3>
        {allPlayers.filter(p => p.uid !== user.uid).map((p) => (
          <div
            key={p.uid}
            style={{
              marginBottom: "1rem",
              backgroundColor: p.hasGuessedCorrectly ? "lightgreen" : "transparent",
              padding: "4px 8px",
              borderRadius: 4,
            }}
          >
            <strong>{p.email}</strong> — Guesses: {p.guesses.length}
          </div>
        ))}
      </div>
    </>
  );
};

export default Lobby;