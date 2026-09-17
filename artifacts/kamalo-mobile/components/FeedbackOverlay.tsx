import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ChatMessageFeedback } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

type FeedbackRating = Exclude<ChatMessageFeedback, null>;

export function FeedbackOverlay({
  visible,
  rating,
  submitting,
  error,
  onClose,
  onSubmit,
  onRaiseTicket,
}: {
  visible: boolean;
  rating: FeedbackRating;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (score: number, note: string) => void;
  onRaiseTicket: (score: number, note: string) => void;
}) {
  const colors = useColors();
  const [score, setScore] = useState<number | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      setScore(null);
      setNote('');
    }
  }, [visible, rating]);

  const isHelpful = rating === 'helpful';
  const canSubmit = score !== null && (!isHelpful ? note.trim().length >= 3 : true);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sheetHeader}>
            <View style={[styles.iconWrap, { backgroundColor: isHelpful ? colors.primary + '18' : colors.accent + '24' }]}>
              <Feather name={isHelpful ? 'thumbs-up' : 'thumbs-down'} size={18} color={isHelpful ? colors.primary : colors.accentForeground} />
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close feedback" onPress={onClose} hitSlop={10} style={styles.closeButton}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{isHelpful ? 'Glad that helped' : 'Help us improve'}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {isHelpful ? 'How would you rate this answer?' : 'What happened with this answer? Your feedback helps us fix the gaps.'}
          </Text>

          <View style={styles.stars} accessibilityRole="radiogroup" accessibilityLabel="Rate this answer from one to five stars">
            {[1, 2, 3, 4, 5].map((value) => {
              const selected = score !== null && value <= score;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${value} ${value === 1 ? 'star' : 'stars'}`}
                  onPress={() => setScore(value)}
                  hitSlop={6}
                  style={styles.starButton}
                >
                  <Feather name={selected ? 'star' : 'star'} size={28} color={selected ? colors.accentForeground : colors.border} />
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.ratingHint, { color: colors.mutedForeground }]}>
            {score ? `${score} out of 5 stars` : 'Select a star rating'}
          </Text>

          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={1000}
            textAlignVertical="top"
            placeholder={isHelpful ? 'Optional: what worked well?' : 'Tell us what went wrong or what you expected.'}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.noteInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
          />
          {!isHelpful && note.trim().length > 0 && note.trim().length < 3 ? <Text style={[styles.validation, { color: colors.destructive }]}>Add at least a few words about what happened.</Text> : null}
          {error ? <Text style={[styles.validation, { color: colors.destructive }]}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit || submitting}
            onPress={() => onSubmit(score!, note.trim())}
            style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, opacity: !canSubmit || submitting ? 0.45 : pressed ? 0.78 : 1 }]}
          >
            {submitting ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="send" size={15} color={colors.primaryForeground} />}
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Submit feedback</Text>
          </Pressable>
          {!isHelpful ? (
            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={() => onRaiseTicket(score ?? 1, note.trim())}
              style={({ pressed }) => [styles.ticketButton, { borderColor: colors.border, opacity: submitting ? 0.45 : pressed ? 0.65 : 1 }]}
            >
              <Feather name="life-buoy" size={15} color={colors.foreground} />
              <Text style={[styles.ticketButtonText, { color: colors.foreground }]}>Raise a ticket instead</Text>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(13, 29, 27, 0.52)' },
  sheet: { borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 22, paddingTop: 18, paddingBottom: 28 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  closeButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.4, marginTop: 14 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginTop: 6 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 9, marginTop: 20 },
  starButton: { padding: 2 },
  ratingHint: { fontFamily: 'Inter_500Medium', fontSize: 11, textAlign: 'center', marginTop: 8 },
  noteInput: { minHeight: 92, borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginTop: 18 },
  validation: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17, marginTop: 6 },
  primaryButton: { minHeight: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 18 },
  primaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  ticketButton: { minHeight: 44, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 9 },
  ticketButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});