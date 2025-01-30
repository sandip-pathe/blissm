import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

interface BottomBarProps {
  onChangeBackgroundColor: (color: string) => void;
}

const BottomBar: React.FC<BottomBarProps> = ({ onChangeBackgroundColor }) => {
  const [backgroundModalVisible, setBackgroundModalVisible] = useState(false);

  return (
    <>
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setBackgroundModalVisible(true)}
        >
          <Ionicons name="color-palette-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <Modal visible={backgroundModalVisible} transparent>
        <View style={styles.container}>
          <View style={styles.handle} />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setBackgroundModalVisible(false)}
          >
            <Ionicons name="close-sharp" size={24} color={Colors.light} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Choose Background Color</Text>
          <FlatList
            data={["#121212", "#395B64", "#2D3436", "#0B3D91"]}
            horizontal
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.colorBox, { backgroundColor: item }]}
                onPress={() => {
                  onChangeBackgroundColor(item);
                  setBackgroundModalVisible(false);
                }}
              />
            )}
            keyExtractor={(item, index) => index.toString()}
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
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: Colors.primary,
    padding: 7,
    borderRadius: 50,
  },
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.greyLight,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: Colors.greyLightLight,
    borderRadius: 2.5,
    alignSelf: "center",
    marginVertical: 8,
  },
  modalTitle: {
    fontSize: 18,
    color: "white",
    marginBottom: 20,
    textAlign: "center",
  },
  colorBox: {
    width: 50,
    height: 50,
    marginHorizontal: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "white",
  },
  closeButton: {
    position: "absolute",
    left: 10,
    top: 25,
    zIndex: 10,
  },
});

export default BottomBar;
