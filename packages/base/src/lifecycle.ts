import { RiotInstance } from "./types";

export function updateRiotInstance(
  instance: RiotInstance,
  newProps: Record<string, unknown>,
  safeMode = false,
) {
  try {
    Object.defineProperty(instance, 'props', { value: newProps, writable: false, enumerable: false, configurable: true });
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