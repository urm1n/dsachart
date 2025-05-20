import { google } from "googleapis";
import { JWT } from "google-auth-library";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

interface HabitScore {
  score: number;
  value: number | boolean;
  target?: number;
  achieved: boolean;
}

interface DailyScores {
  [key: string]: HabitScore;
}

interface HabitHistory {
  date: string;
  scores: DailyScores;
}

interface HabitData {
  currentScores: { [key: string]: number };
  highestScores: { [key: string]: number };
  lowestScores: { [key: string]: number };
  history: HabitHistory[];
}

import {
  INITIAL_SCORE,
  MULTIPLIER_SUCCESS,
  MULTIPLIER_FAILURE,
  HABIT_TARGETS,
} from "../src/constants/scores.js";

// Remove the local constants since they're now imported
async function getGoogleSheetData() {
  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Habit!A2:D",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("No data found.");
      return [];
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return rows
      .map((row) => {
        // Parse date in DD/MM/YYYY format
        const [day, month, year] = row[0].split("/").map(Number);
        const date = new Date(year, month - 1, day);

        return {
          date: row[0],
          pushups: Number(row[1]) || 0,
          morningWalk: row[2] === "TRUE",
          reading: Number(row[3]) || 0,
          parsedDate: date,
        };
      })
      .filter((entry) => entry.parsedDate <= today)
      .map(({ date, pushups, morningWalk, reading }) => ({
        date,
        pushups,
        morningWalk,
        reading,
      }));
  } catch (err) {
    console.error("Error fetching data from Google Sheets:", err);
    return [];
  }
}

function calculateHabitScore(
  habit: string,
  value: number | boolean,
  target?: number,
  previousScore: number = INITIAL_SCORE
): number {
  let multiplier;

  if (typeof value === "boolean") {
    multiplier = value ? MULTIPLIER_SUCCESS : MULTIPLIER_FAILURE;
  } else {
    if (!target) return previousScore;

    const achievement = value / target;
    if (achievement >= 1) {
      multiplier = MULTIPLIER_SUCCESS;
    } else if (achievement >= 0.8) {
      multiplier = 1.0; // Maintain score if at least 80% achieved
    } else {
      multiplier = MULTIPLIER_FAILURE;
    }
  }

  return previousScore * multiplier;
}

async function updateHabitScores(): Promise<void> {
  const dataPath = join(process.cwd(), "public", "data", "habits.json");
  let data: HabitData = {
    currentScores: {
      pushups: INITIAL_SCORE,
      morningWalk: INITIAL_SCORE,
      reading: INITIAL_SCORE,
    },
    highestScores: {
      pushups: INITIAL_SCORE,
      morningWalk: INITIAL_SCORE,
      reading: INITIAL_SCORE,
    },
    lowestScores: {
      pushups: INITIAL_SCORE,
      morningWalk: INITIAL_SCORE,
      reading: INITIAL_SCORE,
    },
    history: [],
  };

  // Fetch data from Google Sheets
  const sheetData = await getGoogleSheetData();

  // Process each day's data
  let currentPushupsScore = INITIAL_SCORE;
  let currentMorningWalkScore = INITIAL_SCORE;
  let currentReadingScore = INITIAL_SCORE;

  for (const row of sheetData) {
    const dailyScores: DailyScores = {
      pushups: {
        score: calculateHabitScore(
          "pushups",
          row.pushups,
          HABIT_TARGETS.pushups,
          currentPushupsScore
        ),
        value: row.pushups,
        target: HABIT_TARGETS.pushups,
        achieved: row.pushups >= HABIT_TARGETS.pushups,
      },
      morningWalk: {
        score: calculateHabitScore(
          "morningWalk",
          row.morningWalk,
          undefined,
          currentMorningWalkScore
        ),
        value: row.morningWalk,
        achieved: row.morningWalk,
      },
      reading: {
        score: calculateHabitScore(
          "reading",
          row.reading,
          HABIT_TARGETS.reading,
          currentReadingScore
        ),
        value: row.reading,
        target: HABIT_TARGETS.reading,
        achieved: row.reading >= HABIT_TARGETS.reading,
      },
    };

    // Update current scores for next iteration
    currentPushupsScore = dailyScores.pushups.score;
    currentMorningWalkScore = dailyScores.morningWalk.score;
    currentReadingScore = dailyScores.reading.score;

    data.history.push({
      date: row.date,
      scores: dailyScores,
    });

    // Update current, highest, and lowest scores
    for (const habit of Object.keys(dailyScores)) {
      data.currentScores[habit] = dailyScores[habit].score;
      data.highestScores[habit] = Math.max(
        data.highestScores[habit],
        dailyScores[habit].score
      );
      data.lowestScores[habit] = Math.min(
        data.lowestScores[habit],
        dailyScores[habit].score
      );
    }
  }

  // Sort history by date
  data.history.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  mkdirSync(dirname(dataPath), { recursive: true });
  writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

updateHabitScores().catch(console.error);
