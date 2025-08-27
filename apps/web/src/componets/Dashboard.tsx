"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import Calendar from "./Calendar";
import { auth, db } from "./Firbase";
import DownloadCardsButton from "./DownloadCardsButton";
import Sidebar from "./Sidebar";

interface DashboardProps {
  bingoPageId: string;
}

export default function Dashboard({ bingoPageId }: DashboardProps) {
  const [points, setPoints] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const [bonusAmountTotal, setBonusAmountTotal] = useState(0);
  const [jackpotTotal, setJackpotTotal] = useState(0);

  const [showPoints, setShowPoints] = useState(true);
  const [showGamesPlayed, setShowGamesPlayed] = useState(true);
  const [showBonus, setShowBonus] = useState(true);
  const [showRevenue, setShowRevenue] = useState(true);
  const [showJackpot, setShowJackpot] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      async (user: FirebaseUser | null) => {
        if (!user?.email) {
          setLoading(false);
          return;
        }

        try {
          // Get user points
          const usersRef = collection(db, "users");
          const userSnap = await getDocs(usersRef);
          const currentUser = userSnap.docs.find(
            (doc) => doc.data().email === user.email
          );
          if (currentUser) {
            setPoints(currentUser.data()?.points ?? 0);
          }

          // Get all game sessions
          const gamesRef = collection(db, "gameSessions");
          const userQuery = query(gamesRef, orderBy("createdAt", "asc"));
          const snap = await getDocs(userQuery);

          let totalBonus = 0;
          let totalJackpotCalc = 0;
          let userPlays = 0;

          snap.docs.forEach((doc) => {
            const data = doc.data();

            // Sum all jackpots globally
            totalJackpotCalc += data.jackpotAmount || 0;

            // Count games played and bonus for this user
            if (data.userEmail === user.email) {
              userPlays += 1;
              totalBonus += data.bonusAmount || 0;
            }
          });

          setPlayCount(userPlays);
          setBonusAmountTotal(totalBonus);
          setJackpotTotal(totalJackpotCalc);
        } catch (err) {
          console.error("Error fetching dashboard data:", err);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsub();
  }, [bingoPageId]);

  const revenue = jackpotTotal; // Total Revenue = Jackpot only

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500 text-lg font-semibold">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex gap-2 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-7xl">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-4xl font-extrabold text-center w-full">
              🎯 My Bingo Dashboard
            </h2>
            <DownloadCardsButton />
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
            <Card
              title="Games Played"
              value={showGamesPlayed ? playCount.toString() : "••••"}
              onToggle={() => setShowGamesPlayed(!showGamesPlayed)}
              show={showGamesPlayed}
            />
            <Card
              title="Bonus Earned"
              value={showBonus ? `${bonusAmountTotal} birr` : "••••"}
              onToggle={() => setShowBonus(!showBonus)}
              show={showBonus}
            />
            <Card
              title="Total Revenue"
              value={showRevenue ? `${revenue} birr` : "••••"}
              onToggle={() => setShowRevenue(!showRevenue)}
              show={showRevenue}
            />
            <Card
              title="Global Jackpot"
              value={showJackpot ? `${jackpotTotal} birr` : "••••"}
              onToggle={() => setShowJackpot(!showJackpot)}
              show={showJackpot}
            />
          </div>

          {/* Calendar */}
          <div className="mt-14 max-w-md mx-auto">
            <Calendar />
          </div>
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
