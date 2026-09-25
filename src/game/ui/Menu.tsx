import type { MenuItem } from './useMenu';

interface MenuProps {
  items: readonly MenuItem[];
  selected: number;
  onHover: (index: number) => void;
  onConfirm: (index: number) => void;
  label: string;
  className?: string;
}

/**
 * RPG menu view. Keyboard is handled globally by `useMenu`; buttons here are
 * for the mouse, so they never take DOM focus (tabIndex -1 + no mousedown
 * focus) — that keeps Enter from firing twice. The `>` cursor + color
 * inversion is the visible focus indicator.
 */
export function Menu({ items, selected, onHover, onConfirm, label, className }: MenuProps) {
  return (
    <ul
      className={['rpg-menu', className].filter(Boolean).join(' ')}
      role="menu"
      aria-label={label}
    >
      {items.map((item, index) => (
        <li key={item.id} role="none">
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            className="rpg-menu__item"
            data-selected={index === selected || undefined}
            aria-current={index === selected || undefined}
            aria-disabled={item.disabled || undefined}
            onMouseEnter={() => onHover(index)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onConfirm(index)}
          >
            <span className="rpg-menu__label">{item.label}</span>
            {item.value !== undefined && <span className="rpg-menu__value">{item.value}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
