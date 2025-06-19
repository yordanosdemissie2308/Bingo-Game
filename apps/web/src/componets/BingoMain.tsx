"use client";

import React from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { useRouter } from "next/navigation";

const BingoMain = () => {
  const router = useRouter();

  const handlePlayClick = () => {
    router.push("/web/selected-card");
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background image */}
      <Image
        src="/bingo.jpg"
        alt="the bingo"
        fill
        className="object-cover z-0"
        priority
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 z-10" />

      {/* Center Play button */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div
          onClick={handlePlayClick}
          className="bg-white/20 backdrop-blur-md rounded-full p-5 hover:bg-white/30 transition cursor-pointer shadow-lg"
        >
          <Play className="w-14 h-14 text-white drop-shadow" />
        </div>
      </div>
    </div>
  );
};

export default BingoMain;
