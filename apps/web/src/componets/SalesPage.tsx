"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "./Firbase";

export default function SalesPage() {
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    const fetchGames = async () => {
      const snapshot = await getDocs(collection(db, "games"));
      const list: any[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const selectedCount = Array.isArray(data.selectedNumbers)
          ? data.selectedNumbers.length
          : 0;

        const betAmount =
          typeof data.betAmount === "number" ? data.betAmount : 0;
        const totalAmount = betAmount * selectedCount;
        const commission = totalAmount * 0.1;
        const winAmount = totalAmount - commission;

        const bonusAmount = data.bonusAmount ?? "-";
        const bonusType = data.bonusType ?? "-";
        const gameType = data.gameType ?? "-";

        const date = data.createdAt
          ? new Date(data.createdAt).toLocaleString()
          : "N/A";

        // Optional: Store calculated values back into Firestore
        /*
        const gameDocRef = doc(db, "games", docSnap.id);
        await updateDoc(gameDocRef, {
          totalAmount,
          winAmount,
        });
        */

        list.push({
          id: docSnap.id,
          betAmount,
          selectedCount,
          totalAmount,
          commission,
          winAmount,
          bonusAmount,
          bonusType,
          gameType,
          date,
        });
      }

      setGames(list);
    };

    fetchGames();
  }, []);

  return (
    <div className="p-6 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Game Sales Report</h1>

      <table className="min-w-full table-auto border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 border">#</th>
            <th className="px-3 py-2 border">Card Price (Bet)</th>
            <th className="px-3 py-2 border">Game Type</th>
            <th className="px-3 py-2 border">No. of Cards</th>
            <th className="px-3 py-2 border">Total Amount</th>
            <th className="px-3 py-2 border">Commission (10%)</th>
            <th className="px-3 py-2 border">Win Amount</th>
            <th className="px-3 py-2 border">Bonus Amount</th>
            <th className="px-3 py-2 border">Bonus Type</th>
            <th className="px-3 py-2 border">Date/Time</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game, i) => (
            <tr key={game.id} className="text-center border-t">
              <td className="px-3 py-2 border">{i + 1}</td>
              <td className="px-3 py-2 border">{game.betAmount} ብር</td>
              <td className="px-3 py-2 border">{game.gameType}</td>
              <td className="px-3 py-2 border">{game.selectedCount}</td>
              <td className="px-3 py-2 border">{game.totalAmount} ብር</td>
              <td className="px-3 py-2 border">
                {game.commission.toFixed(2)} ብር
              </td>
              <td className="px-3 py-2 border">
                {game.winAmount.toFixed(2)} ብር
              </td>
              <td className="px-3 py-2 border">{game.bonusAmount}</td>
              <td className="px-3 py-2 border">{game.bonusType}</td>
              <td className="px-3 py-2 border">{game.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
