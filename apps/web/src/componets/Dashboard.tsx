"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
              if (userDoc) {
                const data = userDoc.data();
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

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500 text-lg font-semibold">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-purple-100 to-indigo-200 min-h-screen">
      <div className="p-6 rounded-lg shadow-lg space-y-6 border border-purple-300 bg-white max-w-md mx-auto">
        <h2 className="font-extrabold text-3xl mb-4 text-indigo-700 text-center tracking-wide">
          My Info
        </h2>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-lg text-gray-700">Points:</span>
          <span className="text-xl font-bold text-indigo-600">
            {showPoints
              ? totalPoints
              : "•".repeat(totalPoints.toString().length)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-lg text-gray-700">
            Remaining:
          </span>
          <span className="text-xl font-bold text-indigo-600">
            {showPoints
              ? remainingPoints
              : "•".repeat(remainingPoints.toString().length || 1)}
          </span>
        </div>

        <button
          className="w-full mt-6 px-4 py-3 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-shadow shadow-md hover:shadow-lg flex items-center justify-center gap-3"
          onClick={() => setShowPoints((prev) => !prev)}
          type="button"
          aria-label="Toggle points visibility"
        >
          {showPoints ? <EyeOff size={20} /> : <Eye size={20} />}
          {showPoints ? "Hide Points" : "Show Points"}
        </button>
      </div>

      <div className="mt-10 max-w-md mx-auto">
        <Calendar />
      </div>
    </div>
  );
}
