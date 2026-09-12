import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface QuickDialerProps {
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  onMakeCall: () => void;
}

export const QuickDialer: React.FC<QuickDialerProps> = ({
  phoneNumber,
  setPhoneNumber,
  onMakeCall,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardSectionLabel}>QUICK DIALER</Text>

      <View style={styles.dialInputContainer}>
        <TextInput
          style={styles.dialInput}
          placeholder="Enter phone number"
          placeholderTextColor="#64748B"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
        {phoneNumber.length > 0 && (
          <TouchableOpacity
            onPress={() => setPhoneNumber('')}
            style={styles.dialClearButton}>
            <Text style={styles.dialClearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.dialButton,
          !phoneNumber.trim() && styles.dialButtonDisabled,
        ]}
        onPress={onMakeCall}>
        <Text style={styles.dialButtonIcon}>📞</Text>
        <Text style={styles.dialButtonText}>START PHONE CALL</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161F30',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#22314E',
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 10,
  },
  dialInputContainer: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dialInput: {
    backgroundColor: '#0B0F19',
    borderWidth: 1,
    borderColor: '#2A3C60',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  dialClearButton: {
    position: 'absolute',
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialClearText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dialButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    elevation: 3,
  },
  dialButtonDisabled: {
    backgroundColor: '#1E293B',
    opacity: 0.6,
  },
  dialButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  dialButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
