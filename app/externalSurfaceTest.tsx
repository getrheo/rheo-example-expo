import type { ExternalSurfaceHostProps } from '@getrheo/react-native-expo';
import { Pressable, Text, View } from 'react-native';

const ExternalSurfaceTest = ({
  surfaceId,
  onComplete,
  onBack,
  onDismiss,
}: ExternalSurfaceHostProps) => (
  <View
    style={{
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      padding: 24,
      gap: 12,
    }}
  >
    <Text style={{ color: '#000000', fontSize: 20, fontWeight: '600' }}>
      External surface test
    </Text>
    <Text style={{ color: '#71717a', marginBottom: 8, textAlign: 'center' }}>
      {surfaceId}
    </Text>
    <Pressable
      onPress={onComplete}
      style={{
        backgroundColor: '#18181b',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 200,
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#fafafa', fontWeight: '600' }}>Complete</Text>
    </Pressable>
    <Pressable
      onPress={onBack}
      style={{
        backgroundColor: '#e4e4e7',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 200,
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#18181b', fontWeight: '600' }}>Back</Text>
    </Pressable>
    <Pressable
      onPress={onDismiss}
      style={{
        backgroundColor: '#e4e4e7',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 200,
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#18181b', fontWeight: '600' }}>Dismiss</Text>
    </Pressable>
  </View>
);

export default ExternalSurfaceTest;
