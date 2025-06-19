import React from "react";
import Sidebar from "../../../../componets/Sidebar";

export const Home = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto"></div>
    </div>
  );
};

export default Home;
