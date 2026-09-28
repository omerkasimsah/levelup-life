import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, Text, StatusBar } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';

// ═══════════════════════════════════════════════════════════════════
// LevelUp Life – Main App Entry
// ═══════════════════════════════════════════════════════════════════

export default function App() {
  const [booted, setBooted] = React.useState(false);
  const bootOpacity = useRef(new Animated.Value(1)).current;
  const bootScale = useRef(new Animated.Value(0.9)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const dotOpacity1 = useRef(new Animated.Value(0)).current;
  const dotOpacity2 = useRef(new Animated.Value(0)).current;
  const dotOpacity3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Boot sequence animation
    Animated.sequence([
      // Fade in title
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(bootScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      // Grow the line
      Animated.timing(lineWidth, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      // Loading dots sequence
      Animated.stagger(200, [
        Animated.timing(dotOpacity1, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity2, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity3, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      // Hold for a moment
      Animated.delay(400),
      // Fade out boot screen
      Animated.timing(bootOpacity, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setBooted(true);
    });
  }, []);

  if (!booted) {
    return (
      <Animated.View
        style={[
          bootStyles.container,
          {
            opacity: bootOpacity,
            transform: [{ scale: bootScale }],
          },
        ]}
      >
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />

        {/* Boot logo */}
        <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
          <Text style={bootStyles.bootPrefix}>{'>'}_</Text>
          <View style={bootStyles.titleRow}>
            <Text style={bootStyles.titleWhite}>LEVEL</Text>
            <Text style={bootStyles.titleGreen}>UP</Text>
            <Text style={bootStyles.titleWhite}> LIFE</Text>
          </View>
          <Text style={bootStyles.subtitle}>// PRODUCTIVITY PROTOCOL v1.0</Text>
        </Animated.View>

        {/* Animated line */}
        <Animated.View
          style={[
            bootStyles.line,
            {
              width: lineWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '60%'],
              }),
            },
          ]}
        />

        {/* Loading dots */}
        <View style={bootStyles.dotsRow}>
          <Animated.Text style={[bootStyles.dot, { opacity: dotOpacity1 }]}>
            ■
          </Animated.Text>
          <Animated.Text style={[bootStyles.dot, { opacity: dotOpacity2 }]}>
            ■
          </Animated.Text>
          <Animated.Text style={[bootStyles.dot, { opacity: dotOpacity3 }]}>
            ■
          </Animated.Text>
        </View>

        <Animated.Text style={[bootStyles.bootText, { opacity: textOpacity }]}>
          INITIALIZING SYSTEM...
        </Animated.Text>
      </Animated.View>
    );
  }

  return <HomeScreen />;
}

// ═══════════════════════════════════════════════════════════════════
// Boot Screen Styles
// ═══════════════════════════════════════════════════════════════════

const bootStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bootPrefix: {
    fontFamily: 'monospace',
    fontSize: 28,
    color: '#00ff9d',
    marginBottom: 8,
    textShadowColor: 'rgba(0,255,157,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleWhite: {
    fontFamily: 'monospace',
    fontSize: 32,
    fontWeight: '900',
    color: '#e0e0e8',
    letterSpacing: 4,
  },
  titleGreen: {
    fontFamily: 'monospace',
    fontSize: 32,
    fontWeight: '900',
    color: '#00ff9d',
    letterSpacing: 4,
    textShadowColor: 'rgba(0,255,157,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#4a4a5e',
    letterSpacing: 3,
    marginBottom: 30,
  },
  line: {
    height: 2,
    backgroundColor: '#00ff9d',
    borderRadius: 1,
    marginBottom: 20,
    shadowColor: '#00ff9d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#00ff9d',
  },
  bootText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#7a7a8e',
    letterSpacing: 3,
  },
});
