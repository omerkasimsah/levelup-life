# ⚔️ LevelUp Life — Gamified Habit & Routine Tracker

> **Turn daily discipline into an RPG character leveling journey.**  
> Built with **React Native**, **Expo**, **AsyncStorage**, and **Expo Haptics**.

Most habit trackers feel like spreadsheets disguised as apps. **LevelUp Life** transforms real-life daily routines, workouts, reading, and productivity habits into RPG-style quests. Earn XP for completing daily habits, maintain streaks, level up your character stats, and unlock achievements.

---

## ✨ Features

- **🎮 RPG Progression & XP System:** Every habit gives experience points. Fill your XP bar and level up as you stay consistent.
- **🔥 Streak Counters:** Keep the momentum alive with daily streak multipliers. Missing days resets your momentum.
- **⚡ Cinematic Boot Sequence:** Custom fluid startup animation with typography and pulsing status indicators.
- **📳 Haptic Feedback:** Rewarding sensory tactile feedback (`expo-haptics`) upon checking off completed quests.
- **💾 Offline-First & Privacy Focused:** All user data, stats, and custom habits are stored locally on-device using `@react-native-async-storage/async-storage`. No forced cloud accounts or data harvesting.
- **🎨 Cyberpunk / Dark Mode UI:** High-contrast neon accents designed for OLED screens and late-night productivity sessions.

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** [React Native](https://reactnative.dev/) `0.81` / [Expo](https://expo.dev/) `~54`
- **State & Storage:** React Hooks + `@react-native-async-storage/async-storage`
- **Sensory & Audio:** `expo-haptics`, `expo-linear-gradient`
- **Monetization (Optional):** `react-native-google-mobile-ads` (configured with test ads)

---

## 📂 Project Structure

```text
├── App.js                   # Application root & animated boot sequence
├── app.json                 # Expo configuration & adaptive icon metadata
├── index.js                 # Entry point registerRootComponent
├── src/
│   ├── screens/
│   │   └── HomeScreen.js    # Main quest board, stats HUD & habit lists
│   ├── theme/
│   │   └── constants.js     # Color schemes, typography, spacing tokens
│   └── utils/
│       ├── StorageManager.js# Local persistence engine (CRUD for quests & stats)
│       └── AdManager.js     # AdMob rewarded/interstitial helper
└── assets/                  # App icons, splash screens, sound effects
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (v18+) and npm/yarn installed, along with the Expo Go app on your physical device (or an Android emulator / iOS simulator).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/omerkasimsah/levelup-life.git
   cd levelup-life
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Expo development server:**
   ```bash
   npx expo start
   ```

4. Scan the QR code using the **Expo Go** app on Android or Camera app on iOS to launch instantly.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
