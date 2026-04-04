import React, { useState } from 'react';
import { View } from 'react-native';
import ActHubScreen from './ActHubScreen';
import ActListScreen from './ActListScreen';
import ActProfileScreen from './ActProfileScreen';

type Screen =
  | { name: 'hub' }
  | { name: 'list'; title: string; catId: string }
  | { name: 'profile'; activityId: string };

interface Props {
  onExit: () => void;
  bottomInset: number;
  initialActivityId?: string;
}

export default function ActNavigator({ onExit, bottomInset, initialActivityId }: Props) {
  const [stack, setStack] = useState<Screen[]>([
    initialActivityId ? { name: 'profile', activityId: initialActivityId } : { name: 'hub' },
  ]);

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
        <ActHubScreen
          onBack={onExit}
          onList={(title, catId) => push({ name: 'list', title, catId })}
          onProfile={(activityId) => push({ name: 'profile', activityId })}
          bottomInset={bottomInset}
        />
      )}
      {current.name === 'list' && (
        <ActListScreen
          title={current.title}
          initialCatId={current.catId}
          onBack={pop}
          onProfile={(activityId) => push({ name: 'profile', activityId })}
          bottomInset={bottomInset}
        />
      )}
      {current.name === 'profile' && (
        <ActProfileScreen
          activityId={current.activityId}
          onBack={pop}
          bottomInset={bottomInset}
        />
      )}
    </View>
  );
}
