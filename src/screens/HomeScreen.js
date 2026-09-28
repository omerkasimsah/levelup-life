import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Animated,
  Easing,
  Dimensions,
  Platform,
  Alert,
  StatusBar,
  SafeAreaView,
  Vibration,
} from 'react-native';

import {
  loadTasks,
  saveTasks,
  loadUserData,
  saveUserData,
  updateStreak,
  resetDailyTasks,
  xpForLevel,
  xpForCurrentLevel,
  levelFromXP,
} from '../utils/StorageManager';

import {
  initializeAds,
  showInterstitialAd,
  showRewardedAd,
  BannerAd,
  BannerAdSize,
  TestIds,
} from '../utils/AdManager';

import {
  COLORS,
  SHADOWS,
  XP_PER_TASK,
  XP_PER_TASK_DOUBLED,
  LEVEL_UP_MESSAGES,
  COMPLETION_MESSAGES,
  getRankTitle,
} from '../theme/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════
// HomeScreen Component
// ═══════════════════════════════════════════════════════════════════

export default function HomeScreen() {
  // ─── State ──────────────────────────────────────────────────────
  const [tasks, setTasks] = useState([]);
  const [userData, setUserData] = useState({
    totalXP: 0,
    level: 1,
    streak: 0,
    longestStreak: 0,
    tasksCompletedTotal: 0,
    lastCompletionDate: null,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpMessage, setLevelUpMessage] = useState('');
  const [xpToast, setXpToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Animations ─────────────────────────────────────────────────
  const headerPulse = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const levelUpScale = useRef(new Animated.Value(0)).current;
  const levelUpOpacity = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;
  const fabRotate = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scanlineAnim = useRef(new Animated.Value(0)).current;

  // ─── Startup Animations ────────────────────────────────────────
  useEffect(() => {
    // Glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Scanline animation
    Animated.loop(
      Animated.timing(scanlineAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // ─── Load Data ──────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        initializeAds();

        let loadedTasks = await loadTasks();
        let loadedUser = await loadUserData();

        // Reset daily tasks if needed
        loadedTasks = await resetDailyTasks(loadedTasks);

        // Update streak
        loadedUser = await updateStreak(loadedUser);

        setTasks(loadedTasks);
        setUserData(loadedUser);
        setIsLoading(false);

        // Animate progress bar
        animateProgress(loadedUser);
      } catch (e) {
        console.error('Init failed:', e);
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // ─── Progress Bar Animation ─────────────────────────────────────
  const animateProgress = useCallback(
    (data) => {
      const currentLevelXP = xpForLevel(data.level);
      const nextLevelXP = xpForLevel(data.level + 1);
      const xpInLevel = data.totalXP - currentLevelXP;
      const xpNeeded = nextLevelXP - currentLevelXP;
      const progress = xpNeeded > 0 ? xpInLevel / xpNeeded : 0;

      Animated.timing(progressAnim, {
        toValue: Math.min(progress, 1),
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    },
    [progressAnim]
  );

  // ─── Add Task ───────────────────────────────────────────────────
  const handleAddTask = useCallback(() => {
    const trimmed = newTaskName.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Task name cannot be empty.');
      return;
    }

    const newTask = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      name: trimmed,
      completed: false,
      doubleXP: false,
      xpValue: XP_PER_TASK,
      createdAt: new Date().toISOString(),
    };

    const updated = [...tasks, newTask];
    setTasks(updated);
    saveTasks(updated);
    setNewTaskName('');
    setModalVisible(false);

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Vibration.vibrate(50);
    }
  }, [newTaskName, tasks]);

  // ─── Delete Task ────────────────────────────────────────────────
  const handleDeleteTask = useCallback(
    (taskId) => {
      Alert.alert(
        '⚠ DELETE PROTOCOL',
        'Remove this task from the system?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              const updated = tasks.filter((t) => t.id !== taskId);
              setTasks(updated);
              saveTasks(updated);
            },
          },
        ]
      );
    },
    [tasks]
  );

  // ─── Complete Task ──────────────────────────────────────────────
  const handleCompleteTask = useCallback(
    (taskId) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.completed) return;

      const xpGained = task.doubleXP ? XP_PER_TASK_DOUBLED : XP_PER_TASK;
      const newTotalXP = userData.totalXP + xpGained;
      const oldLevel = userData.level;
      const newLevel = levelFromXP(newTotalXP);

      // Update task
      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, completed: true } : t
      );

      // Update user data
      const updatedUser = {
        ...userData,
        totalXP: newTotalXP,
        level: newLevel,
        tasksCompletedTotal: userData.tasksCompletedTotal + 1,
        lastCompletionDate: new Date().toISOString(),
      };

      setTasks(updatedTasks);
      setUserData(updatedUser);
      saveTasks(updatedTasks);
      saveUserData(updatedUser);

      // Animate progress
      animateProgress(updatedUser);

      // Show XP Toast
      showXPToast(xpGained, task.doubleXP);

      // Haptic feedback
      if (Platform.OS !== 'web') {
        Vibration.vibrate(task.doubleXP ? [0, 80, 60, 80] : 80);
      }

      // Level-up check
      if (newLevel > oldLevel) {
        setTimeout(() => {
          triggerLevelUp(newLevel);
          showInterstitialAd();
        }, 600);
      }
    },
    [tasks, userData, animateProgress]
  );

  // ─── XP Toast ───────────────────────────────────────────────────
  const showXPToast = useCallback(
    (xp, isDouble) => {
      const messages = COMPLETION_MESSAGES;
      const msg = messages[Math.floor(Math.random() * messages.length)].replace(
        '{xp}',
        xp
      );
      setXpToast({ text: msg, isDouble });

      toastAnim.setValue(0);
      Animated.sequence([
        Animated.timing(toastAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setXpToast(null));
    },
    [toastAnim]
  );

  // ─── Level Up Animation ─────────────────────────────────────────
  const triggerLevelUp = useCallback(
    (newLevel) => {
      const msg =
        LEVEL_UP_MESSAGES[
          Math.floor(Math.random() * LEVEL_UP_MESSAGES.length)
        ];
      setLevelUpMessage(msg);
      setShowLevelUp(true);

      levelUpScale.setValue(0);
      levelUpOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(levelUpScale, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(levelUpOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 3s
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(levelUpScale, {
            toValue: 0.5,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(levelUpOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => setShowLevelUp(false));
      }, 3000);
    },
    [levelUpScale, levelUpOpacity]
  );

  // ─── Rewarded Ad (Double XP) ───────────────────────────────────
  const handleDoubleXP = useCallback(
    (taskId) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.completed || task.doubleXP) return;

      const success = showRewardedAd(() => {
        // Reward callback
        const updatedTasks = tasks.map((t) =>
          t.id === taskId ? { ...t, doubleXP: true, xpValue: XP_PER_TASK_DOUBLED } : t
        );
        setTasks(updatedTasks);
        saveTasks(updatedTasks);

        if (Platform.OS !== 'web') {
          Vibration.vibrate([0, 50, 30, 50, 30, 100]);
        }
      });

      if (!success) {
        Alert.alert(
          '📡 AD NOT READY',
          'The reward signal is still loading. Try again in a moment.',
          [{ text: 'OK' }]
        );
      }
    },
    [tasks]
  );

  // ─── FAB rotation animation ─────────────────────────────────────
  const handleFabPress = useCallback(() => {
    Animated.spring(fabRotate, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start(() => {
      fabRotate.setValue(0);
    });
    setModalVisible(true);
  }, [fabRotate]);

  // ─── Computed Values ────────────────────────────────────────────
  const currentLevelXP = xpForLevel(userData.level);
  const nextLevelXP = xpForLevel(userData.level + 1);
  const xpInLevel = userData.totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const completedToday = tasks.filter((t) => t.completed).length;
  const totalToday = tasks.length;
  const rankTitle = getRankTitle(userData.level);

  const fabSpin = fabRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '135deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const scanlineY = scanlineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-2, 800],
  });

  // ─── Loading Screen ────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <Text style={styles.loadingText}>// INITIALIZING SYSTEM...</Text>
        <View style={styles.loadingBar}>
          <Animated.View style={[styles.loadingBarFill]} />
        </View>
      </View>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Scanline overlay */}
      <Animated.View
        style={[styles.scanline, { transform: [{ translateY: scanlineY }] }]}
        pointerEvents="none"
      />

      {/* ━━━ HEADER ━━━ */}
      <View style={styles.header}>
        {/* App Title */}
        <View style={styles.titleRow}>
          <Text style={styles.titlePrefix}>{'>'} </Text>
          <Text style={styles.title}>LEVEL</Text>
          <Text style={styles.titleAccent}>UP</Text>
          <Text style={styles.title}> LIFE</Text>
        </View>

        {/* User Stats Card */}
        <Animated.View style={[styles.statsCard, { opacity: glowOpacity }]}>
          <View style={styles.statsCardInner}>
            {/* Level & Rank */}
            <View style={styles.levelSection}>
              <Text style={styles.levelLabel}>// LEVEL</Text>
              <Text style={styles.levelNumber}>{userData.level}</Text>
              <Text style={styles.rankTitle}>{rankTitle}</Text>
            </View>

            {/* Streak */}
            <View style={styles.streakSection}>
              <Text style={styles.streakLabel}>// STREAK</Text>
              <View style={styles.streakRow}>
                <Text style={styles.streakFire}>🔥</Text>
                <Text style={styles.streakNumber}>{userData.streak}</Text>
              </View>
              <Text style={styles.streakDays}>
                {userData.streak === 1 ? 'DAY' : 'DAYS'}
              </Text>
            </View>

            {/* Total XP */}
            <View style={styles.xpSection}>
              <Text style={styles.xpLabel}>// TOTAL XP</Text>
              <Text style={styles.xpNumber}>
                {userData.totalXP.toLocaleString()}
              </Text>
              <Text style={styles.xpSubtext}>
                {completedToday}/{totalToday} TODAY
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>
              LVL {userData.level} → LVL {userData.level + 1}
            </Text>
            <Text style={styles.progressLabel}>
              {xpInLevel} / {xpNeeded} XP
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.progressGlow,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  opacity: glowOpacity,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* ━━━ TASK LIST ━━━ */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{'>'} DAILY_OBJECTIVES</Text>
        <Text style={styles.sectionCount}>
          [{completedToday}/{totalToday}]
        </Text>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.taskList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⌨</Text>
            <Text style={styles.emptyTitle}>NO OBJECTIVES LOADED</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add your first daily habit
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <TaskItem
            task={item}
            index={index}
            onComplete={handleCompleteTask}
            onDelete={handleDeleteTask}
            onDoubleXP={handleDoubleXP}
          />
        )}
      />

      {/* ━━━ BANNER AD ━━━ */}
      <View style={styles.bannerContainer}>
        <BannerAd
          unitId={TestIds.BANNER}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdFailedToLoad={(error) => console.warn('Banner error:', error)}
        />
      </View>

      {/* ━━━ FAB (Add Task) ━━━ */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleFabPress}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ rotate: fabSpin }] }}>
          <Text style={styles.fabIcon}>+</Text>
        </Animated.View>
      </TouchableOpacity>

      {/* ━━━ ADD TASK MODAL ━━━ */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{'>'} NEW_OBJECTIVE</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtext}>
              // Define a new daily habit to track
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Morning workout..."
              placeholderTextColor={COLORS.textMuted}
              value={newTaskName}
              onChangeText={setNewTaskName}
              onSubmitEditing={handleAddTask}
              autoFocus
              maxLength={50}
              returnKeyType="done"
            />

            <View style={styles.modalXPInfo}>
              <Text style={styles.modalXPText}>
                ⚡ {XP_PER_TASK} XP per completion
              </Text>
              <Text style={styles.modalXPTextAlt}>
                📺 Watch ad for {XP_PER_TASK_DOUBLED} XP (2x)
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleAddTask}
              activeOpacity={0.7}
            >
              <Text style={styles.modalButtonText}>[ ADD OBJECTIVE ]</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ━━━ LEVEL UP OVERLAY ━━━ */}
      {showLevelUp && (
        <View style={styles.levelUpOverlay} pointerEvents="none">
          <Animated.View
            style={[
              styles.levelUpCard,
              {
                transform: [{ scale: levelUpScale }],
                opacity: levelUpOpacity,
              },
            ]}
          >
            <Text style={styles.levelUpTitle}>⬆ LEVEL UP ⬆</Text>
            <Text style={styles.levelUpLevel}>
              LEVEL {userData.level}
            </Text>
            <Text style={styles.levelUpRank}>{rankTitle}</Text>
            <Text style={styles.levelUpMsg}>{levelUpMessage}</Text>
          </Animated.View>
        </View>
      )}

      {/* ━━━ XP TOAST ━━━ */}
      {xpToast && (
        <Animated.View
          style={[
            styles.xpToast,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
                {
                  scale: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
            xpToast.isDouble && styles.xpToastDouble,
          ]}
          pointerEvents="none"
        >
          <Text
            style={[
              styles.xpToastText,
              xpToast.isDouble && styles.xpToastTextDouble,
            ]}
          >
            {xpToast.text}
          </Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Task Item Component
// ═══════════════════════════════════════════════════════════════════

const TaskItem = React.memo(({ task, index, onComplete, onDelete, onDoubleXP }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(task.completed ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.spring(checkScale, {
      toValue: task.completed ? 1 : 0,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [task.completed]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_WIDTH, 0],
  });

  return (
    <Animated.View
      style={[
        styles.taskItem,
        task.completed && styles.taskItemCompleted,
        { transform: [{ translateX }], opacity: slideAnim },
      ]}
    >
      {/* Left accent bar */}
      <View
        style={[
          styles.taskAccent,
          task.completed && styles.taskAccentCompleted,
          task.doubleXP && styles.taskAccentDouble,
        ]}
      />

      {/* Checkbox */}
      <TouchableOpacity
        style={[
          styles.checkbox,
          task.completed && styles.checkboxChecked,
        ]}
        onPress={() => onComplete(task.id)}
        disabled={task.completed}
        activeOpacity={0.6}
      >
        <Animated.Text
          style={[
            styles.checkmark,
            { transform: [{ scale: checkScale }] },
          ]}
        >
          ✓
        </Animated.Text>
      </TouchableOpacity>

      {/* Task Info */}
      <View style={styles.taskInfo}>
        <Text
          style={[
            styles.taskName,
            task.completed && styles.taskNameCompleted,
          ]}
          numberOfLines={1}
        >
          {task.name}
        </Text>
        <View style={styles.taskMeta}>
          <Text style={styles.taskXP}>
            ⚡ {task.doubleXP ? XP_PER_TASK_DOUBLED : XP_PER_TASK} XP
          </Text>
          {task.doubleXP && (
            <Text style={styles.taskDoubleTag}>2X</Text>
          )}
          {task.completed && (
            <Text style={styles.taskDoneTag}>DONE</Text>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.taskActions}>
        {!task.completed && !task.doubleXP && (
          <TouchableOpacity
            style={styles.doubleXPBtn}
            onPress={() => onDoubleXP(task.id)}
            activeOpacity={0.6}
          >
            <Text style={styles.doubleXPIcon}>📺</Text>
            <Text style={styles.doubleXPText}>2X</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(task.id)}
          activeOpacity={0.6}
        >
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // ─── Layout ───────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontFamily: 'monospace',
    color: COLORS.neonGreen,
    fontSize: 14,
    marginBottom: 16,
    letterSpacing: 2,
  },
  loadingBar: {
    width: '60%',
    height: 3,
    backgroundColor: COLORS.bgCard,
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBarFill: {
    width: '70%',
    height: '100%',
    backgroundColor: COLORS.neonGreen,
  },

  // ─── Scanline ─────────────────────────────────────────
  scanline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,255,157,0.06)',
    zIndex: 100,
  },

  // ─── Header ───────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  titlePrefix: {
    fontFamily: 'monospace',
    fontSize: 18,
    color: COLORS.neonGreen,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 3,
  },
  titleAccent: {
    fontFamily: 'monospace',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.neonGreen,
    letterSpacing: 3,
  },

  // ─── Stats Card ───────────────────────────────────────
  statsCard: {
    marginBottom: 12,
  },
  statsCardInner: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    justifyContent: 'space-between',
    ...SHADOWS.card,
  },
  levelSection: {
    alignItems: 'center',
    flex: 1,
  },
  levelLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  levelNumber: {
    fontFamily: 'monospace',
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.neonGreen,
    textShadowColor: 'rgba(0,255,157,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  rankTitle: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: COLORS.neonBlue,
    letterSpacing: 2,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  streakSection: {
    alignItems: 'center',
    flex: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },
  streakLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakFire: {
    fontSize: 20,
  },
  streakNumber: {
    fontFamily: 'monospace',
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.neonYellow,
    textShadowColor: 'rgba(255,230,0,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  streakDays: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginTop: 2,
  },
  xpSection: {
    alignItems: 'center',
    flex: 1,
  },
  xpLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  xpNumber: {
    fontFamily: 'monospace',
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.neonBlue,
    textShadowColor: 'rgba(0,212,255,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  xpSubtext: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginTop: 2,
  },

  // ─── Progress Bar ─────────────────────────────────────
  progressContainer: {
    marginTop: 2,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.neonGreen,
    borderRadius: 4,
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: COLORS.neonGreen,
    borderRadius: 4,
  },

  // ─── Section Header ───────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: COLORS.neonGreen,
    letterSpacing: 2,
    fontWeight: '700',
  },
  sectionCount: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },

  // ─── Task List ────────────────────────────────────────
  taskList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // ─── Empty State ──────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'monospace',
    fontSize: 16,
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ─── Task Item ────────────────────────────────────────
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    minHeight: 64,
  },
  taskItemCompleted: {
    opacity: 0.55,
    borderColor: 'rgba(0,255,157,0.15)',
  },
  taskAccent: {
    width: 4,
    height: '100%',
    backgroundColor: COLORS.neonBlue,
  },
  taskAccentCompleted: {
    backgroundColor: COLORS.neonGreen,
  },
  taskAccentDouble: {
    backgroundColor: COLORS.neonPurple,
  },

  // ─── Checkbox ─────────────────────────────────────────
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: COLORS.neonGreen,
    borderColor: COLORS.neonGreen,
  },
  checkmark: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.bg,
  },

  // ─── Task Info ────────────────────────────────────────
  taskInfo: {
    flex: 1,
    paddingVertical: 10,
  },
  taskName: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  taskXP: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: COLORS.neonBlue,
    letterSpacing: 1,
  },
  taskDoubleTag: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: COLORS.neonPurple,
    backgroundColor: 'rgba(184,77,255,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '800',
    letterSpacing: 1,
    overflow: 'hidden',
  },
  taskDoneTag: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: COLORS.neonGreen,
    backgroundColor: 'rgba(0,255,157,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '800',
    letterSpacing: 1,
    overflow: 'hidden',
  },

  // ─── Task Actions ─────────────────────────────────────
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    gap: 6,
  },
  doubleXPBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(184,77,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(184,77,255,0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  doubleXPIcon: {
    fontSize: 12,
  },
  doubleXPText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.neonPurple,
    letterSpacing: 1,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255,59,92,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '700',
  },

  // ─── Banner Ad ────────────────────────────────────────
  bannerContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 2,
  },

  // ─── FAB ──────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.neonGreen,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.neonGlow,
    zIndex: 50,
  },
  fabIcon: {
    fontSize: 30,
    fontWeight: '300',
    color: COLORS.bg,
    marginTop: -2,
  },

  // ─── Modal ────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.bgModal,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    ...SHADOWS.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.neonGreen,
    letterSpacing: 2,
  },
  modalClose: {
    fontFamily: 'monospace',
    fontSize: 18,
    color: COLORS.textMuted,
    padding: 4,
  },
  modalSubtext: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 20,
    letterSpacing: 1,
  },
  modalInput: {
    backgroundColor: COLORS.bgInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    fontFamily: 'monospace',
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  modalXPInfo: {
    marginBottom: 20,
    gap: 6,
  },
  modalXPText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: COLORS.neonBlue,
    letterSpacing: 1,
  },
  modalXPTextAlt: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: COLORS.neonPurple,
    letterSpacing: 1,
  },
  modalButton: {
    backgroundColor: COLORS.neonGreen,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOWS.neonGlow,
  },
  modalButtonText: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.bg,
    letterSpacing: 2,
  },

  // ─── Level Up Overlay ─────────────────────────────────
  levelUpOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 200,
  },
  levelUpCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.neonGreen,
    padding: 36,
    alignItems: 'center',
    ...SHADOWS.neonGlow,
    maxWidth: 300,
  },
  levelUpTitle: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.neonGreen,
    letterSpacing: 4,
    marginBottom: 12,
    textShadowColor: 'rgba(0,255,157,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  levelUpLevel: {
    fontFamily: 'monospace',
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  levelUpRank: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: COLORS.neonBlue,
    letterSpacing: 3,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  levelUpMsg: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: COLORS.neonYellow,
    letterSpacing: 2,
    textAlign: 'center',
  },

  // ─── XP Toast ─────────────────────────────────────────
  xpToast: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.neonGreen,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 150,
    ...SHADOWS.neonGlow,
  },
  xpToastDouble: {
    borderColor: COLORS.neonPurple,
    shadowColor: COLORS.neonPurple,
  },
  xpToastText: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.neonGreen,
    letterSpacing: 2,
  },
  xpToastTextDouble: {
    color: COLORS.neonPurple,
  },
});
