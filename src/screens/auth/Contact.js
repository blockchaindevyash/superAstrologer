import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useRoute } from "@react-navigation/native";

import COLORS from "../../config/colors";
import { Loader, AppStatusBar, BackButton } from "../../config/service";
import { sendContact } from "../../api/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQItem = ({ title, description, openDefault = false }) => {
  const [open, setOpen] = useState(openDefault);

  const toggle = () => {
    LayoutAnimation.easeInEaseOut();
    setOpen(!open);
  };

  return (
    <View style={styles.faqCard}>
      <TouchableOpacity style={styles.faqHeader} onPress={toggle}>
        <Text style={styles.faqTitle}>{title}</Text>
        <MaterialIcons
          name={open ? "expand-less" : "expand-more"}
          size={24}
          color="#999"
        />
      </TouchableOpacity>

      {open && (
        <Text style={styles.faqDesc}>{description}</Text>
      )}
    </View>
  );
};

export default function Contact() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const contactData = route?.params?.contactData || route?.params || {};
  const email = contactData?.email || contactData?.support_email || null;
  const whatsapp = contactData?.whatsapp_no || contactData?.whatsapp || null;

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const faqItems = useMemo(() => {
    const faq = contactData?.faq;
    if (!faq) return [];
    if (Array.isArray(faq)) {
      // Normalize array items to { title, description }
      return faq.map((it, i) => ({
        title: it?.title ?? it?.question ?? `FAQ ${i + 1}`,
        description: it?.description ?? it?.answer ?? '',
      }));
    }
    // convert object to array of { title, description }
    return Object.entries(faq).map(([title, description]) => ({ title, description: String(description ?? "") }));
  }, [contactData]);

  const handleSubmit = async () => {
    try {
      if (!subject.trim() || !message.trim()) {
        Alert.alert("Missing info", "Please provide subject and message.");
        return;
      }
      setSending(true);
      const res = await sendContact(subject.trim(), category.trim(), message.trim());
      if (res?.msg === 'done' || res?.success) {
        Alert.alert("Sent", "Your message has been submitted. We'll get back to you soon.");
        setSubject("");
        setCategory("");
        setMessage("");
      } else {
        Alert.alert("Failed", res?.error || "Couldn't send your message. Try again.");
      }
    } catch (e) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const openWhatsApp = () => {
    const raw = String(whatsapp || '');
    const number = raw.replace(/\D/g, '');
    if (!number) {
      Alert.alert('Unavailable', 'WhatsApp number is not available.');
      return;
    }
    const url = `https://wa.me/${number}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open WhatsApp.');
    });
  };
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
      <AppStatusBar backgroundColor={COLORS.secondary} />

      {/* Header */}
      <View style={styles.header}>
        <BackButton navigation={navigation} />
        <Text style={styles.headerTitle}>Support & FAQ</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* FAQ */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqItems.length > 0 ? (
          faqItems.map((it, idx) => (
            <FAQItem
              key={`${it.title || 'faq'}-${idx}`}
              openDefault={idx === 0}
              title={it.title ?? `FAQ ${idx + 1}`}
              description={it.description ?? ''}
            />
          ))
        ) : (
          <Text style={[styles.subText, { fontStyle: 'italic' }]}>No FAQs available.</Text>
        )}
        {/* Contact */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.subText}>
          Can't find what you need? Send us a message.
        </Text>
        <TextInput
          placeholder="Subject"
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          editable={!sending}
        />
        <TextInput
          placeholder="Category"
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          editable={!sending}
        />
        <TextInput
          placeholder="How can we help you today?"
          style={[styles.input, styles.textArea]}
          multiline
          value={message}
          onChangeText={setMessage}
          editable={!sending}
        />
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={sending}>
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit Request</Text>
          )}
        </TouchableOpacity>
        {/* Quick Contact */}
        <View style={styles.helpBox}>
          <Text style={styles.helpTitle}>Still need help?</Text>
          <Text style={styles.subText}>Our support team is available 24/7</Text>
          {email ? (
            <View style={styles.mailBtn}>
              <MaterialIcons name="mail-outline" size={20} />
              <Text style={styles.mailText}>{email}</Text>
            </View>
          ) : null}

          {whatsapp ? (
            <TouchableOpacity style={styles.whatsappBtn} onPress={openWhatsApp}>
              <MaterialCommunityIcons name="whatsapp" size={20} color="#fff" />
              <Text style={styles.whatsappText}>{whatsapp}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.primary,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    backgroundColor: "#f4f4f4",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },

  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 15,
  },

  chipsRow: {
    paddingHorizontal: 16,
  },

  chip: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  chipActive: {
    backgroundColor: COLORS.primary,
  },

  chipText: {
    fontSize: 14,
    color: "#555",
  },

  chipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginHorizontal: 16,
    marginTop: 24,
  },

  faqCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
  },

  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  faqTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    paddingRight: 10,
  },

  faqDesc: {
    marginTop: 10,
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },

  subText: {
    fontSize: 13,
    color: "#777",
    marginHorizontal: 16,
    marginTop: 6,
  },

  input: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
  },

  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },

  submitBtn: {
    backgroundColor: COLORS.primary,
    margin: 16,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  helpBox: {
    backgroundColor: "#ecececff",
    margin: 16,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },

  helpTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  mailBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
    marginTop: 12,
  },

  mailText: {
    marginLeft: 8,
    fontWeight: "600",
  },

  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#25D366",
    padding: 12,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
    marginTop: 10,
  },

  whatsappText: {
    marginLeft: 8,
    color: "#fff",
    fontWeight: "700",
  },
});
