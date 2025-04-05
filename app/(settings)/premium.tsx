import React, { useState, useEffect } from "react";
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useTheme } from "@react-navigation/native";
import { posthog } from "@/constants/posthogConfig";
import { Stack } from "expo-router";

const plans = [
  {
    name: "Basic",
    price: "Free",
    features: ["Limited AI Journaling", "Basic Chatbot Access"],
  },
  {
    name: "Premium",
    price: "₹599/mo",
    features: [
      "Unlimited AI Journaling",
      "Hyper-Personalized AI Insights",
      "Access to Anonymous Communities",
      "Real-Life Professional Guidance",
      "Access to multiple Chatbots created by Experts",
    ],
    recommended: true,
  },
  {
    name: "Elite",
    price: "₹1499/mo",
    features: [
      "Everything in Premium",
      "Create your own Blissmates",
      "1-on-1 Professional Sessions",
      "Early Access to Cutting-Edge Features",
    ],
  },
];

const PremiumUpsell = () => {
  const navigation = useNavigation();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { colors } = useTheme();
  const styles = themedStyles(colors);

  useEffect(() => {
    posthog.capture("viewed_premium_upsell");
  }, []);

  const handleUpgrade = (plan: { name: string }) => {
    setSelectedPlan(plan.name);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          statusBarBackgroundColor: colors.background,
        }}
      />
      <View style={styles.wrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Headline */}
          <Text style={styles.header}>Unlock Your Best Self with Blissm+</Text>
          <Text style={styles.subheader}>
            Your mental well-being deserves more—more clarity, more insights,
            and more support, right at your fingertips.
          </Text>

          {/* Plan Cards */}
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.name}
              onPress={() => handleUpgrade(plan)}
              style={[
                styles.planCard,
                selectedPlan === plan.name && styles.selectedPlan,
              ]}
            >
              {plan.recommended && (
                <Text style={styles.recommended}>Most Popular</Text>
              )}
              <Text style={styles.planTitle}>
                {plan.name} - {plan.price}
              </Text>
              {plan.features.map((feature, index) => (
                <Text key={index} style={styles.featureText}>
                  ✔ {feature}
                </Text>
              ))}
            </TouchableOpacity>
          ))}

          {/* Limited-Time Offer */}
          <Text style={styles.limitedOffer}>⚡ Exclusive Offer </Text>
          <Text style={styles.limitedOffer}>
            Get 50% OFF your first month—because investing in yourself should be
            easy. 💛
          </Text>
        </ScrollView>
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => handleUpgrade({ name: "Premium" })}
          >
            <Text style={styles.ctaText}>Premium Coming Soon</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default PremiumUpsell;

const themedStyles = (colors) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      padding: 16,
      alignItems: "center",
      flexGrow: 1,
    },
    header: {
      fontSize: 24,
      color: colors.text,
      fontFamily: "Poppins-Bold",
      textAlign: "center",
      marginBottom: 8,
    },
    subheader: {
      fontSize: 14,
      color: colors.border,
      marginBottom: 16,
      textAlign: "center",
      fontFamily: "Poppins-Regular",
    },
    planCard: {
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 10,
      width: "100%",
      marginBottom: 12,
      borderWidth: 2,
      borderColor: colors.background,
    },
    selectedPlan: {
      borderColor: colors.primary,
    },
    recommended: {
      backgroundColor: colors.primary,
      color: colors.text,
      fontFamily: "Poppins-Bold",
      padding: 5,
      borderRadius: 5,
      alignSelf: "flex-start",
    },
    planTitle: {
      fontSize: 20,
      fontFamily: "Poppins-Bold",
      color: colors.text,
      marginBottom: 6,
    },
    featureText: {
      fontSize: 14,
      color: colors.text,
      fontFamily: "Poppins-Regular",
    },
    offerBox: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 10,
      width: "100%",
      marginVertical: 12,
      alignItems: "center",
    },
    limitedOffer: {
      fontSize: 18,
      color: colors.notification,
      fontFamily: "Poppins-Bold",
      marginTop: 10,
      textAlign: "center",
    },
    bottomContainer: {
      width: "100%",
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderColor: colors.card,
      alignItems: "center",
    },
    ctaButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 10,
      width: "100%",
      alignItems: "center",
    },
    ctaText: {
      color: colors.text,
      fontSize: 18,
      fontFamily: "Poppins-Bold",
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
      padding: 10,
      borderRadius: 5,
    },
    backButtonText: {
      color: colors.text,
      fontFamily: "Poppins-Bold",
      marginLeft: 5,
    },
  });
