import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { posthog } from "@/constants/posthogConfig";
import { useTheme } from "@react-navigation/native";
import { useColorScheme } from "@/hooks/useColorScheme";

interface ColorPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onChangeBackgroundColor: (color: any) => void;
}

const COLOR_PAIRS = [
  { dark: "#1E1E1E", light: "#F5F5F5" },
  { dark: "#222831", light: "#EEEEEE" },
  { dark: "#0B3D91", light: "#AEC6FF" },
  { dark: "#0E4D45", light: "#A8E6CF" },
  { dark: "#172E15", light: "#C7E59F" },
  { dark: "#102542", light: "#B3D9FF" },
  { dark: "#394867", light: "#D6E4FF" },
  { dark: "#3A2A5E", light: "#D9C2FF" },
  { dark: "#4B0082", light: "#E6CCFF" },
  { dark: "#5D3FD3", light: "#E0C2FF" },
  { dark: "#6A0DAD", light: "#E5B8FF" },
  { dark: "#301934", light: "#E8D1FF" },
  { dark: "#7D0633", light: "#F5A3B3" },
  { dark: "#8B0000", light: "#FF7F7F" },
  { dark: "#A52A2A", light: "#FFAD87" },
  { dark: "#5E2129", light: "#E8A5A1" },
  { dark: "#943B54", light: "#F0B6C2" },
  { dark: "#B8860B", light: "#FFD700" },
  { dark: "#A97142", light: "#EEC39A" },
  { dark: "#C67C48", light: "#F2C099" },
  { dark: "#8B4513", light: "#E0A87E" },
  { dark: "#D4A017", light: "#F8D24E" },
  { dark: "#556B2F", light: "#B5D99C" },
  { dark: "#3B5323", light: "#A7D89C" },
  { dark: "#2C3531", light: "#C4D7C6" },
  { dark: "#422A4C", light: "#E4C3E6" },
  { dark: "#264E36", light: "#B7E1CD" },
  { dark: "#191919", light: "#EAEAEA" },
  { dark: "#242424", light: "#F0F0F0" },
  { dark: "#485053", light: "#C0C8CA" },
];

const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  visible,
  onClose,
  onChangeBackgroundColor,
}) => {
  const colorBoxSize = (Dimensions.get("window").width - 40) / 5 - 8;
  const { colors } = useTheme();
  const colorScheme = useColorScheme();
  const styles = themedStyles(colors);

  const handleColorChange = useCallback(
    (color: string) => {
      const colorPair = COLOR_PAIRS.find(
        (pair) => pair.dark === color || pair.light === color
      );
      if (!colorPair) return;
      onChangeBackgroundColor(colorPair);
      posthog.capture("journal_background_color_changed", {
        color: colorPair,
      });
      onClose();
    },
    [onChangeBackgroundColor, onClose, colorScheme]
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay} onTouchEnd={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.handle} />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-sharp" size={30} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Choose Background Color</Text>
          <FlatList
            data={COLOR_PAIRS.map((pair) =>
              colorScheme === "dark" ? pair.dark : pair.light
            )}
            numColumns={5}
            contentContainerStyle={styles.colorGrid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.colorBox,
                  {
                    backgroundColor: item,
                    width: colorBoxSize,
                    height: colorBoxSize,
                  },
                ]}
                onPress={() => handleColorChange(item)}
              />
            )}
            keyExtractor={(item) => item}
          />
        </View>
      </View>
    </Modal>
  );
};

export default ColorPickerModal;

const themedStyles = (colors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(1,1,1,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      paddingBottom: 30,
    },
    handle: {
      width: 80,
      height: 5,
      backgroundColor: colors.border,
      borderRadius: 2.5,
      alignSelf: "center",
      marginVertical: 8,
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      color: colors.text,
      marginBottom: 15,
      textAlign: "center",
      fontFamily: "Poppins-Bold",
    },
    closeButton: {
      position: "absolute",
      right: 20,
      top: 15,
    },
    colorGrid: {
      alignItems: "center",
    },
    colorBox: {
      margin: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
