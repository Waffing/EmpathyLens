import { createContext, useContext, useReducer } from 'react';
import type { Dispatch, ReactNode } from 'react';
import type { AppAction, AppState } from './types';
import { appReducer, initialState } from './reducer';

const StateContext = createContext<AppState | null>(null);
const DispatchContext = createContext<Dispatch<AppAction> | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <StateContext value={state}>
      <DispatchContext value={dispatch}>{children}</DispatchContext>
    </StateContext>
  );
}

export function useAppState() {
  const state = useContext(StateContext);
  if (!state) throw new Error('AppStateProvider is required');
  return state;
}

export function useAppDispatch() {
  const dispatch = useContext(DispatchContext);
  if (!dispatch) throw new Error('AppStateProvider is required');
  return dispatch;
}
