import { describe, expect, it, vi } from 'vitest';
import { snapshotRiotProps, updateRiotInstance } from '../src/lifecycle.js';
import type { RiotInstance } from '../src/types.js';

interface SnapshotProps {
  count: number;
  nested: { value: number };
  items: Array<{ label: string }>;
}

describe('snapshotRiotProps', () => {
  it('creates a frozen deep snapshot for plain objects and arrays', () => {
    const props: SnapshotProps = {
      count: 1,
      nested: { value: 2 },
      items: [{ label: 'first' }],
    };

    const snapshot = snapshotRiotProps(props);

    expect(snapshot).toEqual(props);
    expect(snapshot).not.toBe(props);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.nested)).toBe(true);
    expect(Object.isFrozen(snapshot.items)).toBe(true);
    expect(Object.isFrozen(snapshot.items[0])).toBe(true);

    props.count = 10;
    props.nested.value = 20;
    props.items[0].label = 'changed';

    expect(snapshot).toEqual({
      count: 1,
      nested: { value: 2 },
      items: [{ label: 'first' }],
    });
  });

  it('reuses the same snapshot when the root props reference is stable', () => {
    const props: SnapshotProps = {
      count: 1,
      nested: { value: 2 },
      items: [{ label: 'first' }],
    };

    const firstSnapshot = snapshotRiotProps(props);
    const secondSnapshot = snapshotRiotProps(props);

    expect(secondSnapshot).toBe(firstSnapshot);
  });

  it('preserves opaque references such as functions and class instances', () => {
    const handler = vi.fn();
    const createdAt = new Date('2024-01-01T00:00:00.000Z');

    const snapshot = snapshotRiotProps({ handler, createdAt });

    expect(snapshot.handler).toBe(handler);
    expect(snapshot.createdAt).toBe(createdAt);
  });
});

describe('updateRiotInstance', () => {
  it('replaces instance.props with an immutable snapshot before updating', () => {
    const sourceProps = {
      nested: { value: 1 },
    };
    const update = vi.fn();
    const unmount = vi.fn();
    const instance: RiotInstance<typeof sourceProps> & {
      props: typeof sourceProps;
    } = {
      props: sourceProps,
      update,
      unmount,
    };

    updateRiotInstance(instance, sourceProps);

    sourceProps.nested.value = 2;

    expect(update).toHaveBeenCalledTimes(1);
    expect(instance.props).toEqual({ nested: { value: 1 } });
    expect(instance.props).not.toBe(sourceProps);
    expect(Object.isFrozen(instance.props)).toBe(true);
    expect(Object.isFrozen(instance.props.nested)).toBe(true);
  });

  it('skips redefining props when the same root props object is applied again', () => {
    const sourceProps = { value: 1 };
    const update = vi.fn();
    const unmount = vi.fn();
    const instance: RiotInstance<typeof sourceProps> & {
      props: typeof sourceProps;
    } = {
      props: sourceProps,
      update,
      unmount,
    };

    updateRiotInstance(instance, sourceProps);
    const firstSnapshot = instance.props;

    updateRiotInstance(instance, sourceProps);

    expect(instance.props).toBe(firstSnapshot);
    expect(update).toHaveBeenCalledTimes(1);
  });
});