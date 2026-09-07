import type { ComponentType, LazyExoticComponent } from 'react';

export function withLazy<T extends object>(
  LazyComponent: LazyExoticComponent<ComponentType<T>>,

) {
  return function WrappedComponent(props: T) {
    return (
      <LazyComponent {...props} />
    );
  };
}
