import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/constants/Colors";

interface BottomBarProps {
  onAddImage: (imageUri: string) => void;
  onChangeBackgroundColor: (color: string) => void;
  onAddTag: (tag: string) => void;
  onAddListItem: (listItem: string) => void;
}

const actions = [
  { id: "color", icon: "color-palette-outline", name: "Color" },
  { id: "list", icon: "list", name: "List", type: "MaterialIcons" },
  { id: "tag", icon: "pricetag-outline", name: "Tag" },
  { id: "photo", icon: "photo", name: "Photo", type: "MaterialIcons" },
  { id: "voice", icon: "mic-outline", name: "Voice" },
];

const BottomBar: React.FC<BottomBarProps> = ({
  onAddImage,
  onChangeBackgroundColor,
  onAddTag,
  onAddListItem,
}) => {
  const [moodModalVisible, setMoodModalVisible] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [backgroundModalVisible, setBackgroundModalVisible] = useState(false);

  const handleActionPress = async (id: string) => {
    switch (id) {
      case "photo":
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false, // Disable cropping
          quality: 1, // Maximum quality
        });

        if (!result.canceled) {
          onAddImage(result.assets[0].uri);
        }
        break;
      case "voice":
        setVoiceModalVisible(true);
        break;
      case "tag":
        setTagModalVisible(true);
        break;
      case "color":
        setBackgroundModalVisible(true);
        break;
      case "list":
        const sampleListItem = "New list item";
        onAddListItem(sampleListItem);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <View style={styles.bottomBar}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.iconButton}
            onPress={() => handleActionPress(action.id)}
          >
            {action.type === "MaterialIcons" ? (
              <MaterialIcons
                name={action.icon as any}
                size={24}
                color="white"
              />
            ) : (
              <Ionicons name={action.icon as any} size={24} color="white" />
            )}
            {/* <Text style={styles.iconText}>{action.name}</Text> */}
          </TouchableOpacity>
        ))}
      </View>
      {/* Background Color Modal */}
      <Modal visible={backgroundModalVisible} transparent>
        <View style={styles.container}>
          <View style={styles.handle} />
          <TouchableOpacity
            style={{ position: "absolute", left: 10, top: 25, zIndex: 10 }}
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
    gap: 10,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: Colors.primary,
    padding: 7,
    borderRadius: 50,
  },
  iconText: {
    color: "white",
    fontSize: 12,
  },
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.greyLight,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    width: "100%",
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
  },
  tagItem: {
    backgroundColor: "#000",
    padding: 10,
    marginVertical: 5,
  },
  tagText: {
    fontSize: 16,
  },
  closeModalButton: {
    padding: 10,
    backgroundColor: Colors.primary,
    marginTop: 20,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
  },
  colorBox: {
    width: 50,
    height: 50,
    marginHorizontal: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "white",
  },
});

export default BottomBar;
