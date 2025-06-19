"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Download } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import Calendar from "./Calendar";
import { auth, db } from "./Firbase";

interface UserData {
  points?: number;
}

interface DashboardProps {
  bingoPageId: string;
}

export default function Dashboard({ bingoPageId }: DashboardProps) {
  const [userData, setUserData] = useState<UserData>({});
  const [playCount, setPlayCount] = useState(0);
  const [showPoints, setShowPoints] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser?.email && firebaseUser.uid) {
          try {
            const usersRef = collection(db, "users");
            const userQuery = query(
              usersRef,
              where("email", "==", firebaseUser.email)
            );
            const userSnapshot = await getDocs(userQuery);

            if (!userSnapshot.empty) {
              const userDoc = userSnapshot.docs[0];
              const data = userDoc?.data();
              const userPoints = data?.points ?? 0;
              setUserData({ points: userPoints });

              const playsRef = collection(db, "plays");
              const playsQuery = query(
                playsRef,
                where("userId", "==", firebaseUser.uid),
                where("bingoPageId", "==", bingoPageId)
              );
              const playsSnapshot = await getDocs(playsQuery);
              setPlayCount(playsSnapshot.size);
            }
          } catch (err) {
            console.error("Error fetching user or play data:", err);
          }
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [bingoPageId]);

  const totalPoints = userData.points ?? 0;
  const remainingPoints = Math.max(totalPoints - playCount * 10, 0);

  const handleDownload = () => {
    const content = `Total Points: ${totalPoints}\nRemaining Points: ${remainingPoints}\nPlay Count: ${playCount}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "bingo-stats.txt";
    a.click();

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="bg-white p-6 rounded-xl shadow space-y-6">
        <h2 className="font-bold text-xl">My Info</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-indigo-50 rounded-lg p-4 shadow flex flex-col">
            <span className="text-sm text-gray-600 mb-1">Points</span>
            <span className="text-2xl font-bold text-indigo-800">
              {showPoints
                ? totalPoints
                : "•".repeat(totalPoints.toString().length)}
            </span>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4 shadow flex flex-col">
            <span className="text-sm text-gray-600 mb-1">Remaining</span>
            <span className="text-2xl font-bold text-indigo-800">
              {showPoints
                ? remainingPoints
                : "•".repeat(remainingPoints.toString().length || 1)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4">
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition flex items-center gap-2"
            onClick={() => setShowPoints((prev) => !prev)}
          >
            {showPoints ? <EyeOff /> : <Eye />}
            {showPoints ? "Hide Points" : "Show Points"}
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      <div className="mt-6">
        <Calendar />
      </div>
    </div>
  );
}
