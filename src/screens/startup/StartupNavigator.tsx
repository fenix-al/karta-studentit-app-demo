import React, { useState } from 'react';
import { View } from 'react-native';
import StartupHubScreen from './StartupHubScreen';
import StartupListScreen from './StartupListScreen';
import StartupItemProfileScreen from './StartupItemProfileScreen';
import { StartupItem } from '../../types';

type Screen =
  | { name: 'hub' }
  | { name: 'list'; title: string }
  | { name: 'profile'; item: StartupItem };

interface Props {
  onExit:      () => void;
  bottomInset: number;
  initialList?: string;
}

export default function StartupNavigator({ onExit, bottomInset, initialList }: Props) {
  const [stack, setStack] = useState<Screen[]>(
    initialList
      ? [{ name: 'hub' }, { name: 'list', title: initialList }]
      : [{ name: 'hub' }]
  );

  const current = stack[stack.length - 1];

  const push = (screen: Screen) => setStack(prev => [...prev, screen]);
  const pop  = () => {
    if (stack.length <= 1) { onExit(); return; }
    setStack(prev => prev.slice(0, -1));
  };

  return (
    <View style={{ flex: 1 }}>
      {current.name === 'hub' && (
        <StartupHubScreen
          onBack={onExit}
          onList={title => push({ name: 'list', title })}
          onProfile={item => push({ name: 'profile', item })}
          bottomInset={bottomInset}
        />
      )}
      {current.name === 'list' && (
        <StartupListScreen
          title={current.title}
          onBack={pop}
          onProfile={item => push({ name: 'profile', item })}
          bottomInset={bottomInset}
        />
      )}
      {current.name === 'profile' && (
        <StartupItemProfileScreen
          item={current.item}
          onBack={pop}
          bottomInset={bottomInset}
        />
      )}
    </View>
  );
}
