import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { fetch } from 'expo/fetch';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { KamaloIcon, type KamaloIconName } from '@/components/kamalo-icon';
import {
  getListMySupportTicketsQueryKey,
  getListSupportTicketsQueryKey,
  getGetConversationQueryKey,
  ImageAttachment,
  uploadConversationImage,
  useCreateConversation,
  useCreateSupportTicket,
  useListConversations,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NavigationMenu } from '@/components/NavigationMenu';

const CATEGORIES: string[] = [
  'Coins related',
  'Transaction related',
  'Fincado related',
  'Others',
];

export default function RaiseTicketScreen() {
  const colors = useColors();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { currentUser, logActivity } = useAuth();
  const { showToast } = useToast();
  const conversations = useListConversations();
  const createConversation = useCreateConversation();
  const createTicket = useCreateSupportTicket();

  const params = useLocalSearchParams<{
    conversationId?: string;
    messageId?: string;
    feedbackSummary?: string;
    feedbackNote?: string;
  }>();

  // Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [attachment, setAttachment] = useState<{ item: ImageAttachment; previewUri: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentUser) {
      if (!name) setName(currentUser.name);
      if (!email && currentUser.email) setEmail(currentUser.email);
    }
  }, [currentUser]);

  useEffect(() => {
    if (params.feedbackSummary) setSummary(params.feedbackSummary);
    if (params.feedbackNote) setDetails(params.feedbackNote);
  }, [params.feedbackNote, params.feedbackSummary]);

  async function chooseImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Needed', 'Please allow photo access to upload an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.82,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    // Check size limit: max 5MB (5 * 1024 * 1024 bytes)
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert('File Too Large', 'Please choose an image under 5 MB.');
      return;
    }

    setUploading(true);
    try {
      let activeConversationId = params.conversationId || conversations.data?.[0]?.id;
      if (!activeConversationId) {
        const created = await createConversation.mutateAsync({
          data: { title: summary.trim().slice(0, 64) || 'Support ticket' },
        });
        activeConversationId = created.id;
      }

      const blob = await (await fetch(asset.uri)).blob();
      const uploaded = await uploadConversationImage(activeConversationId, { file: blob });

      setAttachment({ item: uploaded, previewUri: asset.uri });
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } catch {
      Alert.alert('Upload Failed', 'Could not upload this image. Please ensure it is under 5 MB and try again.');
    } finally {
      setUploading(false);
    }
  }

  async function submitTicket() {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = 'Please enter your name.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Please enter your email.';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!summary.trim() || summary.trim().length < 3) {
      nextErrors.summary = 'Please give a short summary of the issue.';
    }

    if (!details.trim() || details.trim().length < 3) {
      nextErrors.details = 'Please describe the problem in a few words.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {}
      return;
    }

    setSubmitting(true);
    try {
      let conversationId = params.conversationId || conversations.data?.[0]?.id;
      if (!conversationId) {
        const created = await createConversation.mutateAsync({
          data: { title: summary.trim().slice(0, 64) },
        });
        conversationId = created.id;
      }

      const formattedDetails = `Raised by: ${name.trim()}\n\n${details.trim()}`;

      const createdTicket = await createTicket.mutateAsync({
        data: {
          conversationId,
          messageId: params.messageId || null,
          category,
          summary: summary.trim(),
          details: formattedDetails,
          contactEmail: email.trim(),
          attachmentIds: attachment ? [attachment.item.id] : undefined,
        },
      });

      await queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(conversationId) });
      await queryClient.invalidateQueries({ queryKey: getListMySupportTicketsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getListSupportTicketsQueryKey() });

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      logActivity(
        'TICKET_CREATED',
        `Ticket #${createdTicket.ticketNumber} raised: "${summary.trim()}" (${category}) by ${name.trim()}`,
        createdTicket.ticketNumber
      );

      showToast({
        title: `Ticket #${createdTicket.ticketNumber} Raised`,
        message: 'Your request has been routed to the priority queue.',
        type: 'success',
      });

      Alert.alert(
        'Ticket Raised',
        `Your ticket #${createdTicket.ticketNumber} was successfully raised. Our team will resolve it quickly!`,
        [
          {
            text: 'View Ticket',
            onPress: () => router.push(`/ticket/${createdTicket.id}`),
          },
          {
            text: 'Done',
            onPress: () => router.replace('/(tabs)/history'),
          },
        ]
      );

      // Clear form
      setName('');
      setEmail('');
      setSummary('');
      setDetails('');
      setAttachment(null);
      setErrors({});
    } catch {
      Alert.alert('Could Not Submit', 'Something went wrong. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sleek Theme-Responsive Header */}
      <View
        style={[
          styles.themeHeader,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top + 8, 20),
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Raise a Ticket</Text>

          <View style={styles.headerRight}>
            <ThemeToggle />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View previous tickets"
              onPress={() => router.push('/(tabs)/history')}
              hitSlop={8}
              style={({ pressed }) => [
                styles.headerIconBtn,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  borderWidth: 1,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <KamaloIcon name="clock" size={17} color={colors.foreground} />
            </Pressable>
            <NavigationMenu />
          </View>
        </View>
      </View>

      {/* Clean Form Content with Scroll View */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 40, 60) },
          ]}
        >
          {/* Name Field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Your Name</Text>
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="e.g. Yash"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  borderColor: errors.name ? colors.destructive : colors.border,
                  color: colors.foreground,
                },
              ]}
            />
            {errors.name ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.name}</Text>
            ) : null}
          </View>

          {/* Email Field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Your Email</Text>
            <TextInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              placeholder="name@example.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  borderColor: errors.email ? colors.destructive : colors.border,
                  color: colors.foreground,
                },
              ]}
            />
            {errors.email ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.email}</Text>
            ) : null}
          </View>

          {/* Category Dropdown (Pure text, no select buttons, no icons) */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Choose Category</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select category"
              onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              style={[
                styles.dropdownTrigger,
                {
                  backgroundColor: colors.card,
                  borderColor: categoryDropdownOpen ? colors.foreground : colors.border,
                },
              ]}
            >
              <Text style={[styles.dropdownTriggerText, { color: colors.foreground }]}>
                {category}
              </Text>
              <KamaloIcon
                name={categoryDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.mutedForeground}
              />
            </Pressable>

            {categoryDropdownOpen && (
              <View
                style={[
                  styles.dropdownMenu,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                {CATEGORIES.map((cat, idx) => {
                  const isSelected = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => {
                        setCategory(cat);
                        setCategoryDropdownOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        {
                          borderBottomColor: colors.border,
                          borderBottomWidth: idx === CATEGORIES.length - 1 ? 0 : 1,
                          backgroundColor: isSelected
                            ? colors.secondary
                            : pressed
                            ? colors.secondary
                            : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          {
                            color: isSelected ? colors.foreground : colors.mutedForeground,
                            fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                          },
                        ]}
                      >
                        {cat}
                      </Text>
                      {isSelected ? (
                        <KamaloIcon name="check" size={16} color={colors.foreground} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Summary of Issue */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Summary of Issue</Text>
            <TextInput
              value={summary}
              onChangeText={(text) => {
                setSummary(text);
                if (errors.summary) setErrors((prev) => ({ ...prev, summary: '' }));
              }}
              placeholder="What went wrong in one line?"
              placeholderTextColor={colors.mutedForeground}
              maxLength={180}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  borderColor: errors.summary ? colors.destructive : colors.border,
                  color: colors.foreground,
                },
              ]}
            />
            {errors.summary ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.summary}</Text>
            ) : null}
          </View>

          {/* Details */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Details</Text>
            <TextInput
              value={details}
              onChangeText={(text) => {
                setDetails(text);
                if (errors.details) setErrors((prev) => ({ ...prev, details: '' }));
              }}
              placeholder="Explain what happened so our team can help you solve it..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.card,
                  borderColor: errors.details ? colors.destructive : colors.border,
                  color: colors.foreground,
                },
              ]}
            />
            {errors.details ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.details}</Text>
            ) : null}
          </View>

          {/* Image Upload (Under 5MB) */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Reference Image or File (Under 5MB)
            </Text>

            {attachment ? (
              <View
                style={[
                  styles.attachedBox,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Image source={{ uri: attachment.previewUri }} style={styles.attachedImage} />
                <View style={styles.attachedInfo}>
                  <Text style={[styles.attachedFilename, { color: colors.foreground }]} numberOfLines={1}>
                    {attachment.item.filename}
                  </Text>
                  <Text style={[styles.attachedSub, { color: colors.mutedForeground }]}>
                    Photo attached successfully
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove image"
                  onPress={() => setAttachment(null)}
                  hitSlop={10}
                  style={styles.removeImageBtn}
                >
                  <KamaloIcon name="x" size={18} color={colors.destructive} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={chooseImage}
                disabled={uploading}
                style={({ pressed }) => [
                  styles.uploadBox,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: uploading ? 0.6 : pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={[styles.uploadIconWrap, { backgroundColor: colors.secondary }]}>
                  <KamaloIcon name={uploading ? 'loader' : 'image'} size={20} color={colors.foreground} />
                </View>
                <View style={styles.uploadTextWrap}>
                  <Text style={[styles.uploadPrimaryText, { color: colors.foreground }]}>
                    {uploading ? 'Uploading image...' : 'Tap to attach screenshot'}
                  </Text>
                  <Text style={[styles.uploadSecondaryText, { color: colors.mutedForeground }]}>
                    JPG or PNG under 5MB (Optional)
                  </Text>
                </View>
              </Pressable>
            )}
          </View>

          {/* Submit Button */}
          <Pressable
            accessibilityRole="button"
            disabled={submitting || uploading}
            onPress={submitTicket}
            style={({ pressed }) => [
              styles.submitBtn,
              {
                backgroundColor: colors.primary,
                opacity: submitting || uploading ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <KamaloIcon
              name={submitting ? 'loader' : 'arrow-up-right'}
              size={18}
              color={colors.primaryForeground}
            />
            <Text
              style={[
                styles.submitBtnText,
                { color: colors.primaryForeground },
              ]}
            >
              {submitting ? 'Raising Ticket...' : 'Raise a Ticket'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    letterSpacing: -0.4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  textArea: {
    minHeight: 110,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 5,
  },
  dropdownTrigger: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownTriggerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  dropdownMenu: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dropdownItemText: {
    fontSize: 14,
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  uploadIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTextWrap: {
    flex: 1,
  },
  uploadPrimaryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  uploadSecondaryText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  attachedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  attachedImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  attachedInfo: {
    flex: 1,
  },
  attachedFilename: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  attachedSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  removeImageBtn: {
    padding: 8,
  },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  submitBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
});