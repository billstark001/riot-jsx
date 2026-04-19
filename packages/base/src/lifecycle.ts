import { RiotInstance } from './types';

const propsSnapshotCache = new WeakMap<object, object>();

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function snapshotRiotValue(
  value: unknown,
  seen: WeakMap<object, unknown>,
): unknown {
  if (Array.isArray(value)) {
    const cached = seen.get(value);
    if (cached) {
      return cached;
    }

    const snapshot: unknown[] = [];
    seen.set(value, snapshot);

    for (let index = 0; index < value.length; index++) {
      if (index in value) {
        snapshot[index] = snapshotRiotValue(value[index], seen);
      }
    }

    return Object.freeze(snapshot);
  }

  if (isPlainObject(value)) {
    const cached = seen.get(value);
    if (cached) {
      return cached;
    }

    const snapshot: Record<string, unknown> = {};
    seen.set(value, snapshot);

    for (const [key, nestedValue] of Object.entries(value)) {
      snapshot[key] = snapshotRiotValue(nestedValue, seen);
    }

    return Object.freeze(snapshot);
  }

  return value;
}

/**
 * Create an immutable snapshot of Riot root props.
 *
 * Plain objects and arrays are cloned recursively so external mutation after
 * mount/update cannot leak into the mounted Riot instance. Opaque values such
 * as functions, class instances, DOM nodes, Maps, Sets and Dates are preserved
 * by reference.
 */
export function snapshotRiotProps<Props extends object>(
  props: Props,
): Props {
  const cached = propsSnapshotCache.get(props);

  if (cached) {
    return cached as Props;
  }

  const snapshot = snapshotRiotValue(
    props as Record<string, unknown>,
    new WeakMap(),
  ) as Props;
  propsSnapshotCache.set(props, snapshot);
  return snapshot;
}

export function updateRiotInstance<Props extends object>(
  instance: RiotInstance<Props>,
  newProps: Props,
  safeMode = false,
): RiotInstance<Props> {
  try {
    const propsSnapshot = snapshotRiotProps(newProps);

    if (instance.props === propsSnapshot) {
      return instance;
    }

    Object.defineProperty(instance, 'props', {
      value: propsSnapshot,
      writable: false,
      enumerable: false,
      configurable: true,
    });
    instance.update();
  } catch (error) {
    if (safeMode) {
      console.warn('Failed to update Riot instance with new props:', error);
    } else {
      throw error;
    }
  }
  return instance;
}