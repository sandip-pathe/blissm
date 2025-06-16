// components/VoiceChatModal.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { Audio } from "expo-av";
import Svg, { Path } from "react-native-svg";
import {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

type Props = {
  visible: boolean;
  onClose: () => void;
  onTranscription?: (text: string) => void;
};

export default function VoiceChatModal({ visible, onClose }: Props) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [state, setState] = useState<"idle" | "recording" | "thinking">("idle");
  const [status, setStatus] = useState("Initializing...");
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 🔁 Animate mic pulse
  useEffect(() => {
    if (state === "recording") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state]);

  const toggleRecording = async () => {
    if (recording) {
      // ⏹️ Stop Recording
      setState("thinking");
      setStatus("Processing...");

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // 🧠 Call your STT → LLM → TTS pipeline here
      console.log("Send to STT/LLM:", uri);
      // Example:
      // const resultText = await yourTranscribeAndLLM(uri);
      // onTranscription?.(resultText);

      setTimeout(() => {
        setState("idle");
        setStatus("Tap to Speak");
      }, 2000);
    } else {
      // 🔴 Start Recording
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setStatus("Mic permission denied");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setState("recording");
      setStatus("Listening...");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <Text style={styles.statusText}>{status}</Text>

        {/* 🌊 Abstract animated waveform */}
        <Svg height="200" width={width}>
          <Path d={wavePath(state)} fill="none" stroke="#fff" strokeWidth={2} />
        </Svg>

        {/* 🎙️ Mic Button */}
        <Animated.View
          style={[
            styles.micButton,
            {
              transform: [{ scale: pulseAnim }],
              backgroundColor: state === "recording" ? "#ff4444" : "#222",
            },
          ]}
        >
          <TouchableOpacity onPress={toggleRecording}>
            <Text style={styles.micText}>
              {state === "recording" ? "⏹️" : "🎙️"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={{ color: "#fff" }}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// Dummy waveform based on state
const wavePath = (state: string) => {
  const base = `M0 100 `;
  if (state === "recording")
    return base + `Q50 30, 100 100 Q150 170, 200 100 Q250 30, 300 100`;
  if (state === "thinking")
    return base + `Q50 100, 100 100 Q150 100, 200 100 Q250 100, 300 100`;
  return base + `Q50 80, 100 100 Q150 120, 200 100 Q250 80, 300 100`;
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 20,
  },
  micButton: {
    padding: 30,
    borderRadius: 100,
    backgroundColor: "#333",
    marginTop: 30,
  },
  micText: {
    fontSize: 40,
    color: "#fff",
  },
  closeBtn: {
    marginTop: 40,
    padding: 10,
  },
});
