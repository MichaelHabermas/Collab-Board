import type { ReactElement } from 'react';
import { Button } from '@/components/ui/button';

export const App = (): ReactElement => {
  return (
    <div
      data-testid='app-root'
      className='flex min-h-svh flex-col items-center justify-center gap-4 p-4'
    >
      <h1 className='text-lg font-semibold text-foreground'>AI React Starter</h1>
      <Button data-testid='shadcn-button-example'>Click me</Button>
    </div>
  );
};
