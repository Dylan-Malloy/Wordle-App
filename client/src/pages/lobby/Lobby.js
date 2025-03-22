import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const Lobby = () => {
  const { lobbyId } = useParams(); // this is the host UID
  const [lobby, setLobby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLobby = async () => {
      try {
        const q = query(
          collection(db, "lobbies"),
          where("host", "==", lobbyId)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError("Lobby not found.");
        } else {
          setLobby(snapshot.docs[0].data());
        }
      } catch (err) {
        setError("Failed to fetch lobby.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLobby();
  }, [lobbyId]);

  if (loading) return <p>Loading lobby...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <>
      <h1>Lobby</h1>
      <p>Welcome to lobby hosted by: <strong>{lobbyId}</strong></p>
      <h2>Guess the word!</h2>
      
    </>
  );
};

export default Lobby;
