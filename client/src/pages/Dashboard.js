import React, { useEffect, useState } from "react";
import { useAuth } from "../config/useAuth";
import { db } from "../config/firebase";
import {
  collection,
  query,
  where,
  doc,
  onSnapshot,
  getDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { currentUser: user } = useAuth();
  const [hostedLobby, setHostedLobby] = useState(null);
  const [hostedPlayers, setHostedPlayers] = useState([]);
  const [joinedLobbies, setJoinedLobbies] = useState([]);
  const [joinedLobbyPlayers, setJoinedLobbyPlayers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const hostedLobbyQuery = query(
      collection(db, "lobbies"),
      where("host", "==", user.uid)
    );

    const unsubHosted = onSnapshot(hostedLobbyQuery, async (snapshot) => {
      if (!snapshot.empty) {
        const lobbyDoc = snapshot.docs[0];
        setHostedLobby({ id: lobbyDoc.id, ...lobbyDoc.data() });

        const usersRef = collection(lobbyDoc.ref, "users");

        onSnapshot(usersRef, (userSnap) => {
          const players = userSnap.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
          }));

          players.sort((a, b) => (a.guesses?.length || 0) - (b.guesses?.length || 0));
          setHostedPlayers(players);
        });
      } else {
        setHostedLobby(null);
        setHostedPlayers([]);
      }
    });

    const lobbiesRef = collection(db, "lobbies");

    const unsubJoined = onSnapshot(lobbiesRef, async (snapshot) => {
      const newJoined = [];
      const newJoinedPlayers = {};

      for (const lobbyDoc of snapshot.docs) {
        const lobbyData = lobbyDoc.data();
        const usersRef = collection(lobbyDoc.ref, "users");
        const userDoc = await getDoc(doc(usersRef, user.uid));

        const isHost = lobbyData.host === user.uid;
        const hasJoined = userDoc.exists();

        if (hasJoined && !isHost) {
          newJoined.push({ id: lobbyDoc.id, ...lobbyData });

          const playerDocs = await getDocs(usersRef);
          newJoinedPlayers[lobbyDoc.id] = playerDocs.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
          }));
        }
      }

      setJoinedLobbies(newJoined);
      setJoinedLobbyPlayers(newJoinedPlayers);
      setLoading(false);
    });

    return () => {
      unsubHosted();
      unsubJoined();
    };
  }, [user]);

  const handleDeleteLobby = async () => {
    if (!hostedLobby) return;

    const lobbyRef = doc(db, "lobbies", hostedLobby.id);
    const usersRef = collection(lobbyRef, "users");
    const userDocs = await getDocs(usersRef);
    const deletePromises = userDocs.docs.map((userDoc) => deleteDoc(userDoc.ref));

    await Promise.all(deletePromises);
    await deleteDoc(lobbyRef);
    alert("Lobby deleted.");
  };

  const handleLeaveLobby = async (lobbyId) => {
    const userRef = doc(db, "lobbies", lobbyId, "users", user.uid);
    await deleteDoc(userRef);
    alert("You left the lobby.");
  };

  const getLetterColor = (letter, index, word) => {
    if (word[index] === letter) return "green";
    if (word.includes(letter)) return "goldenrod";
    return "lightgray";
  };

  if (!user) return <p>Loading user...</p>;
  if (loading) return <p>Loading...</p>;
  
  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>
      <p className="dashboard-welcome">Welcome, {user.email}</p>

      <div className="dashboard-links">
        <Link to="/lobby/join">Join Lobby</Link>
        {hostedLobby ? (
          <span className="dashboard-note">(You can only host one lobby)</span>
        ) : (
          <Link to="/lobby/create">Create Lobby</Link>
        )}
      </div>

      <hr />

      {hostedLobby ? (
        <div className="hosted-lobby-section">
          <h2>Your Hosted Lobby: {hostedLobby.lobbyName}</h2>
          <p>Word: {hostedLobby.word}</p>
          <h3>Scoreboard:</h3>
          <ul className="scoreboard">
            {hostedPlayers.map((player) => (
              <li key={player.uid} className="scoreboard-player">
                <strong>{player.email}</strong>
                {player.guesses?.map((guess, i) => (
                  <div key={i} className="guess-row">
                    {guess.split("").map((char, idx) => (
                      <div
                        key={idx}
                        className="guess-letter"
                        style={{
                          backgroundColor: getLetterColor(char, idx, hostedLobby.word.toLowerCase()),
                        }}
                      >
                        {char.toUpperCase()}
                      </div>
                    ))}
                  </div>
                ))}
              </li>
            ))}
          </ul>
          <button className="delete-button" onClick={handleDeleteLobby}>Delete Lobby</button>
        </div>
      ) : (
        <p>You are not currently hosting a lobby.</p>
      )}

      <hr />

      {joinedLobbies.length > 0 ? (
        <div className="joined-lobbies-section">
          <h2>Lobbies You've Joined:</h2>
          {joinedLobbies.map((lobby) => (
            <div key={lobby.id} className="joined-lobby">
              <p>
                <strong>{lobby.lobbyName}</strong> — Hosted by: {lobby.hostEmail || lobby.host}
              </p>
              <Link to={`/lobby/${lobby.host}`}>Go to Lobby</Link>{" "}
              <button className="leave-button" onClick={() => handleLeaveLobby(lobby.id)}>Leave</button>

              <h4>Players:</h4>
              <ul className="joined-players">
                {joinedLobbyPlayers[lobby.id]?.map((player) => {
                  const isEliminated = !player.hasGuessedCorrectly && player.guesses.length >= 6;
                  return (
                    <li
                      key={player.uid}
                      className={`joined-player ${
                        player.hasGuessedCorrectly
                          ? "player-correct"
                          : isEliminated
                          ? "player-eliminated"
                          : ""
                      }`}
                    >
                      <strong>{player.email}</strong> — Guesses: {player.guesses.length}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p>You haven't joined any lobbies yet.</p>
      )}
    </div>
  );
};

export default Dashboard;
