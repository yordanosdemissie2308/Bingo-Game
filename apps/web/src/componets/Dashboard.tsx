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
                // <-- Added this check to fix the error
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
              } else {
                console.warn("User document is undefined.");
              }
            } else {
              console.warn("User document not found.");
            }
          } catch (err) {
            console.error("Error fetching user or play data:", err);
          }
        } else {
          console.warn("User not signed in.");
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [bingoPageId]);

  const totalPoints = userData.points ?? 0;
  const remainingPoints = Math.max(totalPoints - playCount * 10, 0);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="bg-white p-4 rounded shadow space-y-4">
        <h2 className="font-bold text-xl mb-2">My Info</h2>

        <div className="flex items-center justify-between">
          <span className="font-medium">Points:</span>
          <span className="text-lg font-semibold">
            {showPoints
              ? totalPoints
              : "•".repeat(totalPoints.toString().length)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium">Remaining:</span>
          <span className="text-lg font-semibold">
            {showPoints
              ? remainingPoints
              : "•".repeat(remainingPoints.toString().length || 1)}
          </span>
        </div>

        <button
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          onClick={() => setShowPoints((prev) => !prev)}
        >
          <div className="flex items-center gap-2">
            {showPoints ? <EyeOff /> : <Eye />}
            {showPoints ? "Hide Points" : "Show Points"}
          </div>
        </button>
      </div>

      <Calendar />
    </div>
  );
}
