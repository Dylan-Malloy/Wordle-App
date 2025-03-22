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
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "../../config/useAuth";

const MAX_GUESSES = 6;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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
  const [justSubmittedRow, setJustSubmittedRow] = useState(-1);
  const [keyboardColors, setKeyboardColors] = useState({});

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

  const getLetterColors = (guess, solution) => {
    const result = Array(5).fill("absent");
    const solutionLetters = solution.split("");
    const guessLetters = guess.split("");

    // First pass for correct letters
    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] === solutionLetters[i]) {
        result[i] = "correct";
        solutionLetters[i] = null;
        guessLetters[i] = null;
      }
    }

    // Second pass for present letters
    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] && solutionLetters.includes(guessLetters[i])) {
        result[i] = "present";
        const index = solutionLetters.indexOf(guessLetters[i]);
        solutionLetters[index] = null;
      }
    }

    return result;
  };

  const handleSubmit = async () => {
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

    const colors = getLetterColors(normalizedGuess, lobby.word.toLowerCase());
    const newColors = { ...keyboardColors };

    for (let i = 0; i < normalizedGuess.length; i++) {
      const char = normalizedGuess[i].toUpperCase();
      const color = colors[i];

      if (
        color === "correct" ||
        (color === "present" && newColors[char] !== "correct") ||
        (color === "absent" && !newColors[char])
      ) {
        newColors[char] = color;
      }
    }

    try {
      const userRef = doc(db, "lobbies", lobby.id, "users", user.uid);
      await updateDoc(userRef, {
        guesses: updatedGuesses,
        hasGuessedCorrectly: correct,
      });

      setGuesses(updatedGuesses);
      setHasWon(correct);
      setJustSubmittedRow(guesses.length);
      setGuess("");
      setKeyboardColors(newColors);
    } catch (err) {
      console.error(err);
      alert("Error submitting guess.");
    }
  };

  const handleKeyboardClick = (char) => {
    if (guess.length < 5 && !hasWon && guesses.length < MAX_GUESSES) {
      setGuess((prev) => prev + char.toLowerCase());
    }
  };

  const handleBackspace = () => {
    setGuess((prev) => prev.slice(0, -1));
  };

  if (authLoading || loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="lobby-container">
      <h1>Lobby</h1>
      <p>Hosted by: <strong>{lobby.hostEmail || lobbyId}</strong></p>
      <h2>Guess the word!</h2>

      {hasWon && <h3 className="message success">🎉 You guessed the word!</h3>}
      {!hasWon && guesses.length >= MAX_GUESSES && (
        <h3 className="message fail">❌ No more guesses. The word was: {lobby.word}</h3>
      )}

      <div className="wordle-board">
        {[...Array(MAX_GUESSES)].map((_, rowIndex) => {
          const isCurrentRow = rowIndex === guesses.length;
          const currentGuess = rowIndex < guesses.length
            ? guesses[rowIndex]
            : isCurrentRow
            ? guess
            : "";

          const colors = rowIndex < guesses.length
            ? getLetterColors(guesses[rowIndex], lobby.word.toLowerCase())
            : [];

          return (
            <div className="wordle-row" key={rowIndex}>
              {[...Array(5)].map((_, colIndex) => {
                const letter = currentGuess[colIndex] || "";
                const color = colors[colIndex] || "";
                const flipClass = rowIndex === justSubmittedRow ? `flip delay-${colIndex}` : "";
                const letterColor = rowIndex === guesses.length ? "black" : "white";
                return (
                  <div
                    key={colIndex}
                    className={`wordle-box ${color} ${flipClass}`}
                    style={{ color: letterColor }}
                  >
                    {letter.toUpperCase()}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="keyboard">
        {ALPHABET.map((char) => (
          <button
            key={char}
            className={`key-button ${keyboardColors[char] || ""}`}
            onClick={() => handleKeyboardClick(char)}
          >
            {char}
          </button>
        ))}
        <button className="key-button" onClick={handleBackspace}>⌫</button>
        <button
          className="key-button go-button"
          onClick={handleSubmit}
          disabled={hasWon || guesses.length >= MAX_GUESSES || guess.length !== 5}
        >
          Go
        </button>
      </div>

      <div className="player-progress">
        <h3>Other Players' Progress</h3>
        {allPlayers.filter(p => p.uid !== user.uid).map((p) => {
          const isEliminated = !p.hasGuessedCorrectly && p.guesses.length >= MAX_GUESSES;
          return (
            <div
              key={p.uid}
              className={`player-status ${p.hasGuessedCorrectly ? "correct" : isEliminated ? "eliminated" : ""}`}
            >
              <strong>{p.email}</strong> — Guesses: {p.guesses.length}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Lobby;
