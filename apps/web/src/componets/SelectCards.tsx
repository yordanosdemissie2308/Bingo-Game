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
import { Eye, EyeOff } from "lucide-react";

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
  number?: number; // card number
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
  // Now store selected cards by their card number (not indices)
  const [selectedCartelaNumbers, setSelectedCartelaNumbers] = useState<
    number[]
  >([]);

  const [searchNumber, setSearchNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeCount, setTypeCount] = useState(0);
  const [selectedPercent, setSelectedPercent] = useState(100); // Default to 100%
  const [showPercent, setShowPercent] = useState(true);

  const isAmharic = language === "Amharic";
  const points = userData.points ?? 0;
  const [showEnterCardModal, setShowEnterCardModal] = useState(false);
  const [show, setShow] = useState(true);

  const [enteredCardNumber, setEnteredCardNumber] = useState("");
  const [enterCardError, setEnterCardError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const percentageOptions = [25, 50, 75, 100];

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
        const list = snap.docs.map((doc, idx) => {
          const data = doc.data() as Cartela;
          // Ensure every card has a unique 'number' property
          return { id: doc.id, number: data.number ?? idx + 1, ...data };
        });
        setCartelas(list);

        const saved = localStorage.getItem("selectedCartelaNumbers");
        if (saved) {
          const savedNumbers = JSON.parse(saved) as number[];
          // Filter only valid numbers present in cartelas
          const validNumbers = savedNumbers.filter((num) =>
            list.some((c) => c.number === num)
          );
          setSelectedCartelaNumbers(validNumbers);
        }
      } catch {
        setError(isAmharic ? "የካርቴላ መጫኛ አልተሳካም።" : "Failed to load cartelas.");
      }
    }

    fetchCartelas();
  }, [isAmharic]);

  useEffect(() => {
    localStorage.setItem(
      "selectedCartelaNumbers",
      JSON.stringify(selectedCartelaNumbers)
    );
  }, [selectedCartelaNumbers]);

  const toggleCartelaSelection = (index: number) => {
    const cardNumber = cartelas[index]?.number;
    if (!cardNumber) return;

    setSelectedCartelaNumbers((prev) =>
      prev.includes(cardNumber)
        ? prev.filter((n) => n !== cardNumber)
        : [...prev, cardNumber]
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
    if (!selectedCartelaNumbers.length) {
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

      // Save full selected cartelas data in localStorage using actual numbers
      const selectedCartelasData = selectedCartelaNumbers
        .map((num) => cartelas.find((c) => c.number === num))
        .filter(Boolean);
      localStorage.setItem(
        "selectedCartelasData",
        JSON.stringify(selectedCartelasData)
      );

      await addDoc(collection(db, "gameSessions"), {
        userEmail: user.email,
        selectedCartelas: selectedCartelaNumbers, // send card numbers, NOT indices
        betAmount,
        bonusAmount,
        bonusType: bonusOptions[bonusTypeIndex],
        gameType,
        speed,
        createdAt: new Date(),
      });

      router.push(`/web/play-bingo`);
    } catch (err) {
      console.error("Error storing game session:", err);
      alert("Failed to update points or store session");
    }
  };

  const incrementBet = () => {
    setBetAmount((v) => Math.min(v + 10, 50));
  };

  const decrementBet = () => {
    setBetAmount((v) => Math.max(v - 10, 10));
  };

  const winAmount =
    (betAmount * selectedCartelaNumbers.length * selectedPercent) / 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        {isAmharic ? "መጫን እየተካሄደ ነው..." : "Loading..."}
      </div>
    );
  }

  return (
    <div>
      {selectedCartelaNumbers.length > 0 && (
        <div className="flex gap-5 mt-7 m-10 text-4xl p-3 justify-center">
          {selectedCartelaNumbers.map((cardNum) => (
            <div
              key={cardNum}
              className="bg-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center font-bold text-3xl shadow"
            >
              {cardNum}
            </div>
          ))}
        </div>
      )}
      <div className="min-h-screen p-6 flex flex-col items-start ">
        <h1 className="text-5xl font-extrabold mb-10">
          {isAmharic ? "ካርቴላ ምረጥ" : "Select Your Cartelas"}
        </h1>

        <p className="text-xl font-bold mb-6">
          {isAmharic ? "ነጥብዎ፡" : "Your Points:"} {points}
        </p>

        <div className="flex justify-between items-start w-full mb-6">
          <div className="flex items-center gap-10">
            <div className="flex gap-2 items-center min-w-[180px]">
              <span className="text-black font-bold mb-3 text-lg select-none">
                {isAmharic ? "የትርፍ መጠን" : "Bet Amount"}
              </span>
              <div className="flex items-center">
                <button
                  onClick={decrementBet}
                  disabled={betAmount <= 10}
                  className="w-10 h-10 border-black rounded-md shadow-md text-red-700 text-2xl"
                >
                  -
                </button>
                <div className="p-[2px] rounded-2xl">
                  <div className="bg-blue-200 px-6 py-2 text-black font-bold rounded-sm min-w-[100px] text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white opacity-10 rounded-t-sm pointer-events-none" />
                    {betAmount} birr
                  </div>
                </div>
                <button
                  onClick={incrementBet}
                  disabled={betAmount >= 50}
                  className="w-10 h-10 border-black rounded-md shadow-md text-black text-2xl"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center min-w-[220px]">
              {/* Win Amount with Eye Toggle */}
              <div className="flex items-center gap-4">
                <span className="text-black font-bold mb-3 text-lg select-none">
                  {isAmharic ? "የእድል መጠን" : "Win Amount"}
                </span>

                <div
                  onClick={() => setShow(!show)}
                  className="cursor-pointer px-4 py-2 bg-blue-100 text-blue-700 rounded-md shadow-sm hover:bg-blue-200 flex items-center gap-2 font-semibold"
                >
                  {show ? `${winAmount.toFixed(2)} birr` : "****"}
                  {show ? <Eye size={18} /> : <EyeOff size={18} />}
                </div>
              </div>

              {/* Percentage Dropdown */}
              <div className="mt-3 relative">
                <select
                  value={selectedPercent}
                  onChange={(e) => setSelectedPercent(Number(e.target.value))}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-black bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {[25, 50, 75, 100].map((percent) => (
                    <option key={percent} value={percent}>
                      {percent}%
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
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
            <button
              onClick={handlePlayClick}
              disabled={!selectedCartelaNumbers.length}
              className="bg-gradient-to-br from-orange-400 to-orange-600 text-white font-extrabold px-10 py-4 rounded-md shadow-lg text-xl 
        transition hover:scale-105 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isAmharic ? "ጀምር" : "Play"}
            </button>
          </div>
        </div>

        {error ? (
          <p className="text-red-400">{error}</p>
        ) : (
          <div className="flex  ">
            <div className="grid grid-cols-7 gap-4 justify-start">
              {cartelas.map((c, idx) => {
                const sel = selectedCartelaNumbers.includes(c.number ?? -1);
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
                    {c.number ?? idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
                    const cardNumber = parseInt(enteredCardNumber);
                    if (isNaN(cardNumber)) {
                      setEnterCardError(
                        isAmharic ? "የተሳሳተ ቁጥር ነው።" : "Invalid card number."
                      );
                      return;
                    }
                    const cardIndex = cartelas.findIndex(
                      (c) => c.number === cardNumber
                    );

                    if (cardIndex === -1) {
                      setEnterCardError(
                        isAmharic ? "ካርድ አልተገኘም።" : "Card not found."
                      );
                      return;
                    }

                    setSelectedCartelaNumbers((prev) =>
                      prev.includes(cardNumber) ? prev : [...prev, cardNumber]
                    );

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
      <div className="flex justify-center items-center shadow-2xl rounded-3xl gap-4 p-6 self-end">
        selected cards number:
        <p>{selectedCartelaNumbers.length}</p>
      </div>
    </div>
  );
}
