import { intersects } from './geometry';
import { TILE_SIZE, type Rect, type WorldMap } from './types';

/**
 * Solid geometry of a map: tile grid + extra rectangles + map borders.
 * Built once per map; queries are pure.
 */
export interface CollisionWorld {
  width: number;
  height: number;
  isBlocked(rect: Rect): boolean;
}

export function buildCollisionWorld(map: WorldMap): CollisionWorld {
  const width = map.widthTiles * TILE_SIZE;
  const height = map.heightTiles * TILE_SIZE;
  const solid = new Set(map.solidTiles);

  const tileSolid = (tx: number, ty: number) => {
    const row = map.tiles[ty];
    return row === undefined || tx < 0 || tx >= row.length ? true : solid.has(row[tx]!);
  };

  return {
    width,
    height,
    isBlocked(rect) {
      if (rect.x < 0 || rect.y < 0 || rect.x + rect.w > width || rect.y + rect.h > height) {
        return true;
      }
      const x0 = Math.floor(rect.x / TILE_SIZE);
      const y0 = Math.floor(rect.y / TILE_SIZE);
      const x1 = Math.floor((rect.x + rect.w - 0.001) / TILE_SIZE);
      const y1 = Math.floor((rect.y + rect.h - 0.001) / TILE_SIZE);
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) if (tileSolid(tx, ty)) return true;
      }
      return map.colliders.some((c) => intersects(rect, c));
    },
  };
}
