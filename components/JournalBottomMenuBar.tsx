import React, { useState, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

interface BottomBarProps {
  onChangeBackgroundColor: (color: string) => void;
}

const darkColors = [
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

const BottomBar: React.FC<BottomBarProps> = ({ onChangeBackgroundColor }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const colorBoxWidth = (Dimensions.get("window").width - 32) / 5 - 10;

  const handleColorChange = useCallback(
    (color: string) => {
      onChangeBackgroundColor(color);
      setModalVisible(false);
    },
    [onChangeBackgroundColor]
  );

  return (
    <>
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="color-palette-outline" size={35} color="white" />
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.handle} />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close-sharp" size={30} color={Colors.light} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Choose Background Color</Text>

          <FlatList
            data={darkColors}
            numColumns={5}
            contentContainerStyle={styles.flatListContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.colorBox,
                  { backgroundColor: item, width: colorBoxWidth },
                ]}
                onPress={() => handleColorChange(item)}
              />
            )}
            keyExtractor={(item) => item}
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 5,
  },
  iconButton: {
    alignItems: "center",
    padding: 7,
    borderRadius: 50,
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.greyLight,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 16,
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
    color: "white",
    marginBottom: 20,
    textAlign: "center",
  },
  flatListContainer: {
    justifyContent: "space-between",
  },
  colorBox: {
    height: 50,
    margin: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "white",
  },
  closeButton: {
    position: "absolute",
    right: 30,
    top: 20,
    zIndex: 10,
  },
});

export default BottomBar;
