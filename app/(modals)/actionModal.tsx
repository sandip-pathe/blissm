import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";

const ActionBar = ({ visible, onClose, actions }) => {
  if (!visible) return null;
  if (!actions) return null;
  const { colors } = useTheme();
  const styles = themedStyles(colors);
  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <View style={styles.actionBar}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.actionButton}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={action.onPress}
                style={styles.iconButton}
              >
                {action.icon && (
                  <action.icon.type {...action.icon.props} size={24} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const themedStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "100%",
      zIndex: 999,
    },
    actionBar: {
      justifyContent: "space-between",
      alignItems: "center",
      flexDirection: "row",
      backgroundColor: colors.background,
      paddingHorizontal: 10,
      padding: 10,
      marginBottom: 20,
      elevation: 5,
    },
    iconButton: {
      padding: 10,
    },
    actionButton: {
      gap: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 5,
      marginHorizontal: 5,
    },
  });

export default ActionBar;
