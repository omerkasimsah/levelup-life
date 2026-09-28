import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  TASKS: '@levelup_tasks',
  USER_DATA: '@levelup_user_data',
  LAST_LOGIN: '@levelup_last_login',
};

// ─── XP / Level Constants ───────────────────────────────────────────
const BASE_XP = 100;       // XP to reach Level 2
const XP_MULTIPLIER = 1.5; // Each level needs 1.5x more XP

/**
 * Calculate XP required for a specific level.
 * Level 1 → 0 XP | Level 2 → 100 XP | Level 3 → 250 XP | etc.
 */
export function xpForLevel(level) {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += Math.floor(BASE_XP * Math.pow(XP_MULTIPLIER, i - 2));
  }
  return total;
}

/**
 * Calculate XP required ONLY for current level bracket.
 */
export function xpForCurrentLevel(level) {
  return Math.floor(BASE_XP * Math.pow(XP_MULTIPLIER, Math.max(0, level - 1)));
}

/**
 * Derive level from totalXP.
 */
export function levelFromXP(totalXP) {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXP) {
    level++;
  }
  return level;
}

// ─── Default User Data ─────────────────────────────────────────────
const DEFAULT_USER_DATA = {
  totalXP: 0,
  level: 1,
  streak: 0,
  longestStreak: 0,
  tasksCompletedTotal: 0,
  lastCompletionDate: null,
};

// ─── Storage API ────────────────────────────────────────────────────

export async function loadTasks() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
    if (json) {
      return JSON.parse(json);
    }
    return [];
  } catch (e) {
    console.error('StorageManager: loadTasks failed', e);
    return [];
  }
}

export async function saveTasks(tasks) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('StorageManager: saveTasks failed', e);
  }
}

export async function loadUserData() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (json) {
      return { ...DEFAULT_USER_DATA, ...JSON.parse(json) };
    }
    return { ...DEFAULT_USER_DATA };
  } catch (e) {
    console.error('StorageManager: loadUserData failed', e);
    return { ...DEFAULT_USER_DATA };
  }
}

export async function saveUserData(data) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
  } catch (e) {
    console.error('StorageManager: saveUserData failed', e);
  }
}

/**
 * Check and update daily streak.
 * Returns updated userData.
 */
export async function updateStreak(userData) {
  const today = new Date().toDateString();
  const lastLogin = await AsyncStorage.getItem(STORAGE_KEYS.LAST_LOGIN);

  let updatedData = { ...userData };

  if (lastLogin === today) {
    // Already logged in today – no change
    return updatedData;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (lastLogin === yesterday.toDateString()) {
    // Consecutive day → increment streak
    updatedData.streak += 1;
  } else if (lastLogin !== null) {
    // Missed a day → reset streak
    updatedData.streak = 1;
  } else {
    // First time ever
    updatedData.streak = 1;
  }

  if (updatedData.streak > updatedData.longestStreak) {
    updatedData.longestStreak = updatedData.streak;
  }

  await AsyncStorage.setItem(STORAGE_KEYS.LAST_LOGIN, today);
  await saveUserData(updatedData);
  return updatedData;
}

/**
 * Reset tasks' completion status for a new day.
 * Called when the day changes.
 */
export async function resetDailyTasks(tasks) {
  const today = new Date().toDateString();
  const lastLogin = await AsyncStorage.getItem(STORAGE_KEYS.LAST_LOGIN);

  if (lastLogin !== today) {
    const resetTasks = tasks.map((t) => ({
      ...t,
      completed: false,
      doubleXP: false,
    }));
    await saveTasks(resetTasks);
    return resetTasks;
  }
  return tasks;
}

export { STORAGE_KEYS, DEFAULT_USER_DATA };
