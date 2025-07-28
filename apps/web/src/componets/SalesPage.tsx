"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  Timestamp,
  query,
  where,
} from "firebase/firestore";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { db } from "./Firbase"; // your Firebase config file
import { auth } from "./Firbase"; // make sure you export auth from Firebase config

interface GameSession {
  id: string;
  userEmail?: string;
  betAmount?: number;
  selectedCartelas?: string[];
  createdAt?: Date;
  totalAmount?: number;
  winAmount?: number;
}

interface DailyReport {
  date: string;
  players: number;
  totalSales: number;
  totalWin: number;
  winPercent: number;
  sessions: GameSession[];
}

export default function SalesPage() {
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(
    null
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(
    null
  );
  const [error, setError] = useState("");

  // Handle Firebase login
  const handleLogin = async () => {
    try {
      const authInstance = getAuth();
      const userCredential = await signInWithEmailAndPassword(
        authInstance,
        email,
        password
      );
      const user = userCredential.user;

      setAuthenticatedUser(user.email || null);
      setError("");
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Invalid email or password");
    }
  };

  useEffect(() => {
    if (!authenticatedUser) return;

    const fetchSessions = async () => {
      try {
        // Fetch only sessions for the logged-in user
        const q = query(
          collection(db, "gameSessions"),
          where("userEmail", "==", authenticatedUser)
        );
        const snapshot = await getDocs(q);
        const sessions: GameSession[] = [];

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();

          let createdAt: Date | undefined;
          if (data.createdAt) {
            if (data.createdAt instanceof Timestamp) {
              createdAt = data.createdAt.toDate();
            } else if (data.createdAt.seconds) {
              createdAt = new Date(data.createdAt.seconds * 1000);
            } else {
              createdAt = new Date(data.createdAt);
            }
          }

          const selectedCartelas = Array.isArray(data.selectedCartelas)
            ? data.selectedCartelas
            : [];
          const betAmount =
            typeof data.betAmount === "number" ? data.betAmount : 0;
          const totalAmount = betAmount * selectedCartelas.length;
          const winAmount = totalAmount * 0.9;

          sessions.push({
            id: docSnap.id,
            userEmail: data.userEmail ?? "unknown",
            betAmount,
            selectedCartelas,
            createdAt,
            totalAmount,
            winAmount,
          });
        });

        // Group sessions by date
        const reports: Record<
          string,
          {
            players: number;
            sales: number;
            win: number;
            sessions: GameSession[];
          }
        > = {};

        sessions.forEach((s) => {
          if (!s.createdAt) return;
          const dateKey = s.createdAt.toLocaleDateString();
          const playerCount = s.selectedCartelas?.length || 0;

          if (!reports[dateKey]) {
            reports[dateKey] = { players: 0, sales: 0, win: 0, sessions: [] };
          }

          reports[dateKey].players += playerCount;
          reports[dateKey].sales += s.totalAmount ?? 0;
          reports[dateKey].win += s.winAmount ?? 0;
          reports[dateKey].sessions.push(s);
        });

        const daily: DailyReport[] = Object.entries(reports).map(
          ([date, data]) => ({
            date,
            players: data.players,
            totalSales: data.sales,
            totalWin: data.win,
            winPercent: data.sales > 0 ? (data.win / data.sales) * 100 : 0,
            sessions: data.sessions,
          })
        );

        daily.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setDailyReports(daily);
      } catch (error) {
        console.error("Failed to fetch game sessions", error);
      }
    };

    fetchSessions();
  }, [authenticatedUser]);

  // Show login screen until user logs in
  if (!authenticatedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4 text-center">User Login</h2>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded mb-3"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        📊 {authenticatedUser}’s Game Activity
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dailyReports.map((report) => (
          <div
            key={report.date}
            className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-xl transition cursor-pointer border border-gray-200"
          >
            <h2 className="text-lg font-bold text-gray-700 mb-2">
              {report.date}
            </h2>
            <p className="text-gray-600">
              Cards Played: <b>{report.players}</b>
            </p>
            <p className="text-gray-600">
              Total Sales: <b>{report.totalSales.toFixed(2)} ብር</b>
            </p>
            <p className="text-green-600 font-semibold">
              Win Amount: {report.totalWin.toFixed(2)} ብር
            </p>
            <p className="text-gray-500">
              Win Rate: {report.winPercent.toFixed(1)}%
            </p>
            <button
              onClick={() => setSelectedReport(report)}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg w-full"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 relative">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Game Sessions - {selectedReport.date}
            </h2>

            <table className="min-w-full table-auto border border-gray-300 text-sm mb-4">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 border">Player</th>
                  <th className="px-3 py-2 border">Bet (ብር)</th>
                  <th className="px-3 py-2 border"># Cards</th>
                  <th className="px-3 py-2 border">Total Bet (ብር)</th>
                  <th className="px-3 py-2 border">Win (ብር)</th>
                </tr>
              </thead>
              <tbody>
                {selectedReport.sessions.map((s) => (
                  <tr
                    key={s.id}
                    className="text-center border-t hover:bg-gray-50"
                  >
                    <td className="px-3 py-2 border">{s.userEmail}</td>
                    <td className="px-3 py-2 border">{s.betAmount}</td>
                    <td className="px-3 py-2 border">
                      {s.selectedCartelas?.length ?? 0}
                    </td>
                    <td className="px-3 py-2 border">
                      {s.totalAmount?.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 border text-green-600 font-semibold">
                      {s.winAmount?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
