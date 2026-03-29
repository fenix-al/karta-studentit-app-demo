import React, { useState } from 'react';
import { Business } from '../../types';
import OffersHubScreen from './OffersHubScreen';
import OffersListScreen from './OffersListScreen';
import BusinessProfileScreen from './BusinessProfileScreen';

type Screen =
  | { name: 'hub' }
  | { name: 'list'; title: string; catSlug?: string }
  | { name: 'profile'; business: Business };

interface Props {
  onExit:            () => void;
  bottomInset:       number;
  initialList?:      string;    // open directly on the list screen
  initialBusiness?:  Business;  // open directly on the profile screen
}

export default function OffersNavigator({ onExit, bottomInset, initialList, initialBusiness }: Props) {
  const [stack, setStack] = useState<Screen[]>(
    initialBusiness
      ? [{ name: 'hub' }, { name: 'profile', business: initialBusiness }]
      : initialList
        ? [{ name: 'hub' }, { name: 'list', title: initialList }]
        : [{ name: 'hub' }]
  );
  const current = stack[stack.length - 1];

  const push = (screen: Screen) => setStack(prev => [...prev, screen]);
  const pop  = () => {
    if (stack.length <= 1) onExit();
    else setStack(prev => prev.slice(0, -1));
  };

  if (current.name === 'hub') return (
    <OffersHubScreen
      onBack={onExit}
      onList={(title, catSlug) => push({ name: 'list', title, catSlug })}
      onProfile={biz => push({ name: 'profile', business: biz })}
      bottomInset={bottomInset}
    />
  );

  if (current.name === 'list') return (
    <OffersListScreen
      title={current.title}
      catSlug={current.catSlug}
      onBack={pop}
      onProfile={biz => push({ name: 'profile', business: biz })}
      bottomInset={bottomInset}
    />
  );

  if (current.name === 'profile') return (
    <BusinessProfileScreen
      business={current.business}
      onBack={pop}
      bottomInset={bottomInset}
    />
  );

  return null;
}
