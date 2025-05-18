"use client";

import { useState, useEffect } from "react";
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
  const [quote, setQuote] = useState(
    "Thinking you're no-good and worthless is the worst thing you can do"
  );
  const [author, setAuthor] = useState("Nobito");

  useEffect(() => {
    // Check if we have a stored quote and it's from today
    const storedQuote = localStorage.getItem("dailyQuote");
    const storedDate = localStorage.getItem("quoteDate");
    const today = new Date().toDateString();

    if (storedQuote && storedDate === today) {
      // Use stored quote if it's from today
      const { content, author } = JSON.parse(storedQuote);
      setQuote(content);
      setAuthor(author);
    } else {
      // Fetch new quote if no stored quote or it's old
      fetch("https://quotes-api-self.vercel.app/quote")
        .then((res) => res.json())
        .then((data) => {
          setQuote(data.quote);
          setAuthor(data.author);
          // Store the new quote and date
          localStorage.setItem(
            "dailyQuote",
            JSON.stringify({
              content: data.quote,
              author: data.author,
            })
          );
          localStorage.setItem("quoteDate", today);
        })
        .catch(() => {
          // Fallback quote is already set in useState
        });
    }
  }, []);

  useEffect(() => {
    fetch("https://urm1n.github.io/dsachart/data/progress.json")
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

  // Add this function to calculate score change
  const calculateScoreChange = () => {
    if (filteredData.length < 2) return null;
    const firstScore = filteredData[0].score;
    const lastScore = filteredData[filteredData.length - 1].score;
    const change = ((lastScore - firstScore) / firstScore) * 100;
    return {
      value: change,
      isPositive: change >= 0,
    };
  };

  const scoreChange = calculateScoreChange();

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-white dark:bg-gray-900 text-black dark:text-white font-['Inter']">
      <div className="flex items-baseline justify-between mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 font-['JetBrains Mono']">
            Current Score
          </p>
          <div className="flex items-baseline gap-3">
            <p className="font-['JetBrains Mono'] text-5xl font-bold text-gray-900 dark:text-white">
              {data.currentScore.toFixed(4)}
            </p>
            {scoreChange && (
              <div
                className={`flex items-center ${
                  scoreChange.isPositive
                    ? "text-emerald-500 dark:text-emerald-400"
                    : "text-rose-500 dark:text-rose-400"
                }`}
              >
                <span className="font-['JetBrains Mono'] text-2xl font-medium">
                  {scoreChange.isPositive ? "+" : ""}
                  {scoreChange.value.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <p className="mt-4 text-sm italic text-gray-600 dark:text-gray-400 font-light">
            {quote} <span className="text-xs">- {author}</span>
          </p>
        </div>
      </div>

      <div className="mb-4 flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {ranges.map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base whitespace-nowrap font-medium ${
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

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
          <div>
            <p className="text-rose-600 dark:text-rose-400 font-medium uppercase tracking-wider text-xs font-['JetBrains Mono']">
              Lowest Point
            </p>
            <p className="font-['JetBrains Mono'] text-lg font-bold text-rose-700 dark:text-rose-300">
              {data.lowestScore.toFixed(4)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <div>
            <p className="text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider text-xs font-['JetBrains Mono']">
              Highest Point
            </p>
            <p className="font-['JetBrains Mono'] text-lg font-bold text-emerald-700 dark:text-emerald-300">
              {data.highestScore.toFixed(4)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
