import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { TextInput, TouchableOpacity } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { BlurView } from "expo-blur";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

const ATouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export type Props = {
  onShouldSend: (message: string) => void;
};

const MessageInput = ({ onShouldSend }: Props) => {
  const [message, setMessage] = useState("");
  const { bottom } = useSafeAreaInsets();
  const expanded = useSharedValue(0);
  const inputRef = useRef<TextInput>(null);

  const expandItems = () => {
    expanded.value = withTiming(1, { duration: 400 });
  };

  const collapseItems = () => {
    expanded.value = withTiming(0, { duration: 400 });
  };

  const expandButtonStyle = useAnimatedStyle(() => {
    const opacityInterpolation = interpolate(
      expanded.value,
      [0, 1],
      [1, 0],
      Extrapolation.CLAMP
    );
    const widthInterpolation = interpolate(
      expanded.value,
      [0, 1],
      [30, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity: opacityInterpolation,
      width: widthInterpolation,
    };
  });

  const buttonViewStyle = useAnimatedStyle(() => {
    const widthInterpolation = interpolate(
      expanded.value,
      [0, 1],
      [0, 100],
      Extrapolation.CLAMP
    );
    return {
      width: widthInterpolation,
      opacity: expanded.value,
    };
  });

  const onChangeText = (text: string) => {
    collapseItems();
    setMessage(text);
  };

  const onSend = () => {
    onShouldSend(message);
    setMessage("");
  };

  const onSelectCard = (text: string) => {
    onShouldSend(text);
  };

  return (
    <BlurView intensity={90}>
      <View style={styles.row}>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 5,
            paddingVertical: 5,
            borderRadius: 20,
            borderColor: Colors.greyLight,
            backgroundColor: Colors.light,
          }}
        >
          <ATouchableOpacity
            onPress={expandItems}
            style={[styles.roundBtn, expandButtonStyle]}
          >
            <Ionicons name="add" size={24} color={Colors.grey} />
          </ATouchableOpacity>

          <Animated.View style={[styles.buttonView, buttonViewStyle]}>
            <TouchableOpacity onPress={() => ImagePicker.launchCameraAsync()}>
              <Ionicons name="camera-outline" size={24} color={Colors.grey} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => ImagePicker.launchImageLibraryAsync()}
            >
              <Ionicons name="image-outline" size={24} color={Colors.grey} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => DocumentPicker.getDocumentAsync()}>
              <Ionicons name="folder-outline" size={24} color={Colors.grey} />
            </TouchableOpacity>
          </Animated.View>

          <TextInput
            ref={inputRef}
            placeholder="Message"
            style={styles.messageInput}
            onFocus={collapseItems}
            onChangeText={onChangeText}
            value={message}
            multiline
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 5,
            borderRadius: 20,
            borderColor: Colors.greyLight,
            backgroundColor: Colors.primary,
            width: 50,
            height: 50,
          }}
        >
          {message.length > 0 ? (
            <TouchableOpacity onPress={onSend}>
              <Ionicons name="send-sharp" size={24} color={Colors.light} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity>
              <FontAwesome5 name="microphone" size={24} color={Colors.light} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 5,
    paddingVertical: 5,
    backgroundColor: Colors.lightPink,
  },
  messageInput: {
    flex: 1,
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: Colors.light,
    width: "auto",
  },
  roundBtn: {
    width: 30,
    height: 30,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonView: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
export default MessageInput;
