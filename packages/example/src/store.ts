/**
 * Redux store for the example application.
 *
 * State shape: { counter: { value: number } }
 */
import { createStore, combineReducers } from 'redux';

// ---------------------------------------------------------------------------
// Counter slice
// ---------------------------------------------------------------------------

export interface CounterState {
  value: number;
}

export type CounterAction =
  | { type: 'counter/increment' }
  | { type: 'counter/decrement' }
  | { type: 'counter/reset' };

function counterReducer(
  state: CounterState = { value: 0 },
  action: CounterAction,
): CounterState {
  switch (action.type) {
    case 'counter/increment': return { value: state.value + 1 };
    case 'counter/decrement': return { value: state.value - 1 };
    case 'counter/reset':     return { value: 0 };
    default:                  return state;
  }
}

// ---------------------------------------------------------------------------
// Root reducer & store
// ---------------------------------------------------------------------------

const rootReducer = combineReducers({ counter: counterReducer });

export type RootState = ReturnType<typeof rootReducer>;

export const store = createStore(rootReducer);

export const getStore = () => store;
