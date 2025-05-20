export const INITIAL_SCORE = 1.0;
export const MULTIPLIER_SUCCESS = 1.01;
export const MULTIPLIER_FAILURE = 0.99;

// Habit targets
export const HABIT_TARGETS = {
  pushups: 15,
  reading: 20,
} as const;

// Time constants
export const IST_OFFSET = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
export const START_DATE = new Date("2025-05-15");
