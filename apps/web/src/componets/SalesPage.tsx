"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "./Firbase";

interface GameSession {
  id: string;
  userEmail?: string;
  betAmount?: number;
  selectedCartelas?: string[];
  bonusType?: string;
  gameType?: string;
  createdAt?: string;
  totalAmount?: number;
  winAmount?: number;
}

export default function SalesPage() {
  const [sessions, setSessions] = useState<GameSession[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const snapshot = await getDocs(collection(db, "gameSessions"));
        const list: GameSession[] = [];

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();

          let createdAtStr = "N/A";
          if (data.createdAt) {
            if (data.createdAt instanceof Timestamp) {
              createdAtStr = data.createdAt.toDate().toLocaleString();
            } else if (data.createdAt.seconds) {
              createdAtStr = new Date(
                data.createdAt.seconds * 1000
              ).toLocaleString();
            } else {
              createdAtStr = new Date(data.createdAt).toLocaleString();
            }
          }

          const selectedCartelas = Array.isArray(data.selectedCartelas)
            ? data.selectedCartelas
            : [];
          const betAmount =
            typeof data.betAmount === "number" ? data.betAmount : 0;
          const selectedCount = selectedCartelas.length;
          const totalAmount = betAmount * selectedCount;
          const winAmount = totalAmount * 0.9;

          list.push({
            id: docSnap.id,
            betAmount,
            selectedCartelas,
            bonusType: data.bonusType ?? "-",
            gameType: data.gameType ?? "-",
            createdAt: createdAtStr,
            totalAmount,
            winAmount,
          });
        });

        setSessions(list);
      } catch (error) {
        console.error("Failed to fetch game sessions", error);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="p-6 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">🎮 Game Sessions Report</h1>

      <table className="min-w-full table-auto border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 border">#</th>
            <th className="px-3 py-2 border">Game Type</th>
            <th className="px-3 py-2 border">Bet</th>
            <th className="px-3 py-2 border"># Cards</th>
            <th className="px-3 py-2 border">Total Amount</th>
            <th className="px-3 py-2 border">Win Amount</th>
            <th className="px-3 py-2 border">Bonus Type</th>
            <th className="px-3 py-2 border">Date/Time</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session, index) => (
            <tr
              key={session.id}
              className="text-center border-t hover:bg-gray-50"
            >
              <td className="px-3 py-2 border">{index + 1}</td>
              <td className="px-3 py-2 border">{session.gameType}</td>
              <td className="px-3 py-2 border">{session.betAmount} ብር</td>
              <td className="px-3 py-2 border">
                {session.selectedCartelas?.length ?? 0}
              </td>
              <td className="px-3 py-2 border">{session.totalAmount} ብር</td>
              <td className="px-3 py-2 border text-green-600 font-semibold">
                {session.winAmount?.toFixed(2)} ብር
              </td>
              <td className="px-3 py-2 border">{session.bonusType}</td>
              <td className="px-3 py-2 border">{session.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
