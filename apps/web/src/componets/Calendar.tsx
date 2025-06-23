"use client";
import { useState } from "react";
import dayjs from "dayjs";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(dayjs());

  const startDay = currentDate.startOf("month").startOf("week");
  const endDay = currentDate.endOf("month").endOf("week");

  const days = [];
  let day = startDay;

  while (day.isBefore(endDay, "day")) {
    days.push(day);
    day = day.add(1, "day");
  }

  const isSameMonth = (day: dayjs.Dayjs) => day.month() === currentDate.month();
  const isToday = (day: dayjs.Dayjs) => day.isSame(dayjs(), "day");

  return (
    <div className="p-4  rounded-lg shadow-md max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrentDate(currentDate.subtract(1, "month"))}
          className="text-orange-600 font-bold"
        >
          ←
        </button>
        <h2 className="text-xl font-bold">{currentDate.format("MMMM YYYY")}</h2>
        <button
          onClick={() => setCurrentDate(currentDate.add(1, "month"))}
          className="text-orange-600 font-bold"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center font-medium mb-2">
        {weekdays.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-sm">
        {days.map((d) => (
          <div
            key={d.toString()}
            className={`p-2 rounded-lg cursor-pointer 
              ${isToday(d) ? "bg-blue-500 text-white" : ""}
              ${!isSameMonth(d) ? "text-gray-400" : ""}
              ${isSameMonth(d) && !isToday(d) ? "hover:bg-blue-100" : ""}
            `}
          >
            {d.date()}
          </div>
        ))}
      </div>
    </div>
  );
}
