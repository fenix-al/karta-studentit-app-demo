import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import KVRHubScreen from './KVRHubScreen';
import KVRListScreen from './KVRListScreen';
import KVRProfileScreen from './KVRProfileScreen';

type Screen =
  | { name: 'hub' }
  | { name: 'list'; title: string; catId: string }
  | { name: 'profile'; activityId: string };

interface Props {
  onExit: () => void;
  bottomInset: number;
  initialList?: { title: string; catId: string };
  initialActivityId?: string;
}

export default function KVRNavigator({ onExit, bottomInset, initialList, initialActivityId }: Props) {
  const [stack, setStack] = useState<Screen[]>([{ name: 'hub' }]);

  useEffect(() => {
    if (initialActivityId) {
      setStack([{ name: 'hub' }, { name: 'profile', activityId: initialActivityId }]);
      return;
    }

    if (initialList) {
      setStack([{ name: 'hub' }, { name: 'list', title: initialList.title, catId: initialList.catId }]);
      return;
    }

    setStack([{ name: 'hub' }]);
  }, [initialActivityId, initialList]);

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
        <KVRHubScreen
          onBack={onExit}
          onList={(title, catId) => push({ name: 'list', title, catId })}
          onProfile={(activityId) => push({ name: 'profile', activityId })}
          bottomInset={bottomInset}
        />
      )}
      {current.name === 'list' && (
        <KVRListScreen
          title={current.title}
          initialCatId={current.catId}
          onBack={pop}
          onProfile={(activityId) => push({ name: 'profile', activityId })}
          bottomInset={bottomInset}
        />
      )}
      {current.name === 'profile' && (
        <KVRProfileScreen
          activityId={current.activityId}
          onBack={pop}
          bottomInset={bottomInset}
        />
      )}
    </View>
  );
}
