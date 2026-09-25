import { createContext } from 'react';
import type { InputRouter } from './inputRouter';

export const InputContext = createContext<InputRouter | null>(null);
