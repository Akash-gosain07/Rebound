import * as React from 'react';
import { ToggleTabs, type ToggleValue } from './ToggleTabs';

export interface LostFoundToggleProps {
  value: ToggleValue;
  onChange: (v: ToggleValue) => void;
  className?: string;
}

export function LostFoundToggle(props: LostFoundToggleProps) {
  return <ToggleTabs {...props} />;
}
