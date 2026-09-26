import { INPUT_PRIORITY } from '../../input/inputRouter';
import { useGame } from '../../state/useGame';
import { Menu } from '../../ui/Menu';
import { useMenu } from '../../ui/useMenu';
import { inventoryRows } from '../cards';
import './inventory.css';

const CATEGORY_LABEL = { quest: 'QUEST', object: 'OBJECT', consumable: 'CONSUMABLE', key: 'KEY' };

/**
 * INVENTARIO (GAME_05_SPEC §12): item list on the left, detail on the right.
 * Items are inspected here; using them happens in the world, so no USE button.
 */
export function InventoryPanel({ onBack }: { onBack: () => void }) {
  const { save } = useGame();
  const rows = inventoryRows(save);
  const items = rows.map((row) => ({
    id: row.item.id,
    label: row.item.name,
    ...(row.quantity > 1 && { value: `×${row.quantity}` }),
  }));
  const menu = useMenu({
    items,
    priority: INPUT_PRIORITY.panel,
    onConfirm: () => {},
    onCancel: onBack,
  });
  const selected = rows[menu.selected];
  return (
    <div className="inv-layer">
      <section className="rpg-box inv-panel" role="dialog" aria-label="Inventario">
        <p className="inv-panel__title">INVENTARIO</p>
        {rows.length === 0 ? (
          <p className="inv-empty">NO ITEMS YET. The city will hand you things. Eventually.</p>
        ) : (
          <div className="inv-panel__body">
            <Menu
              label="Objetos"
              items={items}
              selected={menu.selected}
              onHover={menu.select}
              onConfirm={menu.select}
              className="inv-list"
            />
            {selected && (
              <div className="inv-detail">
                <p className="inv-item__name">{selected.item.name}</p>
                <p className="inv-item__category">{CATEGORY_LABEL[selected.item.category]}</p>
                <p className="inv-item__desc">{selected.item.description}</p>
              </div>
            )}
          </div>
        )}
        <p className="inv-hint">
          <kbd>ESC</kbd> BACK
        </p>
      </section>
    </div>
  );
}
