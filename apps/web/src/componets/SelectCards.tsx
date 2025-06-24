"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  getDocs,
  collection,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "./Firbase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

const gameTypes = ["Person", "Heart", "H", "T", "P"];

const bonusOptions = [
  "5 CALL",
  "OnlyCorner",
  "OnlyPlus",
  "L",
  "T",
  "X",
  "24 CALL",
  "19 CALL",
  "10 CALL",
  "9 CALL",
  "8 CALL",
  "7 CALL",
  "6 CALL",
];

interface Cartela {
  id?: string;
  numbers?: number[] | string;
  [key: string]: any;
}

export default function SelectCards() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<{ points?: number }>({});
  const [language, setLanguage] = useState<"English" | "Amharic">("English");

  const [speed, setSpeed] = useState(4000);
  const [gameType, setGameType] = useState(gameTypes[0]);
  const [bonusTypeIndex, setBonusTypeIndex] = useState(0);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [betAmount, setBetAmount] = useState(10);

  const [cartelas, setCartelas] = useState<Cartela[]>([]);
  const [selectedCartelaIndices, setSelectedCartelaIndices] = useState<
    number[]
  >([]);
  const [searchNumber, setSearchNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeCount, setTypeCount] = useState(0);

  const isAmharic = language === "Amharic";
  const points = userData.points ?? 0;
  const [showEnterCardModal, setShowEnterCardModal] = useState(false);
  const [enteredCardNumber, setEnteredCardNumber] = useState("");
  const [enterCardError, setEnterCardError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser?.email) {
        setUser(firebaseUser);
        try {
          const usersRef = collection(db, "users");
          const userQuery = query(
            usersRef,
            where("email", "==", firebaseUser.email)
          );
          const userSnapshot = await getDocs(userQuery);
          if (!userSnapshot.empty && userSnapshot.docs[0]) {
            const data = userSnapshot.docs[0].data();
            setUserData({ points: data?.points ?? 0 });
          } else {
            setUserData({ points: 0 });
          }
        } catch {
          setUserData({ points: 0 });
        }
      } else {
        setUser(null);
        setUserData({ points: 0 });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchCartelas() {
      try {
        const snap = await getDocs(collection(db, "cartelas"));
        const list = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Cartela
        );
        setCartelas(list);

        const saved = localStorage.getItem("selectedCartelasIndices");
        if (saved) {
          const idx = JSON.parse(saved) as number[];

          const valid = idx.filter((i) => i >= 0 && i < list.length);
          setSelectedCartelaIndices(valid);
        }
      } catch {
        setError(isAmharic ? "የካርቴላ መጫኛ አልተሳካም።" : "Failed to load cartelas.");
      }
    }

    fetchCartelas();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "selectedCartelasIndices",
      JSON.stringify(selectedCartelaIndices)
    );
  }, [selectedCartelaIndices]);

  const toggleCartelaSelection = (i: number) => {
    setSelectedCartelaIndices((prev) =>
      prev.includes(i)
        ? prev.filter((x) => x !== i)
        : !prev.includes(i)
          ? [...prev, i]
          : prev
    );
  };

  const isNumberInCartela = (
    numbers: number[] | string | undefined,
    target: number
  ) => {
    if (!numbers || typeof numbers === "string") return false;
    return numbers.includes(target);
  };

  const handlePlayClick = async () => {
    if (!selectedCartelaIndices.length) {
      alert(
        isAmharic
          ? "እባክዎን አንድ ካርቴላ ይምረጡ።"
          : "Please select at least one cartela."
      );
      return;
    }

    if (points < 50) {
      alert(isAmharic ? "በቂ ነጥብ የለዎትም።" : "Not enough points (need 50).");
      return;
    }

    if (!user?.email) {
      alert("User not logged in.");
      return;
    }

    try {
      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("email", "==", user.email));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        if (userDoc?.id) {
          const ref = doc(db, "users", userDoc.id);
          await updateDoc(ref, { points: points - 50 });
          setUserData({ points: points - 50 });
        } else {
          alert("User document is invalid.");
          return;
        }
      } else {
        alert("User document not found.");
        return;
      }

      const selectedCartelaIds = selectedCartelaIndices
        .map((i) => cartelas[i]?.id)
        .filter((id): id is string => !!id);

      await addDoc(collection(db, "gameSessions"), {
        userEmail: user.email,
        selectedCartelas: selectedCartelaIds,
        betAmount,
        bonusAmount,

        bonusType: bonusOptions[bonusTypeIndex], // Store selected bonus type string
        gameType,
        speed,
        createdAt: new Date(),
      });

      const params = new URLSearchParams();
      params.set("selected", selectedCartelaIds.join(","));
      params.set("bet", String(betAmount));
      params.set("bonusAmount", String(bonusAmount));
      params.set("bonusType", bonusOptions[bonusTypeIndex] ?? "");
      params.set("gameType", gameType ?? "Person");
      params.set("speed", String(speed));

      router.push(`/web/play-bingo?${params.toString()}`);
    } catch (err) {
      console.error("Error storing game session:", err);
      alert("Failed to update points or store session");
    }
  };
  const incrementType = () => {
    setTypeCount((prev) => prev + 1);
  };

  const decrementType = () => {
    setTypeCount((prev) => (prev > 0 ? prev - 1 : 0));
  };

  // Increment / Decrement handlers for numeric values
  const incrementBet = () => {
    setBetAmount((v) => Math.min(v + 10, 50));
  };

  const decrementBet = () => {
    setBetAmount((v) => Math.max(v - 10, 10));
  };

  const incrementBonus = () => {
    setBonusAmount((v) => Math.min(v + 10, 100));
  };

  const decrementBonus = () => {
    setBonusAmount((v) => Math.max(v - 0, 0));
  };

  // Increment / Decrement handlers for cycling bonusType
  const decrementBonusType = () => {
    setBonusTypeIndex((prev) =>
      prev === 0 ? bonusOptions.length - 1 : prev - 1
    );
  };

  const incrementBonusType = () => {
    setBonusTypeIndex((prev) =>
      prev === bonusOptions.length - 1 ? 0 : prev + 1
    );
  };
  useEffect(() => {
    const saved = localStorage.getItem("selectedCartelasIndices");
    if (saved) {
      const prev = JSON.parse(saved) as number[];
      localStorage.setItem("previousCartelasIndices", JSON.stringify(prev));
    }

    localStorage.setItem(
      "selectedCartelasIndices",
      JSON.stringify(selectedCartelaIndices)
    );
  }, [selectedCartelaIndices]);
  const handlePrevClick = () => {
    const prev = localStorage.getItem("previousCartelasIndices");
    if (prev) {
      const parsed = JSON.parse(prev) as number[];
      const valid = parsed.filter((i) => i >= 0 && i < cartelas.length);
      setSelectedCartelaIndices(valid);
    } else {
      alert(isAmharic ? "የቀድሞ ካርዶች አልተገኙም።" : "No previous selections found.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        {isAmharic ? "መጫን እየተካሄደ ነው..." : "Loading..."}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 flex flex-col items-center ">
      <h1 className="text-5xl font-extrabold mb-10">
        {isAmharic ? "ካርቴላ ምረጥ" : "Select Your Cartelas"}
      </h1>

      <p className="text-xl font-bold mb-6">
        {isAmharic ? "ነጥብዎ፡" : "Your Points:"} {points}
      </p>

      <div className="flex items-center gap-6 mb-6">
        <div className="flex flex-col items-center w-40  p-3 rounded-lg">
          <label className="mb-1 font-semibold text-white">
            {isAmharic ? "የጨዋታ አይነት" : "Game Type"}
          </label>
          <select
            value={gameType}
            onChange={(e) => setGameType(e.target.value)}
            className="bg-white text-black rounded px-2 py-1 w-full"
          >
            {gameTypes.map((gt, i) => (
              <option key={i} value={gt}>
                {gt}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col items-center w-48  p-3 rounded-lg">
          <label className="mb-1 font-semibold text-white">
            {isAmharic ? "አይነት ቁጥር" : "Type Count"}
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={decrementType}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg"
            >
              -
            </button>
            <div className="text-white font-semibold text-center w-28 text-xl">
              {typeCount}
            </div>
            <button
              onClick={incrementType}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-lg"
            >
              +
            </button>
          </div>
        </div>
        {/* <div className="flex flex-col items-center w-48 bg-white/10 p-3 rounded-lg">
  <label className="mb-1 font-semibold text-white">
    {isAmharic ? "አይነት ቁጥር" : "Type Count"}
  </label>
  <div className="flex items-center gap-4">
    <button
      onClick={decrementType}
      className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg"
    >
      -
    </button>
    <div className="text-white font-semibold text-center w-28 text-xl">
      {typeCount}
    </div>
    <button
      onClick={incrementType}
      className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-lg"
    >
      +
    </button>
  </div>
</div> */}
      </div>

      {error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <div className="flex bg-[#0D2B4B] p-4 rounded-xl max-w-full overflow-hidden shadow-lg mb-12">
          <div className="grid grid-cols-7 gap-4 max-h-[350px] overflow-y-scroll pr-4">
            {cartelas.map((c, idx) => {
              const sel = selectedCartelaIndices.includes(idx);
              const disabled = false;
              const match =
                searchNumber &&
                isNumberInCartela(c.numbers, Number(searchNumber));
              return (
                <button
                  key={c.id ?? idx}
                  disabled={disabled}
                  onClick={() => toggleCartelaSelection(idx)}
                  className={`w-16 h-16 rounded-full text-sm font-bold flex items-center justify-center border-2 shadow-md ${
                    sel
                      ? "bg-blue-600 text-white border-white"
                      : match
                        ? "bg-orange-600 text-white border-white"
                        : "bg-gray-300 text-black border-gray-500"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* All controls below the play button */}
      <div className="flex items-center justify-between gap-6 w-full max-w-6xl p-6">
        {/* Bonus Type */}
        <div className="flex flex-col items-center min-w-[150px]">
          <span className="text-white font-bold mb-3 text-lg select-none">
            {isAmharic ? "ቦኑስ አይነት" : "Bonus Type"}
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={decrementBonusType}
              className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 text-white font-bold text-xl rounded-md border border-black shadow-md hover:brightness-110"
            >
              -
            </button>
            <div className="text-white font-semibold text-xl min-w-[80px] text-center truncate">
              {bonusOptions[bonusTypeIndex] ?? "None"}
            </div>
            <button
              onClick={incrementBonusType}
              className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 text-white font-bold text-xl rounded-md border border-black shadow-md hover:brightness-110"
            >
              +
            </button>
          </div>
        </div>

        {/* Bonus Amount */}
        <div className="flex flex-col items-center min-w-[150px]">
          <span className="text-white font-bold mb-3 text-lg select-none">
            {isAmharic ? "ቦኑስ መጠን" : "Bonus Amount"}
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={decrementBonus}
              disabled={bonusAmount <= 0}
              className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 border border-black rounded-md shadow-md text-white text-2xl font-bold disabled:opacity-40"
            >
              -
            </button>
            <div className="p-[2px] bg-gradient-to-br from-orange-500 to-orange-700 rounded-md shadow-md">
              <div className="bg-black px-6 py-2 text-white text-xl font-extrabold rounded-sm min-w-[100px] text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white opacity-10 rounded-t-sm pointer-events-none" />
                {bonusAmount} birr
              </div>
            </div>
            <button
              onClick={incrementBonus}
              disabled={bonusAmount >= 100}
              className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 border border-black rounded-md shadow-md text-white text-2xl font-bold disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        {/* Bet Amount */}
        <div className="flex flex-col items-center min-w-[150px]">
          <span className="text-white font-bold mb-3 text-lg select-none">
            {isAmharic ? "የትርፍ መጠን" : "Bet Amount"}
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={decrementBet}
              disabled={betAmount <= 10}
              className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 border border-black rounded-md shadow-md text-white text-2xl font-bold disabled:opacity-40"
            >
              -
            </button>
            <div className="p-[2px] bg-gradient-to-br from-orange-500 to-orange-700 rounded-md shadow-md">
              <div className="bg-black px-6 py-2 text-white text-xl font-extrabold rounded-sm min-w-[100px] text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white opacity-10 rounded-t-sm pointer-events-none" />
                {betAmount} birr
              </div>
            </div>
            <button
              onClick={incrementBet}
              disabled={betAmount >= 100}
              className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 border border-black rounded-md shadow-md text-white text-2xl font-bold disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            setEnteredCardNumber("");
            setEnterCardError("");
            setShowEnterCardModal(true);
          }}
          className="bg-gradient-to-br from-orange-400 to-orange-600 text-white font-extrabold px-6 py-3 rounded-md shadow-lg text-lg transition hover:scale-105 active:scale-95"
        >
          {isAmharic ? "ካርድ አስገባ" : "Enter Card"}
        </button>
      </div>
      <button
        onClick={handlePlayClick}
        disabled={!selectedCartelaIndices.length}
        className="bg-gradient-to-br from-orange-400 to-orange-600 text-white font-extrabold px-10 py-4 rounded-md shadow-lg text-xl 
    transition hover:scale-105 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isAmharic ? "ጀምር" : "play"}
      </button>
      {showEnterCardModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-black">
              {isAmharic ? "ካርድ ቁጥር ያስገቡ" : "Enter Card Number"}
            </h2>
            <input
              type="number"
              value={enteredCardNumber}
              onChange={(e) => setEnteredCardNumber(e.target.value)}
              placeholder={isAmharic ? "ካርድ ቁጥር..." : "Card number..."}
              className="w-full border border-gray-300 rounded-md px-4 py-2 mb-4 text-black"
            />
            {enterCardError && (
              <p className="text-red-500 text-sm mb-2">{enterCardError}</p>
            )}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowEnterCardModal(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
              >
                {isAmharic ? "ይቅር" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  const index = parseInt(enteredCardNumber) - 1;
                  if (isNaN(index) || index < 0 || index >= cartelas.length) {
                    setEnterCardError(
                      isAmharic ? "የተሳሳተ ቁጥር ነው።" : "Invalid card number."
                    );
                    return;
                  }

                  setSelectedCartelaIndices((prev) => [...prev, index]);

                  setShowEnterCardModal(false);
                  setEnteredCardNumber("");
                  setEnterCardError("");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                {isAmharic ? "አስገባ" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
