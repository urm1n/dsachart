"use client";

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ProgressData {
  currentScore: number;
  highestScore: number;
  lowestScore: number;
  history: {
    date: string;
    score: number;
    hadCommit: boolean;
  }[];
}

export default function Home() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [timeRange, setTimeRange] = useState<
    "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL"
  >("1M");

  useEffect(() => {
    fetch("/data/progress.json")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data)
    return <div className="text-black dark:text-white">Loading...</div>;

  const filterDataByTimeRange = () => {
    const now = new Date();
    const filteredHistory = data.history.filter((entry) => {
      const entryDate = new Date(entry.date);
      switch (timeRange) {
        case "1W":
          return now.getTime() - entryDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
        case "1M":
          return (
            now.getTime() - entryDate.getTime() <= 30 * 24 * 60 * 60 * 1000
          );
        case "3M":
          return (
            now.getTime() - entryDate.getTime() <= 90 * 24 * 60 * 60 * 1000
          );
        case "6M":
          return (
            now.getTime() - entryDate.getTime() <= 180 * 24 * 60 * 60 * 1000
          );
        case "1Y":
          return (
            now.getTime() - entryDate.getTime() <= 365 * 24 * 60 * 60 * 1000
          );
        default:
          return true;
      }
    });
    return filteredHistory;
  };

  const filteredData = filterDataByTimeRange();

  const chartData = {
    labels: filteredData.map((h) => new Date(h.date).toLocaleDateString()),
    datasets: [
      {
        label: "Progress Score",
        data: filteredData.map((h) => h.score),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgb(59, 130, 246)",
        pointBackgroundColor: filteredData.map((h) =>
          h.hadCommit ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"
        ),
        pointBorderColor: filteredData.map((h) =>
          h.hadCommit ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"
        ),
        pointRadius: 4,
        tension: 0.1,
      },
    ],
  };

  const isDarkMode =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        grid: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          borderColor: isDarkMode
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
          callback: (value: number) => value.toFixed(4),
        },
      },
      x: {
        grid: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          borderColor: isDarkMode
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        titleColor: "rgba(255, 255, 255, 0.9)",
        bodyColor: "rgba(255, 255, 255, 0.9)",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex;
            const hadCommit = filteredData[index].hadCommit;
            return `Score: ${context.raw.toFixed(4)} (${
              hadCommit ? "Committed" : "No Commit"
            })`;
          },
        },
      },
    },
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-white dark:bg-gray-900 text-black dark:text-white">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">
        CSES Progress Tracker
      </h1>

      <div className="mb-4 flex gap-2 sm:gap-4 overflow-x-auto pb-2">
        <button
          onClick={() => setTimeRange("1W")}
          className={`px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base whitespace-nowrap ${
            timeRange === "1W"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
          }`}
        >
          1 Week
        </button>
        <button
          onClick={() => setTimeRange("1M")}
          className={`px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base whitespace-nowrap ${
            timeRange === "1M"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
          }`}
        >
          1 Month
        </button>
        <button
          onClick={() => setTimeRange("3M")}
          className={`px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base whitespace-nowrap ${
            timeRange === "3M"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
          }`}
        >
          3 Months
        </button>
        <button
          onClick={() => setTimeRange("6M")}
          className={`px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base whitespace-nowrap ${
            timeRange === "6M"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
          }`}
        >
          6 Months
        </button>
        <button
          onClick={() => setTimeRange("1Y")}
          className={`px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base whitespace-nowrap ${
            timeRange === "1Y"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
          }`}
        >
          1 Year
        </button>
        <button
          onClick={() => setTimeRange("ALL")}
          className={`px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base whitespace-nowrap ${
            timeRange === "ALL"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
          }`}
        >
          All Time
        </button>
      </div>

      <div
        className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg mb-4"
        style={{ height: "40vh", minHeight: "300px" }}
      >
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="border-r dark:border-gray-700">
            <h2 className="text-sm font-semibold mb-1">Current Score</h2>
            <p className="text-lg">{data.currentScore.toFixed(4)}</p>
          </div>
          <div className="border-r dark:border-gray-700">
            <h2 className="text-sm font-semibold mb-1">Highest Score</h2>
            <p className="text-lg">{data.highestScore.toFixed(4)}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold mb-1">Lowest Score</h2>
            <p className="text-lg">{data.lowestScore.toFixed(4)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
