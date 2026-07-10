import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Colors from '../../constants/colors';

/**
 * Avatar — premium circular avatar with gradient, glow ring, animated online dot
 */
const Avatar = ({ name = '', size = 44, isOnline = false }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const fontSize = size * 0.4;

  // Pulse animation for online dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isOnline) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.6,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [isOnline, pulseAnim]);

  const dotSize = size * 0.27;

  return (
    <View style={[styles.wrapper, { width: size + 4, height: size + 4 }]}>
      {/* Glow ring */}
      <LinearGradient
        colors={['#6C63FF', '#00D4AA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.glowRing,
          { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 },
        ]}
      >
        {/* Avatar gradient background */}
        <LinearGradient
          colors={['#6C63FF', '#9D8DFF', '#4B44CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.avatar,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
        </LinearGradient>
      </LinearGradient>

      {/* Online status dot with pulse */}
      {isOnline !== undefined && (
        <View
          style={[
            styles.dotWrapper,
            {
              width: dotSize + 4,
              height: dotSize + 4,
              borderRadius: (dotSize + 4) / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        >
          {/* Pulsing outer ring */}
          {isOnline && (
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  width: dotSize + 4,
                  height: dotSize + 4,
                  borderRadius: (dotSize + 4) / 2,
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: isOnline
                    ? 'rgba(0,212,170,0.3)'
                    : 'transparent',
                },
              ]}
            />
          )}
          {/* Dot */}
          <View
            style={[
              styles.statusDot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: isOnline ? Colors.online : Colors.offline,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: Colors.textPrimary,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dotWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgSurface,
  },
  pulseRing: {
    position: 'absolute',
  },
  statusDot: {
    borderWidth: 1.5,
    borderColor: Colors.bgSurface,
  },
});

export default Avatar;
