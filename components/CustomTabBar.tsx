import { useTheme } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Keyboard,
} from "react-native";

type CustomTabBarProps = {
  state: any;
  descriptors: any;
  navigation: any;
};

const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const { colors } = useTheme();
  const styles = themedStyles(colors);
  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const keyboardHideListener = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  if (isKeyboardVisible) return null; // Hide tab bar when keyboard is open

  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const icon = options.tabBarIcon?.({
          color: isFocused ? colors.text : colors.border,
          focused: isFocused,
          size: 30,
        });

        const showLabel =
          options.tabBarShowLabel !== undefined
            ? options.tabBarShowLabel
            : false;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabItem}
          >
            <View style={[styles.iconContainer, isFocused && styles.activeTab]}>
              {icon}
            </View>
            {showLabel && (
              <Text style={styles.tabLabel}>{options.title || route.name}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default CustomTabBar;

const themedStyles = (colors) =>
  StyleSheet.create({
    tabBarContainer: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 20,
      marginHorizontal: 16,
      marginBottom: 16,
      paddingVertical: 5,
      paddingHorizontal: 20,
      justifyContent: "space-between",
    },
    tabItem: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 5,
    },
    iconContainer: {
      paddingHorizontal: 15,
      paddingVertical: 5,
      borderRadius: 20,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabLabel: {
      fontSize: 12,
      marginTop: 4,
      color: colors.text,
      fontFamily: "Poppins-Bold",
    },
  });
