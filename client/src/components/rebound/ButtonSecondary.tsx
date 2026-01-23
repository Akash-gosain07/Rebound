import * as React from 'react';
import { SecondaryButton } from './SecondaryButton';

export type ButtonSecondaryProps = React.ComponentProps<typeof SecondaryButton>;

export function ButtonSecondary(props: ButtonSecondaryProps) {
  return <SecondaryButton {...props} />;
}
