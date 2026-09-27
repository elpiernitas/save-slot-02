import { SPRITES, SPRITE_URLS } from '../../world/art/assets';
import type { CardArt, CardDefinition } from '../types';

const KIND_LABEL = {
  place: 'LUGAR',
  object: 'OBJETO',
  npc: 'PERSONAJE',
  event: 'EVENTO',
  system: 'SISTEMA',
};

const RARITY_LABEL = {
  common: 'COMÚN',
  uncommon: 'POCO COMÚN',
  rare: 'RARA',
  holo: 'HOLO',
  secret: 'SECRETA',
};

/** CSS for showing one rectangle of a sprite sheet, scaled to the element. */
function artStyle(art: CardArt) {
  const sheet = SPRITES[art.sprite];
  const url = SPRITE_URLS[art.sprite];
  if (!sheet || !url) return undefined;
  const px = (v: number, span: number) => (span > 0 ? (v / span) * 100 : 0);
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: `${(sheet.width / art.w) * 100}% ${(sheet.height / art.h) * 100}%`,
    backgroundPosition: `${px(art.x, sheet.width - art.w)}% ${px(art.y, sheet.height - art.h)}%`,
  };
}

interface CardFaceProps {
  card: CardDefinition;
  /** `small` for binder slots: number, art and name only. */
  size?: 'small' | 'large';
  isNew?: boolean;
}

/**
 * An original CITY CARD face (CITY_CARDS_BIBLE): navy/cream frame, kind
 * accent, catalogue number, illustration, name, one flavour line, rarity as
 * text. No stats, symbols or layout borrowed from other card games.
 */
export function CardFace({ card, size = 'large', isNew = false }: CardFaceProps) {
  const style = card.art ? artStyle(card.art) : undefined;
  return (
    <article
      className="city-card"
      data-size={size}
      data-kind={card.kind}
      data-rarity={card.rarity}
      aria-label={`City card ${card.number}: ${card.name}`}
    >
      <header className="city-card__head">
        <span className="city-card__number">#{card.number}</span>
        <span className="city-card__kind">{KIND_LABEL[card.kind]}</span>
      </header>
      <div className="city-card__art" style={style} data-placeholder={!style || undefined} />
      <p className="city-card__name">{card.name}</p>
      {size === 'large' && <p className="city-card__flavor">“{card.flavorText}”</p>}
      {size === 'large' && <p className="city-card__rarity">{RARITY_LABEL[card.rarity]}</p>}
      {isNew && <span className="city-card__new">NUEVA</span>}
    </article>
  );
}
