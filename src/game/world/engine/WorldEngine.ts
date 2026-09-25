import { cameraFor } from '../camera';
import { buildCollisionWorld, type CollisionWorld } from '../collision';
import { findInteraction, zoneAt } from '../interaction';
import { stepMovement } from '../movement';
import type { Facing, Interactable, Spawn, Vec2, WorldMap, Zone } from '../types';

/** Continuous input as seen by the world (implemented by the InputRouter bridge). */
export interface WorldInput {
  heldDirection(): Facing | null;
  /** False while another layer (dialogue, menu, transition, gate) owns input. */
  isActive(): boolean;
}

export interface FrameScheduler {
  request(callback: (timeMs: number) => void): number;
  cancel(id: number): void;
}

export interface WorldSnapshot {
  pos: Vec2;
  facing: Facing;
  moving: boolean;
  /** 0 idle, 1/2 alternating steps. */
  walkFrame: 0 | 1 | 2;
  camera: Vec2;
  timeMs: number;
  target: Interactable | null;
}

export interface WorldEngineOptions {
  map: WorldMap;
  spawn: Spawn;
  view: { w: number; h: number };
  input: WorldInput;
  scheduler: FrameScheduler;
  onRender?: (snapshot: WorldSnapshot) => void;
  onTargetChange?: (target: Interactable | null) => void;
  onZoneEnter?: (zone: Zone) => void;
}

/** Walked distance (px) per step frame in the walk cycle. */
const STEP_PX = 7;

/**
 * The exploration subsystem. Owns only ephemeral state (position, facing,
 * animation). Everything persistent stays in React's GameSave: the engine
 * reports zone changes and interactions through callbacks and never touches
 * the save, dialogue or UI itself.
 */
export class WorldEngine {
  private readonly collision: CollisionWorld;
  private pos: Vec2;
  private facing: Facing;
  private moving = false;
  private walked = 0;
  private frameId: number | null = null;
  private lastTime: number | null = null;
  private paused = false;
  private resumeAt = 0;
  private target: Interactable | null = null;
  private zoneId: string | null;
  private destroyed = false;
  private timeMs = 0;

  constructor(private readonly options: WorldEngineOptions) {
    this.collision = buildCollisionWorld(options.map);
    this.pos = { x: options.spawn.x, y: options.spawn.y };
    this.facing = options.spawn.facing;
    // The spawn zone is already "entered": no checkpoint event on load.
    this.zoneId = zoneAt(this.pos, options.map.zones)?.id ?? null;
  }

  start(): void {
    if (this.destroyed || this.frameId !== null) return;
    const loop = (time: number) => {
      this.frameId = null;
      this.step(time);
      if (!this.destroyed) this.frameId = this.options.scheduler.request(loop);
    };
    this.frameId = this.options.scheduler.request(loop);
  }

  stop(): void {
    if (this.frameId !== null) this.options.scheduler.cancel(this.frameId);
    this.frameId = null;
    this.lastTime = null;
  }

  /** Stops the loop for good; the engine cannot be restarted. */
  destroy(): void {
    this.stop();
    this.destroyed = true;
  }

  get isRunning(): boolean {
    return this.frameId !== null;
  }

  /**
   * Freezes movement (dialogue, pause menu). When resuming, a short cooldown
   * stops the key that closed the dialogue from re-opening it straight away.
   */
  setPaused(paused: boolean, nowMs = this.timeMs, cooldownMs = 0): void {
    this.paused = paused;
    this.moving = false;
    if (!paused) this.resumeAt = nowMs + cooldownMs;
  }

  /** Called on confirm. Returns what the player faces, or null. */
  tryInteract(nowMs = this.timeMs): Interactable | null {
    if (this.paused || nowMs < this.resumeAt) return null;
    return this.target;
  }

  snapshot(): WorldSnapshot {
    const { view } = this.options;
    return {
      pos: { ...this.pos },
      facing: this.facing,
      moving: this.moving,
      walkFrame: this.moving ? (((Math.floor(this.walked / STEP_PX) % 2) + 1) as 1 | 2) : 0,
      camera: cameraFor(this.pos, view, this.collision),
      timeMs: this.timeMs,
      target: this.target,
    };
  }

  /** One simulation + render step (public for tests). */
  step(timeMs: number): void {
    const dt = this.lastTime === null ? 0 : timeMs - this.lastTime;
    this.lastTime = timeMs;
    this.timeMs = timeMs;
    const { map, input } = this.options;

    const direction = !this.paused && input.isActive() ? input.heldDirection() : null;
    const result = stepMovement(this.pos, this.facing, direction, dt, this.collision);
    const dx = Math.abs(result.pos.x - this.pos.x) + Math.abs(result.pos.y - this.pos.y);
    this.pos = result.pos;
    this.facing = result.facing;
    this.moving = result.moving;
    this.walked = this.moving ? this.walked + dx : 0;

    const zone = zoneAt(this.pos, map.zones);
    if (zone && zone.id !== this.zoneId) this.options.onZoneEnter?.(zone);
    this.zoneId = zone?.id ?? this.zoneId;

    const target = this.paused ? null : findInteraction(this.pos, this.facing, map.interactables);
    if (target?.id !== this.target?.id) {
      this.target = target;
      this.options.onTargetChange?.(target);
    }

    this.options.onRender?.(this.snapshot());
  }
}
