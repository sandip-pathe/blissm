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
import Colors from "@/constants/Colors";

interface ColorPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onChangeBackgroundColor: (color: string) => void;
}

const DARK_COLORS = [
  "#1E1E1E",
  "#222831",
  "#0B3D91",
  "#0E4D45",
  "#172E15",
  "#102542",
  "#394867",
  "#3A2A5E",
  "#4B0082",
  "#5D3FD3",
  "#6A0DAD",
  "#301934",
  "#7D0633",
  "#8B0000",
  "#A52A2A",
  "#5E2129",
  "#943B54",
  "#B8860B",
  "#A97142",
  "#C67C48",
  "#8B4513",
  "#D4A017",
  "#556B2F",
  "#3B5323",
  "#2C3531",
  "#422A4C",
  "#264E36",
  "#191919",
  "#242424",
  "#485053",
];

const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  visible,
  onClose,
  onChangeBackgroundColor,
}) => {
  const colorBoxSize = (Dimensions.get("window").width - 40) / 5 - 8;

  const handleColorChange = useCallback(
    (color: string) => {
      onChangeBackgroundColor(color);
      onClose(); // Close modal after selection
    },
    [onChangeBackgroundColor, onClose]
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay} onTouchEnd={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.handle} />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-sharp" size={30} color={Colors.light} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Choose Background Color</Text>
          <FlatList
            data={DARK_COLORS}
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(1,1,1,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 30,
  },
  handle: {
    width: 80,
    height: 5,
    backgroundColor: Colors.greyLightLight,
    borderRadius: 2.5,
    alignSelf: "center",
    marginVertical: 8,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    color: Colors.light,
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
    borderColor: "white",
  },
});
