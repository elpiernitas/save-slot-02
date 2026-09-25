import { PixelSprite } from '../../ui/PixelSprite';
import { composePortrait, type PortraitDefinition } from '../portraits';

export function Portrait({
  def,
  expression,
  className,
}: {
  def: PortraitDefinition;
  expression?: string | undefined;
  className?: string;
}) {
  return (
    <PixelSprite
      className={className}
      rows={composePortrait(def, expression)}
      palette={def.palette}
    />
  );
}
