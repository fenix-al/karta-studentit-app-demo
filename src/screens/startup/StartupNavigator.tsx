import React, { useState } from 'react';
import { View } from 'react-native';
import StartupHubScreen from './StartupHubScreen';
import StartupListScreen from './StartupListScreen';
import StartupItemProfileScreen from './StartupItemProfileScreen';

type Screen =
  | { name: 'hub' }
  | { name: 'list'; title: string; type?: 'thirrje' | 'udhezues' }
  | { name: 'profile'; itemId: string };

interface Props {
  onExit: () => void;
  bottomInset: number;
  initialList?: string;
  initialItemId?: string;
}

function titleToType(title?: string): 'thirrje' | 'udhezues' | undefined {
  const normalized = (title ?? '').toLowerCase();
  if (normalized.includes('thirrje')) return 'thirrje';
  if (normalized.includes('material') || normalized.includes('udhezues')) return 'udhezues';
  return undefined;
}

export default function StartupNavigator({ onExit, bottomInset, initialList, initialItemId }: Props) {
  const [stack, setStack] = useState<Screen[]>(
    initialItemId
      ? [{ name: 'profile', itemId: initialItemId }]
      : initialList
      ? [{ name: 'list', title: initialList, type: titleToType(initialList) }]
      : [{ name: 'hub' }],
  );

  const current = stack[stack.length - 1];

  const push = (screen: Screen) => setStack((prev) => [...prev, screen]);
  const pop = () => {
    if (stack.length <= 1) {
      onExit();
      return;
    }

    setStack((prev) => prev.slice(0, -1));
  };

  return (
    <View style={{ flex: 1 }}>
      {current.name === 'hub' && (
        <StartupHubScreen
          onBack={onExit}
          onList={(title, type) => push({ name: 'list', title, type })}
          onProfile={(itemId) => push({ name: 'profile', itemId })}
          bottomInset={bottomInset}
        />
      )}
      {current.name === 'list' && (
        <StartupListScreen
          title={current.title}
          initialType={current.type}
          onBack={pop}
          onProfile={(itemId) => push({ name: 'profile', itemId })}
          bottomInset={bottomInset}
        />
      )}
      {current.name === 'profile' && (
        <StartupItemProfileScreen
          itemId={current.itemId}
          onBack={pop}
          bottomInset={bottomInset}
        />
      )}
    </View>
  );
}
