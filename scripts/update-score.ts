import { Octokit } from "octokit";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

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

const octokit = new Octokit({
  auth: process.env.PAT_TOKEN,
});

const INITIAL_SCORE = 1.0;
const MULTIPLIER_SUCCESS = 1.01;
const MULTIPLIER_FAILURE = 0.99;
const START_DATE = new Date("2025-05-15");
const IST_OFFSET = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30

async function checkCommits(date: Date): Promise<boolean> {
  // Convert to IST
  const startOfDay = new Date(date.getTime() + IST_OFFSET);
  startOfDay.setUTCHours(0, 0, 0, 0);
  startOfDay.setTime(startOfDay.getTime() - IST_OFFSET); // Convert back to UTC for API

  const endOfDay = new Date(startOfDay.getTime());
  endOfDay.setDate(endOfDay.getDate() + 1);

  const response = await octokit.request("GET /repos/{owner}/{repo}/commits", {
    owner: "urm1n",
    repo: "cses",
    since: startOfDay.toISOString(),
    until: endOfDay.toISOString(),
  });

  return response.data.length > 0;
}

function getDatesInRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

async function updateScore(): Promise<void> {
  const dataPath = join(process.cwd(), "public", "data", "progress.json");
  let data: ProgressData;

  if (existsSync(dataPath)) {
    data = JSON.parse(readFileSync(dataPath, "utf8"));
  } else {
    data = {
      currentScore: INITIAL_SCORE,
      highestScore: INITIAL_SCORE,
      lowestScore: INITIAL_SCORE,
      history: [],
    };
  }

  // Get the last date in history or start date if history is empty
  const lastDate =
    data.history.length > 0
      ? new Date(data.history[data.history.length - 1].date)
      : new Date(START_DATE);

  const today = new Date();
  const datesToCheck = getDatesInRange(lastDate, today);

  let currentScore = data.currentScore;

  for (const date of datesToCheck) {
    if (date.getTime() === lastDate.getTime() && data.history.length > 0) {
      continue; // Skip the last processed date
    }

    const hasCommits = await checkCommits(date);
    currentScore =
      currentScore * (hasCommits ? MULTIPLIER_SUCCESS : MULTIPLIER_FAILURE);

    data.history.push({
      date: date.toISOString(),
      score: currentScore,
      hadCommit: hasCommits,
    });

    data.currentScore = currentScore;
    data.highestScore = Math.max(data.highestScore, currentScore);
    data.lowestScore = Math.min(data.lowestScore, currentScore);
  }

  mkdirSync(dirname(dataPath), { recursive: true });
  writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

updateScore().catch(console.error);
