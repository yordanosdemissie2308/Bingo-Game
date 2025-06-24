"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import Calendar from "./Calendar";
import { auth, db } from "./Firbase";
import DownloadCardsButton from "./DownloadCardsButton";

interface DashboardProps {
  bingoPageId: string;
}

interface SessionBonus {
  bonusAmount: number;
  createdAt: string;
  bonusType?: string;
}

export default function Dashboard({ bingoPageId }: DashboardProps) {
  const [points, setPoints] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const [bonusAmountTotal, setBonusAmountTotal] = useState(0);
  const [showPoints, setShowPoints] = useState(true);
  const [showGamesPlayed, setShowGamesPlayed] = useState(true);
  const [showBonus, setShowBonus] = useState(true);
  const [showRevenue, setShowRevenue] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      async (user: FirebaseUser | null) => {
        if (!user?.email) {
          setLoading(false);
          return;
        }

        const usersRef = collection(db, "users");
        const userSnap = await getDocs(
          query(usersRef, where("email", "==", user.email))
        );
        if (!userSnap.empty) {
          const data = userSnap.docs[0]?.data();
          setPoints(data?.points ?? 0);
        }

        const gamesRef = collection(db, "gameSessions");
        const sessionQuery = query(
          gamesRef,
          where("userEmail", "==", user.email),
          where("bingoPageId", "==", bingoPageId),
          orderBy("createdAt", "asc")
        );

        let snap;
        try {
          snap = await getDocs(sessionQuery);
        } catch {
          snap = await getDocs(
            query(gamesRef, where("userEmail", "==", user.email))
          );
        }

        let totalBonusAmount = 0;
        snap.docs.forEach((doc) => {
          const data = doc.data();
          totalBonusAmount += data.bonusAmount || 0;
        });

        setPlayCount(snap.docs.length);
        setBonusAmountTotal(totalBonusAmount);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [bingoPageId]);

  const revenue = bonusAmountTotal + playCount * 50;

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500 text-lg font-semibold">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-extrabold text-center">
            🎯 My Bingo Dashboard
          </h2>
          <DownloadCardsButton />
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {/* Points */}
          <Card
            title="Points"
            value={
              showPoints
                ? points.toString()
                : "•".repeat(points.toString().length)
            }
            onToggle={() => setShowPoints(!showPoints)}
            show={showPoints}
          />

          {/* Games Played */}
          <Card
            title="Games Played"
            value={showGamesPlayed ? playCount.toString() : "••••"}
            onToggle={() => setShowGamesPlayed(!showGamesPlayed)}
            show={showGamesPlayed}
          />

          {/* Bonus */}
          <Card
            title="Bonus Earned"
            value={showBonus ? `${bonusAmountTotal} birr` : "••••"}
            onToggle={() => setShowBonus(!showBonus)}
            show={showBonus}
          />

          {/* Revenue */}
          <Card
            title="Total Revenue"
            value={showRevenue ? `${revenue} birr` : "••••"}
            onToggle={() => setShowRevenue(!showRevenue)}
            show={showRevenue}
            className="sm:col-span-2 md:col-span-1"
          />
        </div>

        {/* Calendar */}
        <div className="mt-14 max-w-md mx-auto">
          <Calendar />
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  onToggle,
  show,
  className = "",
}: {
  title: string;
  value: string;
  onToggle: () => void;
  show: boolean;
  className?: string;
}) {
  return (
    <div
      className={`bg-white/80 backdrop-blur-md dark:bg-black/30 p-6 rounded-xl shadow-xl border border-neutral-300 relative transition ${className}`}
    >
      <h4 className="font-semibold text-lg mb-2">{title}</h4>
      <p className="text-3xl font-bold">{value}</p>
      <button
        onClick={onToggle}
        className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-black dark:text-white rounded-full p-2 transition"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
