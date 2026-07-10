import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  StyleSheet,
  Alert,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Colors from '../../constants/colors';

const audioRecorderPlayer = new AudioRecorderPlayer();

/**
 * MediaMessage — renders image, file, or voice message content
 */
const MediaMessage = ({ type, mediaUrl, mediaName, mediaSize, isSelf }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState('00:00');

  // ── Image ─────────────────────────────────────────────
  if (type === 'image') {
    return (
      <TouchableOpacity
        onPress={() => Linking.openURL(mediaUrl)}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: mediaUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }

  // ── File ──────────────────────────────────────────────
  if (type === 'file') {
    const sizeLabel = mediaSize
      ? mediaSize > 1024 * 1024
        ? `${(mediaSize / 1024 / 1024).toFixed(1)} MB`
        : `${(mediaSize / 1024).toFixed(0)} KB`
      : '';

    return (
      <TouchableOpacity
        style={[styles.fileContainer, isSelf ? styles.fileContainerSelf : styles.fileContainerOther]}
        onPress={() => Linking.openURL(mediaUrl)}
        activeOpacity={0.8}
      >
        <View style={styles.fileIcon}>
          <Text style={styles.fileIconText}>📎</Text>
        </View>
        <View style={styles.fileInfo}>
          <Text
            style={[styles.fileName, isSelf ? styles.textSelf : styles.textOther]}
            numberOfLines={1}
          >
            {mediaName || 'File'}
          </Text>
          {sizeLabel ? (
            <Text style={styles.fileSize}>{sizeLabel}</Text>
          ) : null}
        </View>
        <Text style={styles.downloadIcon}>⬇</Text>
      </TouchableOpacity>
    );
  }

  // ── Voice ─────────────────────────────────────────────
  if (type === 'voice') {
    const handlePlayPause = async () => {
      try {
        if (isPlaying) {
          await audioRecorderPlayer.stopPlayer();
          audioRecorderPlayer.removePlayBackListener();
          setIsPlaying(false);
          setPlayTime('00:00');
        } else {
          setIsPlaying(true);
          await audioRecorderPlayer.startPlayer(mediaUrl);
          audioRecorderPlayer.addPlayBackListener((e) => {
            const current = formatDuration(e.currentPosition);
            setPlayTime(current);
            if (e.currentPosition >= e.duration) {
              setIsPlaying(false);
              setPlayTime('00:00');
              audioRecorderPlayer.removePlayBackListener();
            }
          });
        }
      } catch (err) {
        console.error('Audio player error:', err);
        setIsPlaying(false);
      }
    };

    return (
      <View style={[styles.voiceContainer, isSelf ? styles.voiceContainerSelf : styles.voiceContainerOther]}>
        <TouchableOpacity onPress={handlePlayPause} style={styles.playBtn}>
          <Text style={styles.playBtnText}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <View style={styles.voiceWave}>
          {Array.from({ length: 18 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: 4 + Math.sin(i * 0.8) * 10,
                  backgroundColor: isPlaying
                    ? Colors.primaryLight
                    : isSelf
                    ? 'rgba(255,255,255,0.5)'
                    : Colors.textSecondary,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.voiceTime, isSelf ? styles.textSelf : styles.textOther]}>
          {playTime}
        </Text>
      </View>
    );
  }

  return null;
};

const formatDuration = (ms) => {
  const totalSecs = Math.floor(ms / 1000);
  const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
  const s = (totalSecs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const styles = StyleSheet.create({
  image: {
    width: 220,
    height: 180,
    borderRadius: 12,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 10,
    minWidth: 180,
  },
  fileContainerSelf: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  fileContainerOther: {
    backgroundColor: Colors.bgSurface3,
  },
  fileIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIconText: {
    fontSize: 20,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  downloadIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 22,
    gap: 8,
    minWidth: 180,
  },
  voiceContainerSelf: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  voiceContainerOther: {
    backgroundColor: Colors.bgSurface3,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnText: {
    color: '#fff',
    fontSize: 14,
  },
  voiceWave: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  voiceTime: {
    fontSize: 11,
    minWidth: 36,
  },
  textSelf: {
    color: 'rgba(255,255,255,0.9)',
  },
  textOther: {
    color: Colors.textSecondary,
  },
});

export default MediaMessage;
