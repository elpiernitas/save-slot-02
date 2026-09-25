import type { GameInput } from './keymap';

export interface InputMeta {
  /** True for auto-repeat while a key is held. */
  repeat: boolean;
}

export type InputHandler = (input: GameInput, meta: InputMeta) => void;

/** Conventional priorities. Higher wins; ties go to the most recently added. */
export const INPUT_PRIORITY = {
  scene: 0,
  panel: 10,
  /** Transitions, display gate: swallow everything. */
  blocker: 1000,
} as const;

interface Layer {
  priority: number;
  order: number;
  handler: InputHandler;
}

/**
 * Modal input routing: only the top layer receives input. A scene registers
 * a layer; a settings panel on top registers a higher one; a transition adds
 * a blocker that swallows everything. No component adds its own listener.
 */
export class InputRouter {
  private layers: Layer[] = [];
  private nextOrder = 0;

  add(handler: InputHandler, priority: number = INPUT_PRIORITY.scene): () => void {
    const layer: Layer = { priority, order: this.nextOrder++, handler };
    this.layers.push(layer);
    return () => {
      this.layers = this.layers.filter((l) => l !== layer);
    };
  }

  /** Returns true when some layer received the input (caller should preventDefault). */
  dispatch(input: GameInput, meta: InputMeta): boolean {
    let top: Layer | undefined;
    for (const layer of this.layers) {
      if (
        !top ||
        layer.priority > top.priority ||
        (layer.priority === top.priority && layer.order > top.order)
      ) {
        top = layer;
      }
    }
    if (!top) return false;
    top.handler(input, meta);
    return true;
  }

  get size(): number {
    return this.layers.length;
  }
}
