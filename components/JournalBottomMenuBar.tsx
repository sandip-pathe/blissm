import React, { useState } from "react";
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

const BottomBar: React.FC<BottomBarProps> = ({ onChangeBackgroundColor }) => {
  const [backgroundModalVisible, setBackgroundModalVisible] = useState(false);

  // Calculate the width of each color box to fit 4 items per row
  const screenWidth = Dimensions.get("window").width;
  const colorBoxWidth = (screenWidth - 80) / 4 - 10; // 80 = paddingHorizontal * 2, 10 = marginHorizontal

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
            <Ionicons name="close-sharp" size={30} color={Colors.light} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Choose Background Color</Text>
          <FlatList
            data={[
              "#121212",
              "#395B64",
              "#0B3D91",
              "#0E4D45",
              "#172E15",
              "#323232",
              "#000101",
              "#485053",
            ]}
            numColumns={4}
            contentContainerStyle={styles.flatListContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.colorBox,
                  { backgroundColor: item, width: colorBoxWidth },
                ]}
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
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.greyLight,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 20,
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
