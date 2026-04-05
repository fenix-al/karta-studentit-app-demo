import React, { useState } from 'react';
import { View } from 'react-native';
import OpportunitiesHubScreen from './OpportunitiesHubScreen';
import OpportunitiesListScreen from './OpportunitiesListScreen';
import JobProfileScreen from './JobProfileScreen';
import { JobItem } from '../../types';

type Screen =
  | { name: 'hub' }
  | { name: 'list'; title: string; typeSlug?: string }
  | { name: 'profile'; job: JobItem };

interface Props {
  onExit:      () => void;
  bottomInset: number;
  initialList?: string;
  initialTypeSlug?: string;
  initialJob?: JobItem;
}

export default function OpportunitiesNavigator({ onExit, bottomInset, initialList, initialTypeSlug, initialJob }: Props) {
  const [stack, setStack] = useState<Screen[]>(
    initialJob
      ? [{ name: 'profile', job: initialJob }]
      : initialList
      ? [{ name: 'list', title: initialList, typeSlug: initialTypeSlug }]
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
        <OpportunitiesHubScreen
          onBack={onExit}
          onList={(title, typeSlug) => push({ name: 'list', title, typeSlug })}
          onProfile={job  => push({ name: 'profile', job })}
          bottomInset={bottomInset}
        />
      )}
      {current.name === 'list' && (
        <OpportunitiesListScreen
          title={current.title}
          typeSlug={current.typeSlug}
          onBack={pop}
          onProfile={job => push({ name: 'profile', job })}
          bottomInset={bottomInset}
        />
      )}
      {current.name === 'profile' && (
        <JobProfileScreen
          job={current.job}
          onBack={pop}
          bottomInset={bottomInset}
        />
      )}
    </View>
  );
}
