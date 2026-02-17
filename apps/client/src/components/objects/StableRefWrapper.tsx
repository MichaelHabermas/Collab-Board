import type { ReactElement, ReactNode } from 'react';
import { Children, cloneElement, useCallback } from 'react';

interface IStableRefWrapperProps {
  id: string;
  registerNodeRef?: (id: string, node: unknown) => void;
  children: ReactNode;
}

/**
 * Provides a stable ref callback so React only invokes it on real mount/unmount.
 * Prevents infinite loop when parent re-renders and would otherwise pass a new ref each time.
 */
export const StableRefWrapper = ({
  id,
  registerNodeRef,
  children,
}: IStableRefWrapperProps): ReactElement => {
  const refCb = useCallback(
    (node: unknown) => {
      if (registerNodeRef) {
        registerNodeRef(id, node);
      }
    },
    [id, registerNodeRef]
  );
  const child = Children.only(children) as ReactElement<{ registerRef?: (node: unknown) => void }>;
  return cloneElement(child, { registerRef: registerNodeRef ? refCb : undefined });
};
