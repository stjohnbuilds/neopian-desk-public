import { useRef, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { Button } from "./ui/button";
import { Modal } from "./Modal";

export function InfoHelp({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    // Restore after the dialog unmounts, when its opener is no longer inert.
    requestAnimationFrame(() => trigger.current?.focus());
  };
  return (
    <>
      <Button
        ref={trigger}
        variant="ghost"
        size="icon-xs"
        aria-label={title}
        title={title}
        onClick={() => setOpen(true)}
      >
        <Info size={16} />
      </Button>
      {open && (
        <Modal title={title} onClose={close}>
          <div className="help-content">{children}</div>
        </Modal>
      )}
    </>
  );
}
