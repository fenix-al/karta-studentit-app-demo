import React, { useState } from 'react';
import { View } from 'react-native';
import KVRHubScreen from './KVRHubScreen';
import KVRListScreen from './KVRListScreen';
import KVRProfileScreen from './KVRProfileScreen';
import { KvrActivity } from '../../types';

type Screen =
  | { name: 'hub' }
  | { name: 'list'; title: string; catId: string }
  | { name: 'profile'; activity: KvrActivity };

interface Props {
  onExit:      () => void;
  bottomInset: number;
}

export default function KVRNavigator({ onExit, bottomInset }: Props) {
  const [stack, setStack] = useState<Screen[]>([{ name: 'hub' }]);

  const current = stack[stack.length - 1];
  const push = (screen: Screen) => setStack(prev => [...prev, screen]);
  const pop  = () => {
    if (stack.length <= 1) { onExit(); return; }
    setStack(prev => prev.slice(0, -1));
  };

  return (
    <View style={{ flex: 1 }}>
      {current.name === 'hub' && (
        <KVRHubScreen
          onBack={onExit}
          onList={(title, catId) => push({ name: 'list', title, catId })}
          onProfile={activity => push({ name: 'profile', activity })}
          bottomInset={bottomInset}
        />
      )}
      {current.name === 'list' && (
        <KVRListScreen
          title={current.title}
          initialCatId={current.catId}
          onBack={pop}
          onProfile={activity => push({ name: 'profile', activity })}
          bottomInset={bottomInset}
        />
      )}
      {current.name === 'profile' && (
        <KVRProfileScreen
          activity={current.activity}
          onBack={pop}
          bottomInset={bottomInset}
        />
      )}
    </View>
  );
}
