import { Button } from "./shared";

export function ScriptSwitch({
  label,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <Button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      focusableWhenDisabled
      variant="ghost"
      className="script-switch"
      onClick={() => onChange(!checked)}
    >
      <span className="script-switch-track" aria-hidden="true">
        <span />
      </span>
      <span aria-hidden="true">{checked ? "On" : "Off"}</span>
    </Button>
  );
}
