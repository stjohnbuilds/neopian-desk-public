import {
  Sword,
  Coins,
  Cat,
  Star,
  Heart,
  BookOpen,
  Link as LinkIcon,
  Gift,
  Trophy,
  Store,
  Clock,
  Bell,
  CalendarDays,
  Gem,
  Flower2,
  Sparkles,
  Shield,
  Map,
  Music,
  Coffee,
  Flame,
  Snowflake,
  Fish,
  PawPrint,
} from "lucide-react";
import { shortcutIcons, type ShortcutIcon } from "../core/shortcuts";
export const shortcutGlyphs = {
  sword: Sword,
  coins: Coins,
  cat: Cat,
  star: Star,
  heart: Heart,
  book: BookOpen,
  link: LinkIcon,
  gift: Gift,
  trophy: Trophy,
  shop: Store,
  clock: Clock,
  bell: Bell,
  calendar: CalendarDays,
  gem: Gem,
  flower: Flower2,
  sparkles: Sparkles,
  shield: Shield,
  map: Map,
  music: Music,
  coffee: Coffee,
  flame: Flame,
  snowflake: Snowflake,
  fish: Fish,
  paw: PawPrint,
};
export function IconPicker({
  value,
  onChange,
}: {
  value: ShortcutIcon;
  onChange: (icon: ShortcutIcon) => void;
}) {
  return (
    <div className="icon-choices" role="group" aria-label="Shortcut icon">
      {shortcutIcons.map((key) => {
        const Icon = shortcutGlyphs[key];
        return (
          <button
            type="button"
            className="quick-link"
            aria-label={key}
            title={key}
            aria-pressed={value === key}
            key={key}
            onClick={() => onChange(key)}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </div>
  );
}
