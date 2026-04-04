import React, { useState } from 'react';
import { View } from 'react-native';
import CoursesHubScreen from './CoursesHubScreen';
import CoursesListScreen from './CoursesListScreen';
import CourseProfileScreen from './CourseProfileScreen';
import { CourseItem } from '../../types';

type Screen =
  | { name: 'hub' }
  | { name: 'list'; title: string; categorySlug?: string }
  | { name: 'profile'; course: CourseItem };

interface Props {
  onExit:      () => void;
  bottomInset: number;
  initialList?: string;
  initialCourse?: CourseItem;
}

export default function CoursesNavigator({ onExit, bottomInset, initialList, initialCourse }: Props) {
  const [stack, setStack] = useState<Screen[]>(
    initialCourse
      ? [{ name: 'hub' }, { name: 'profile', course: initialCourse }]
      : initialList
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
        <CoursesHubScreen
          onBack={onExit}
          onList={(title, categorySlug)  => push({ name: 'list', title, categorySlug })}
          onProfile={course => push({ name: 'profile', course })}
          bottomInset={bottomInset}
        />
      )}
      {current.name === 'list' && (
        <CoursesListScreen
          title={current.title}
          categorySlug={current.categorySlug}
          onBack={pop}
          onProfile={course => push({ name: 'profile', course })}
          bottomInset={bottomInset}
        />
      )}
      {current.name === 'profile' && (
        <CourseProfileScreen
          course={current.course}
          onBack={pop}
          bottomInset={bottomInset}
        />
      )}
    </View>
  );
}
