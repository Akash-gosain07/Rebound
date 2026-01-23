import * as React from 'react';
import { PrimaryButton } from './PrimaryButton';

export type ButtonPrimaryProps = React.ComponentProps<typeof PrimaryButton>;

export function ButtonPrimary(props: ButtonPrimaryProps) {
  return <PrimaryButton {...props} />;
}
