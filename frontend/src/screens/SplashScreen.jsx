import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

/**
 * SplashScreen — 15-second animated branded intro for Chat App
 *
 * Animation sequence:
 * 0s    → background fades in
 * 0.3s  → floating chat bubbles stagger in (3 bubbles from left/right/left)
 * 1s    → logo bubble scales in with bounce
 * 1.8s  → typing dots appear inside logo bubble
 * 2.5s  → app name text slides up and fades in
 * 3s    → tagline fades in
 * 3.5s  → progress bar starts filling (fills in ~11s)
 * 14.5s → all elements fade out
 * 15s   → onDone() called
 */
const SplashScreen = ({ onDone }) => {
  // ── Animated values ──────────────────────────────────
  const bgOpacity    = useRef(new Animated.Value(0)).current;

  // Floating chat bubble animations
  const bubble1Y     = useRef(new Animated.Value(40)).current;
  const bubble1Op    = useRef(new Animated.Value(0)).current;
  const bubble2Y     = useRef(new Animated.Value(40)).current;
  const bubble2Op    = useRef(new Animated.Value(0)).current;
  const bubble3Y     = useRef(new Animated.Value(40)).current;
  const bubble3Op    = useRef(new Animated.Value(0)).current;

  // Logo / center bubble
  const logoScale    = useRef(new Animated.Value(0)).current;
  const logoOp       = useRef(new Animated.Value(0)).current;
  const logoPulse    = useRef(new Animated.Value(1)).current;

  // Typing dots
  const dot1Op       = useRef(new Animated.Value(0)).current;
  const dot2Op       = useRef(new Animated.Value(0)).current;
  const dot3Op       = useRef(new Animated.Value(0)).current;

  // Text
  const titleY       = useRef(new Animated.Value(30)).current;
  const titleOp      = useRef(new Animated.Value(0)).current;
  const taglineOp    = useRef(new Animated.Value(0)).current;

  // Progress bar
  const progressW    = useRef(new Animated.Value(0)).current;

  // Global fade out
  const globalOp     = useRef(new Animated.Value(1)).current;

  // ── Dot blink helper ─────────────────────────────────
  const blinkDot = (dotAnim, delay) =>
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dotAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0.2, duration: 300, useNativeDriver: true }),
      ]),
    );

  // ── Logo pulse helper ────────────────────────────────
  const startLogoPulse = () =>
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(logoPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    );

  useEffect(() => {
    // ── 1. Background fade in ─────────────────────────
    Animated.timing(bgOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // ── 2. Floating bubbles stagger ───────────────────
    const floatBubble = (yAnim, opAnim, delay) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.spring(yAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
          Animated.timing(opAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
      ]);

    floatBubble(bubble1Y, bubble1Op, 300).start();
    floatBubble(bubble2Y, bubble2Op, 500).start();
    floatBubble(bubble3Y, bubble3Op, 700).start();

    // ── 3. Logo bounce in ─────────────────────────────
    Animated.sequence([
      Animated.delay(1000),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 6,
        }),
        Animated.timing(logoOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start(() => {
      startLogoPulse().start();
    });

    // ── 4. Typing dots ───────────────────────────────
    Animated.sequence([
      Animated.delay(1800),
      Animated.parallel([
        blinkDot(dot1Op, 0),
        blinkDot(dot2Op, 200),
        blinkDot(dot3Op, 400),
      ]),
    ]).start();

    // ── 5. Title text slides up ───────────────────────
    Animated.sequence([
      Animated.delay(2500),
      Animated.parallel([
        Animated.spring(titleY, { toValue: 0, useNativeDriver: true, tension: 70, friction: 8 }),
        Animated.timing(titleOp, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    // ── 6. Tagline fade in ────────────────────────────
    Animated.sequence([
      Animated.delay(3000),
      Animated.timing(taglineOp, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // ── 7. Progress bar fills over ~11 seconds ────────
    Animated.sequence([
      Animated.delay(3500),
      Animated.timing(progressW, {
        toValue: width - 80,
        duration: 11000,
        useNativeDriver: false, // width cannot use native driver
      }),
    ]).start();

    // ── 8. Fade out everything at 14.5s ──────────────
    Animated.sequence([
      Animated.delay(14500),
      Animated.timing(globalOp, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    // ── 9. Call onDone at 15s ────────────────────────
    const timer = setTimeout(() => {
      onDone?.();
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: globalOp }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" translucent />

      <LinearGradient
        colors={['#0A0E1A', '#0D1220', '#121828']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.bg}
      >
        {/* ── Ambient glow blobs ──────────────────────── */}
        <View style={styles.glowBlobTopLeft} />
        <View style={styles.glowBlobBottomRight} />

        {/* ── Floating Chat Bubbles (decorative) ────────── */}
        <View style={styles.bubblesArea}>
          {/* Bubble 1 — left side, incoming style */}
          <Animated.View
            style={[
              styles.floatBubble,
              styles.floatBubbleLeft,
              { opacity: bubble1Op, transform: [{ translateY: bubble1Y }] },
            ]}
          >
            <LinearGradient colors={['#1A2235', '#222D42']} style={styles.floatBubbleGrad}>
              <Text style={styles.floatBubbleText}>Hey! How are you? 👋</Text>
            </LinearGradient>
          </Animated.View>

          {/* Bubble 2 — right side, outgoing style */}
          <Animated.View
            style={[
              styles.floatBubble,
              styles.floatBubbleRight,
              { opacity: bubble2Op, transform: [{ translateY: bubble2Y }] },
            ]}
          >
            <LinearGradient colors={['#6C63FF', '#9D8DFF']} style={styles.floatBubbleGrad}>
              <Text style={styles.floatBubbleTextSelf}>I'm great! 🔥</Text>
            </LinearGradient>
          </Animated.View>

          {/* Bubble 3 — left side, longer */}
          <Animated.View
            style={[
              styles.floatBubble,
              styles.floatBubbleLeft,
              { opacity: bubble3Op, transform: [{ translateY: bubble3Y }] },
            ]}
          >
            <LinearGradient colors={['#1A2235', '#222D42']} style={styles.floatBubbleGrad}>
              <Text style={styles.floatBubbleText}>Let's chat! ✨</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* ── Center — Logo Bubble ────────────────────── */}
        <View style={styles.centerSection}>
          <Animated.View
            style={[
              styles.logoWrapper,
              {
                opacity: logoOp,
                transform: [{ scale: Animated.multiply(logoScale, logoPulse) }],
              },
            ]}
          >
            {/* Outer glow ring */}
            <LinearGradient
              colors={['#6C63FF', '#00D4AA', '#9D8DFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGlowRing}
            >
              {/* Inner logo bubble */}
              <LinearGradient
                colors={['#1A1F35', '#0F1520']}
                style={styles.logoBubble}
              >
                {/* Typing dots inside logo */}
                <View style={styles.typingDots}>
                  <Animated.View style={[styles.typingDot, { opacity: dot1Op }]} />
                  <Animated.View style={[styles.typingDot, styles.typingDotMid, { opacity: dot2Op }]} />
                  <Animated.View style={[styles.typingDot, { opacity: dot3Op }]} />
                </View>
              </LinearGradient>
            </LinearGradient>
          </Animated.View>

          {/* ── App Name ──────────────────────────── */}
          <Animated.View
            style={[
              styles.titleWrapper,
              { opacity: titleOp, transform: [{ translateY: titleY }] },
            ]}
          >
            <Text style={styles.appName}>
              <Text style={styles.appNameAccent}>Chat</Text>App
            </Text>
            <Animated.Text style={[styles.tagline, { opacity: taglineOp }]}>
              Connect. Talk. Share.
            </Animated.Text>
          </Animated.View>
        </View>

        {/* ── Progress Bar ────────────────────────────── */}
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <Animated.View style={{ width: progressW }}>
              <LinearGradient
                colors={['#6C63FF', '#00D4AA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressFill}
              />
            </Animated.View>
          </View>
          <Text style={styles.progressLabel}>Loading your chats...</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 60,
  },

  // Ambient glow blobs
  glowBlobTopLeft: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(108,99,255,0.12)',
  },
  glowBlobBottomRight: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0,212,170,0.10)',
  },

  // Floating decorative bubbles
  bubblesArea: {
    width: '100%',
    paddingHorizontal: 24,
    gap: 10,
  },
  floatBubble: {
    maxWidth: '70%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  floatBubbleLeft: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  floatBubbleRight: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  floatBubbleGrad: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  floatBubbleText: {
    color: '#AABBCC',
    fontSize: 14,
    fontWeight: '500',
  },
  floatBubbleTextSelf: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Center section with logo
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlowRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    // Shadow glow
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  logoBubble: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6C63FF',
  },
  typingDotMid: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#9D8DFF',
  },

  // Title + tagline
  titleWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  appNameAccent: {
    color: '#6C63FF',
  },
  tagline: {
    fontSize: 15,
    color: '#8892A4',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '400',
  },

  // Progress bar
  progressSection: {
    width: '100%',
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: '#1E2D45',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  progressLabel: {
    color: '#4A5568',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
