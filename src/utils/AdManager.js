import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// ─── Safe Import with Fallback ──────────────────────────────────────
// In Expo Go the native module isn't linked, so we catch the error
// and provide console-logging mocks for every ad surface.

let nativeAds = null;
let IS_NATIVE_ADS_AVAILABLE = false;

try {
  nativeAds = require('react-native-google-mobile-ads');
  IS_NATIVE_ADS_AVAILABLE = true;
  console.log('[AdManager] ✅ Native ads module loaded');
} catch (e) {
  console.log('[AdManager] ⚠️  Native ads not available (Expo Go mode) – using mocks');
}

// ─── Test Ad Unit IDs ───────────────────────────────────────────────
const TestIds = IS_NATIVE_ADS_AVAILABLE
  ? nativeAds.TestIds
  : { BANNER: 'mock-banner', INTERSTITIAL: 'mock-interstitial', REWARDED: 'mock-rewarded' };

export const AD_UNITS = {
  BANNER: TestIds.BANNER,
  INTERSTITIAL: TestIds.INTERSTITIAL,
  REWARDED: TestIds.REWARDED,
};

// ═══════════════════════════════════════════════════════════════════
// Mock Banner Component (shown in Expo Go)
// ═══════════════════════════════════════════════════════════════════
function MockBannerAd({ unitId, size, ...rest }) {
  return (
    <View style={mockStyles.banner}>
      <Text style={mockStyles.bannerLabel}>[ AD PLACEHOLDER ]</Text>
      <Text style={mockStyles.bannerSub}>Banner · {unitId}</Text>
    </View>
  );
}

const mockStyles = StyleSheet.create({
  banner: {
    height: 52,
    backgroundColor: '#111118',
    borderWidth: 1,
    borderColor: '#22222e',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  bannerLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#00ff9d',
    letterSpacing: 2,
  },
  bannerSub: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#4a4a5e',
    marginTop: 2,
    letterSpacing: 1,
  },
});

// ─── Exported Banner component (real or mock) ────────────────────
export const BannerAd = IS_NATIVE_ADS_AVAILABLE ? nativeAds.BannerAd : MockBannerAd;
export const BannerAdSize = IS_NATIVE_ADS_AVAILABLE
  ? nativeAds.BannerAdSize
  : { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' };
export { TestIds };

// ═══════════════════════════════════════════════════════════════════
// Interstitial Ad (Level Up)
// ═══════════════════════════════════════════════════════════════════
let interstitialAd = null;
let interstitialLoaded = false;

export function loadInterstitialAd() {
  if (!IS_NATIVE_ADS_AVAILABLE) {
    console.log('[AdManager] 📦 Mock interstitial pre-loaded');
    interstitialLoaded = true;
    return;
  }

  const { InterstitialAd, AdEventType } = nativeAds;

  interstitialAd = InterstitialAd.createForAdRequest(AD_UNITS.INTERSTITIAL, {
    requestNonPersonalizedAdsOnly: true,
  });

  interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });

  interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
    interstitialLoaded = false;
    loadInterstitialAd();
  });

  interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
    console.warn('[AdManager] Interstitial error:', error);
    interstitialLoaded = false;
  });

  interstitialAd.load();
}

export function showInterstitialAd() {
  if (!IS_NATIVE_ADS_AVAILABLE) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[AdManager] 🎬 Interstitial Ad Shown (mock)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return true;
  }

  if (interstitialLoaded && interstitialAd) {
    interstitialAd.show();
    return true;
  }
  console.log('[AdManager] Interstitial ad not ready yet');
  return false;
}

// ═══════════════════════════════════════════════════════════════════
// Rewarded Ad (Double XP)
// ═══════════════════════════════════════════════════════════════════
let rewardedAd = null;
let rewardedLoaded = false;
let rewardCallback = null;

export function loadRewardedAd() {
  if (!IS_NATIVE_ADS_AVAILABLE) {
    console.log('[AdManager] 📦 Mock rewarded ad pre-loaded');
    rewardedLoaded = true;
    return;
  }

  const { RewardedAd, RewardedAdEventType, AdEventType } = nativeAds;

  rewardedAd = RewardedAd.createForAdRequest(AD_UNITS.REWARDED, {
    requestNonPersonalizedAdsOnly: true,
  });

  rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedLoaded = true;
  });

  rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
    console.log('[AdManager] User earned reward:', reward);
    if (rewardCallback) {
      rewardCallback(reward);
      rewardCallback = null;
    }
  });

  rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
    rewardedLoaded = false;
    loadRewardedAd();
  });

  rewardedAd.addAdEventListener(AdEventType.ERROR, (error) => {
    console.warn('[AdManager] Rewarded ad error:', error);
    rewardedLoaded = false;
  });

  rewardedAd.load();
}

/**
 * Show a rewarded ad. Calls `onRewarded` when the user earns the reward.
 * In mock mode, the reward is granted instantly after a console log.
 */
export function showRewardedAd(onRewarded) {
  if (!IS_NATIVE_ADS_AVAILABLE) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[AdManager] 📺 Rewarded Video Watched (mock)');
    console.log('[AdManager] 🎁 Reward granted → Double XP!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (onRewarded) {
      // Simulate a short delay like a real ad
      setTimeout(() => onRewarded({ type: 'xp_boost', amount: 2 }), 300);
    }
    return true;
  }

  if (rewardedLoaded && rewardedAd) {
    rewardCallback = onRewarded;
    rewardedAd.show();
    return true;
  }
  console.log('[AdManager] Rewarded ad not ready yet');
  return false;
}

// ═══════════════════════════════════════════════════════════════════
// Initialize
// ═══════════════════════════════════════════════════════════════════
export function initializeAds() {
  console.log(`[AdManager] Initializing (native=${IS_NATIVE_ADS_AVAILABLE})`);
  loadInterstitialAd();
  loadRewardedAd();
}
