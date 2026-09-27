import type { GameInput } from './keymap';

export interface InputMeta {
  /** True for auto-repeat while a key is held. */
  repeat: boolean;
}

export type InputHandler = (input: GameInput, meta: InputMeta) => void;

/** Conventional priorities. Higher wins; ties go to the most recently added. */
export const INPUT_PRIORITY = {
  /** Exploration: below everything, so any dialogue or menu on top owns input. */
  world: -10,
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
const DIRECTIONS: readonly GameInput[] = ['up', 'down', 'left', 'right'];

export class InputRouter {
  private layers: Layer[] = [];
  private nextOrder = 0;
  /** Directions currently held, oldest first (for continuous movement). */
  private held: GameInput[] = [];

  add(handler: InputHandler, priority: number = INPUT_PRIORITY.scene): () => void {
    const layer: Layer = { priority, order: this.nextOrder++, handler };
    this.layers.push(layer);
    return () => {
      this.layers = this.layers.filter((l) => l !== layer);
    };
  }

  private top(): Layer | undefined {
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
    return top;
  }

  /** Returns true when some layer received the input (caller should preventDefault). */
  dispatch(input: GameInput, meta: InputMeta): boolean {
    const top = this.top();
    if (!top) return false;
    top.handler(input, meta);
    return true;
  }

  /** True when `handler` belongs to the layer that currently owns input. */
  isTop(handler: InputHandler): boolean {
    return this.top()?.handler === handler;
  }

  // ---- Held directions (keydown/keyup), used by continuous movement ------

  press(input: GameInput): void {
    if (!DIRECTIONS.includes(input)) return;
    this.held = [...this.held.filter((d) => d !== input), input];
  }

  release(input: GameInput): void {
    this.held = this.held.filter((d) => d !== input);
  }

  /** Window lost focus: keyups will never arrive, forget everything. */
  releaseAll(): void {
    this.held = [];
  }

  /** The most recently pressed direction still held (4-direction movement). */
  heldDirection(): 'up' | 'down' | 'left' | 'right' | null {
    return (
      (this.held[this.held.length - 1] as 'up' | 'down' | 'left' | 'right' | undefined) ?? null
    );
  }

  get size(): number {
    return this.layers.length;
  }
}
