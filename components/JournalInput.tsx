import React, { useState, forwardRef, useImperativeHandle } from "react";
import {
  TextInput,
  StyleSheet,
  View,
  FlatList,
  Image,
  Text,
  Button,
  TouchableOpacity,
} from "react-native";
import Colors from "@/constants/Colors";

export interface InputComponentRef {
  addImage: (imageUri: string) => void;
  addTag: (tag: string) => void;
  addListItem: (listItem: string) => void;
  addTodo: (todoItem: string) => void;
  addAudio: (audioUri: string) => void;
}

const InputComponent = forwardRef<InputComponentRef>((_, ref) => {
  const [content, setContent] = useState<
    Array<{ type: string; data: string | boolean; completed?: boolean }>
  >([{ type: "text", data: "" }]);

  useImperativeHandle(ref, () => ({
    addImage: (imageUri: string) => {
      setContent((prev) => [
        ...prev,
        { type: "image", data: imageUri },
        { type: "text", data: "" },
      ]);
    },
    addTag: (tag: string) => {
      setContent((prev) => [...prev, { type: "tag", data: tag }]);
    },
    addListItem: (listItem: string) => {
      setContent((prev) => [
        ...prev,
        { type: "list", data: listItem },
        { type: "text", data: "" },
      ]);
    },
    addTodo: (todoItem: string) => {
      setContent((prev) => [
        ...prev,
        { type: "todo", data: todoItem, completed: false },
        { type: "text", data: "" },
      ]);
    },
    addAudio: (audioUri: string) => {
      setContent((prev) => [
        ...prev,
        { type: "audio", data: audioUri },
        { type: "text", data: "" },
      ]);
    },
  }));

  const updateTextBlock = (text: string, index: number) => {
    setContent((prev) =>
      prev.map((block, i) => (i === index ? { ...block, data: text } : block))
    );
  };

  const toggleTodo = (index: number) => {
    setContent((prev) =>
      prev.map((block, i) =>
        i === index ? { ...block, completed: !block.completed } : block
      )
    );
  };

  return (
    <FlatList
      data={content}
      keyExtractor={(_, index) => index.toString()}
      renderItem={({ item, index }) => {
        if (item.type === "text") {
          return (
            <TextInput
              autoFocus
              style={styles.input}
              placeholder="Start writing..."
              placeholderTextColor={Colors.greyLight}
              multiline
              value={item.data as string}
              onChangeText={(text) => updateTextBlock(text, index)}
            />
          );
        } else if (item.type === "image") {
          return (
            <View
              style={{
                height: 200,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f0f0f0",
                overflow: "hidden",
              }}
            >
              <Image
                source={{ uri: item.data as string }}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          );
        } else if (item.type === "tag") {
          return <Text style={styles.tag}>#{item.data}</Text>;
        } else if (item.type === "list") {
          return <Text style={styles.listItem}>- {item.data}</Text>;
        } else if (item.type === "todo") {
          return (
            <TouchableOpacity
              onPress={() => toggleTodo(index)}
              style={styles.todoBlock}
            >
              <Text
                style={
                  item.completed ? styles.todoCompleted : styles.todoPending
                }
              >
                {item.completed ? "\u2713" : "\u25A2"} {item.data}
              </Text>
            </TouchableOpacity>
          );
        } else if (item.type === "audio") {
          return (
            <Button
              title="Play Audio"
              // onPress={async () => {
              //   const sound = new Audio.Sound();
              //   await sound.loadAsync({ uri: item.data as string });
              //   await sound.playAsync();
              // }}
            />
          );
        }
        return null;
      }}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    color: Colors.light,
    textAlign: "left",
  },
  image: {
    height: 200,
    width: "100%",
    maxWidth: "100%",
  },
  tag: {
    fontSize: 16,
    color: Colors.primary,
    marginVertical: 5,
    textAlign: "left",
  },
  listItem: {
    fontSize: 16,
    color: Colors.light,
    marginVertical: 5,
    textAlign: "left",
  },
  todoBlock: {
    marginVertical: 5,
  },
  todoPending: {
    fontSize: 16,
    color: Colors.light,
    textAlign: "left",
  },
  todoCompleted: {
    fontSize: 16,
    color: Colors.selected,
    textDecorationLine: "line-through",
    textAlign: "left",
  },
});

export default InputComponent;
