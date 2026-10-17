import { Star } from "lucide-react";
import { Button } from "./shared";

export type AvatarFavoriteControl = {
  ids: string[];
  busy: boolean;
  toggle: (id: string, name: string, checked: boolean) => void;
};
export function AvatarFavoriteButton({
  id,
  name,
  control,
}: {
  id: string;
  name: string;
  control: AvatarFavoriteControl;
}) {
  const checked = control.ids.includes(id);
  return (
    <Button
      id={`avatar-favorite-${id}`}
      variant="ghost"
      size="icon"
      className="avatar-favorite-button"
      aria-label={`Favourite ${name}`}
      aria-pressed={checked}
      title={
        checked ? `Remove ${name} from favourites` : `Add ${name} to favourites`
      }
      disabled={control.busy}
      onClick={() => control.toggle(id, name, !checked)}
    >
      <Star aria-hidden="true" fill={checked ? "currentColor" : "none"} />
    </Button>
  );
}
