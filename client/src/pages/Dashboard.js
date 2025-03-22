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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // --- 1. Subscribe to hosted lobby ---
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
          setHostedPlayers(players);
        });
      } else {
        setHostedLobby(null);
        setHostedPlayers([]);
      }
    });

    // --- 2. Subscribe to joined lobbies ---
    const lobbiesRef = collection(db, "lobbies");

    const unsubJoined = onSnapshot(lobbiesRef, async (snapshot) => {
      const promises = snapshot.docs.map(async (lobbyDoc) => {
        const lobbyData = lobbyDoc.data();
        const usersRef = collection(lobbyDoc.ref, "users");
        const userDoc = await getDoc(doc(usersRef, user.uid));

        const isHost = lobbyData.host === user.uid;
        const hasJoined = userDoc.exists();

        if (hasJoined && !isHost) {
          return {
            id: lobbyDoc.id,
            ...lobbyData,
          };
        }
        return null;
      });

      const joined = (await Promise.all(promises)).filter(Boolean);
      setJoinedLobbies(joined);
      setLoading(false);
    });

    return () => {
      unsubHosted();
      unsubJoined();
    };
  }, [user]);

  // --- Delete hosted lobby ---
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

  // --- Leave joined lobby ---
  const handleLeaveLobby = async (lobbyId) => {
    const userRef = doc(db, "lobbies", lobbyId, "users", user.uid);
    await deleteDoc(userRef);
    alert("You left the lobby.");
  };

  if (!user) return <p>Loading user...</p>;

  return (
    <>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}</p>
      <p>User ID: {user.uid}</p>

      <div style={{ marginTop: "2rem", marginBottom: "1rem" }}>
        <Link to="/lobby/join">Join Lobby</Link>{" "}
        {hostedLobby ? (
          <span style={{ marginLeft: "1rem", color: "gray" }}>
            (You can only host one lobby)
          </span>
        ) : (
          <Link style={{ marginLeft: "1rem" }} to="/lobby/create">
            Create Lobby
          </Link>
        )}
      </div>

      <hr />

      {/* Hosted Lobby */}
      {hostedLobby ? (
        <div>
          <h2>Your Hosted Lobby: {hostedLobby.lobbyName}</h2>
          <p>Word: {hostedLobby.word}</p>
          <h3>Players:</h3>
          <ul>
            {hostedPlayers.map((player) => (
              <li key={player.uid}>
                <strong>{player.uid}</strong>
                <ul>
                  {player.guesses?.length > 0 ? (
                    player.guesses.map((guess, index) => (
                      <li key={index}>{guess}</li>
                    ))
                  ) : (
                    <li>No guesses yet</li>
                  )}
                </ul>
              </li>
            ))}
          </ul>
          <button onClick={handleDeleteLobby}>Delete Lobby</button>
        </div>
      ) : (
        <p>You are not currently hosting a lobby.</p>
      )}

      <hr />

      {/* Joined Lobbies */}
      {joinedLobbies.length > 0 ? (
        <div>
          <h2>Lobbies You've Joined:</h2>
          {joinedLobbies.map((lobby) => (
            <div key={lobby.id} style={{ marginBottom: "1rem" }}>
              <p>
                <strong>{lobby.lobbyName}</strong> — Hosted by: {lobby.host}
              </p>
              <Link to={`/lobby/${lobby.host}`}>Go to Lobby</Link>{" "}
              <button onClick={() => handleLeaveLobby(lobby.id)}>Leave</button>
            </div>
          ))}
        </div>
      ) : (
        <p>You haven't joined any lobbies yet.</p>
      )}
    </>
  );
};

export default Dashboard;
