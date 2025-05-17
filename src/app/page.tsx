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
  ChartOptions,
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

interface HistoryEntry {
  date: string;
  score: number;
  hadCommit: boolean;
}

interface ProgressData {
  currentScore: number;
  highestScore: number;
  lowestScore: number;
  history: HistoryEntry[];
}

type TimeRange = "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";

export default function Home() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("1M");

  useEffect(() => {
    fetch("/data/progress.json")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data)
    return <div className="text-black dark:text-white">Loading...</div>;

  const now = new Date();
  const filteredData = data.history.filter((entry) => {
    const entryDate = new Date(entry.date);
    const msInDay = 24 * 60 * 60 * 1000;

    switch (timeRange) {
      case "1W":
        return now.getTime() - entryDate.getTime() <= 7 * msInDay;
      case "1M":
        return now.getTime() - entryDate.getTime() <= 30 * msInDay;
      case "3M":
        return now.getTime() - entryDate.getTime() <= 90 * msInDay;
      case "6M":
        return now.getTime() - entryDate.getTime() <= 180 * msInDay;
      case "1Y":
        return now.getTime() - entryDate.getTime() <= 365 * msInDay;
      case "ALL":
        return true;
    }
  });

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

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        grid: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
          callback: (value) => Number(value).toFixed(4),
        },
      },
      x: {
        grid: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
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
          font: { size: 14 },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "rgba(255, 255, 255, 0.9)",
        bodyColor: "rgba(255, 255, 255, 0.9)",
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const hadCommit = filteredData[index]?.hadCommit ?? false;
            return `Score: ${Number(context.raw).toFixed(4)} (${
              hadCommit ? "Committed" : "No Commit"
            })`;
          },
        },
      },
    },
  };

  const ranges: TimeRange[] = ["1W", "1M", "3M", "6M", "1Y", "ALL"];
  const rangeLabels: Record<TimeRange, string> = {
    "1W": "1 Week",
    "1M": "1 Month",
    "3M": "3 Months",
    "6M": "6 Months",
    "1Y": "1 Year",
    ALL: "All Time",
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-white dark:bg-gray-900 text-black dark:text-white">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">
        CSES Progress Tracker
      </h1>

      <div className="mb-4 flex gap-2 sm:gap-4 overflow-x-auto pb-2">
        {ranges.map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base whitespace-nowrap ${
              timeRange === range
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
            }`}
          >
            {rangeLabels[range]}
          </button>
        ))}
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
