import { useTheme } from "@react-navigation/native";
import React from "react";
import { ScrollView, Text, StyleSheet, SafeAreaView, View } from "react-native";

const PrivacyTermsScreen = () => {
  const { colors } = useTheme();
  const styles = themedStyles(colors);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Privacy Policy & Terms of Use</Text>
        <Text style={styles.subHeader}>Last Updated: 15/02/2025</Text>

        <View style={styles.section}>
          <Text style={styles.title}>1. Introduction</Text>
          <Text style={styles.text}>
            Welcome to <Text style={styles.bold}>Blissm</Text>! We are committed
            to protecting your privacy and ensuring a safe experience on our
            platform. By accessing or using our services, you agree to comply
            with these <Text style={styles.bold}>Terms of Use</Text> and our{" "}
            <Text style={styles.bold}>Privacy Policy</Text>.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>2. Definitions</Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>"We," "Us," "Our"</Text> – Refers to
            Blissm, its operators, and affiliates.
            {"\n"}
            <Text style={styles.bold}>"You," "User"</Text> – Refers to any
            person using our platform.
            {"\n"}
            <Text style={styles.bold}>"Services"</Text> – Includes the Blissm
            app, website, and related features.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>3. Privacy Policy</Text>
          <Text style={styles.subTitle}>3.1 Data We Collect</Text>
          <Text style={styles.text}>
            We collect the following types of data:
          </Text>
          <Text style={styles.bullet}>
            • Personal Information: Name, email, phone number (if provided).
          </Text>
          <Text style={styles.bullet}>
            • Usage Data: Interactions within the app, analytics.
          </Text>
          <Text style={styles.bullet}>
            • Device Data: Device model, IP address, OS version.
          </Text>
          <Text style={styles.bullet}>
            • Chat Data: Conversations stored locally unless explicitly backed
            up by the user. we do not have access to chat data.
          </Text>

          <Text style={styles.subTitle}>
            3.2 How We Use Your Data (Other than chat data)
          </Text>
          <Text style={styles.bullet}>
            • Improve app functionality and user experience.
          </Text>
          <Text style={styles.bullet}>
            • Provide personalized recommendations.
          </Text>
          <Text style={styles.bullet}>
            • Ensure security and prevent fraud.
          </Text>
          <Text style={styles.bullet}>
            • Communicate important updates and offers.
          </Text>

          <Text style={styles.subTitle}>3.3 Data Sharing & Security</Text>
          <Text style={styles.bullet}>
            • We <Text style={styles.bold}>do not</Text> sell your data to third
            parties.
          </Text>
          <Text style={styles.bullet}>
            • Data may be shared with trusted service providers under{" "}
            <Text style={styles.bold}>strict confidentiality agreements</Text>.
          </Text>
          <Text style={styles.bullet}>
            • We implement security measures but cannot guarantee complete
            protection.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>4. Terms of Use</Text>
          <Text style={styles.subTitle}>4.1 User Responsibilities</Text>
          <Text style={styles.bullet}>
            • You must be <Text style={styles.bold}>18 years or older</Text> to
            use this app.
          </Text>
          <Text style={styles.bullet}>
            • You <Text style={styles.bold}>agree not to misuse</Text> the
            platform for illegal or unethical activities.
          </Text>
          <Text style={styles.bullet}>
            • You must <Text style={styles.bold}>not impersonate others</Text>{" "}
            or share misleading information.
          </Text>

          <Text style={styles.subTitle}>4.2 Prohibited Activities</Text>
          <Text style={styles.bullet}>
            • Sharing harmful, abusive, or discriminatory content.
          </Text>
          <Text style={styles.bullet}>
            • Engaging in spamming, hacking, or fraudulent activities.
          </Text>
          <Text style={styles.bullet}>
            • Violating intellectual property rights of BlissM or others.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>
            5. Governing Law & Dispute Resolution
          </Text>
          <Text style={styles.text}>
            • These terms are governed by the{" "}
            <Text style={styles.bold}>laws of India</Text>.{"\n"}• Disputes
            shall be subject to the{" "}
            <Text style={styles.bold}>
              exclusive jurisdiction of Mumbai courts
            </Text>
            .{"\n"}• We encourage resolving disputes{" "}
            <Text style={styles.bold}>amicably</Text> through customer support
            first.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>6. Changes to This Policy</Text>
          <Text style={styles.text}>
            We may update these terms from time to time. Users will be notified
            via in-app alerts or emails. Continued use after changes implies
            acceptance of the updated terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>7. Contact Us</Text>
          <Text style={styles.text}>
            For any privacy concerns or legal inquiries, contact us at
            <Text style={styles.bold}> [support email]</Text>.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const themedStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors,
    },
    scrollContainer: {
      padding: 20,
    },
    header: {
      fontSize: 24,
      fontFamily: "Poppins-Bold",
      textAlign: "center",
      marginBottom: 10,
      color: colors.primary,
    },
    subHeader: {
      fontSize: 14,
      textAlign: "center",
      marginBottom: 20,
      color: colors.notification,
      fontFamily: "Poppins-Regular",
    },
    section: {
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontFamily: "Poppins-Bold",
      color: colors.primary,
      marginBottom: 5,
    },
    subTitle: {
      fontSize: 16,
      fontFamily: "Poppins-Bold",
      color: colors.primary,
      marginTop: 10,
      marginBottom: 5,
    },
    text: {
      fontSize: 14,
      color: colors.text,
      textAlign: "justify",
      fontFamily: "Poppins-Regular",
    },
    bullet: {
      fontSize: 14,
      color: colors.text + "99",
      paddingLeft: 10,
      marginBottom: 3,
      fontFamily: "Poppins-Regular",
    },
    bold: {
      fontFamily: "Poppins-Bold",
    },
  });

export default PrivacyTermsScreen;
