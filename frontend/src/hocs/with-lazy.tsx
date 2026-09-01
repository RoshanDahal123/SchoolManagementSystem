import type { ComponentType, LazyExoticComponent, ReactNode } from 'react';

export function withLazy<T extends object>(
  LazyComponent: LazyExoticComponent<ComponentType<T>>,
  fallback?: ReactNode,
) {
  return function WrappedComponent(props: T) {
    return (
      <LazyComponent {...props} />
    );
  };
}
