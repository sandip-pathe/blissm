import React from "react";
import { StyleSheet, View, Keyboard, TouchableOpacity } from "react-native";
import Colors from "@/constants/Colors";
import { Entypo, Ionicons } from "@expo/vector-icons";

interface CustomBottomSheetProps {
  keyboardHeight: number;
  isVisible: boolean;
  content: React.ReactNode;
  onClose: () => void;
}

const CustomBottomSheet: React.FC<CustomBottomSheetProps> = ({
  keyboardHeight,
  isVisible,
  content,
  onClose,
}) => {
  if (!isVisible) return null;

  const closeSheet = () => {
    onClose();
  };

  return (
    <View style={[styles.container, { height: keyboardHeight }]}>
      <TouchableOpacity
        style={{ position: "absolute", left: 10, top: 25, zIndex: 10 }}
        onPress={closeSheet}
      >
        <Ionicons name="close-sharp" size={24} color={Colors.light} />
      </TouchableOpacity>
      <View style={styles.handle} />
      <View style={styles.content}>{content}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.greyLight,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: Colors.greyLightLight,
    borderRadius: 2.5,
    alignSelf: "center",
    marginVertical: 10,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

export default CustomBottomSheet;
