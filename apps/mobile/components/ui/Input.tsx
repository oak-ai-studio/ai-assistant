import { View, TextInput, Text } from 'react-native';
import { useState } from 'react';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';

interface InputProps {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  disabled?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  maxLength?: number;
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
}

export function Input({
  label,
  hint,
  error,
  placeholder,
  value,
  onChangeText,
  disabled,
  secureTextEntry,
  keyboardType,
  maxLength,
  autoCapitalize = 'none',
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: 5 }}>
      {label && (
        <Text
          style={[
            typography.mono,
            {
              color: colors.ink60,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ink30}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        style={{
          backgroundColor: focused ? colors.offWhite : colors.sandLight,
          borderWidth: 1.5,
          borderColor: error
            ? colors.danger
            : focused
              ? colors.orange
              : colors.ink10,
          borderRadius: radius.md,
          paddingHorizontal: 14,
          paddingVertical: 11,
          fontFamily: 'DMSans_400Regular',
          fontSize: 14,
          color: disabled ? colors.ink30 : colors.ink,
          opacity: disabled ? 0.5 : 1,
        }}
      />
      {(hint || error) && (
        <Text
          style={[
            typography.caption,
            { color: error ? colors.danger : colors.ink60 },
          ]}
        >
          {error ?? hint}
        </Text>
      )}
    </View>
  );
}
