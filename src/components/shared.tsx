import { useRef, useState, type ReactNode } from "react";
import { Check, Copy, ExternalLink, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { copyText } from "../core/bridge";
import { safeURL } from "../core/utils";
export { Button };
export function CopyButton({
  text,
  label = "Copy name",
  visibleLabel,
}: {
  text: string;
  label?: string;
  visibleLabel?: string;
}) {
  const [copied, setCopied] = useState(false),
    [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <span className={visibleLabel ? "copy-action" : "copy-control"}>
      <Button
        variant={visibleLabel ? "outline" : "ghost"}
        size={visibleLabel ? "sm" : "icon-xs"}
        aria-label={copied ? "Copied" : label}
        title={error || label}
        onClick={async () => {
          try {
            await copyText(text);
            setCopied(true);
            setError("");
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 1500);
          } catch (e) {
            setError(String(e));
          }
        }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {visibleLabel && (copied ? "Copied" : visibleLabel)}
      </Button>
      {error && (
        <span role="alert" className="error">
          Copy failed
        </span>
      )}
    </span>
  );
}
export function Link({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const safe = safeURL(href);
  return safe ? (
    <a
      className={`external ${className}`}
      href={safe}
      target="_blank"
      rel="noreferrer"
    >
      {children}
      <ExternalLink size={13} />
    </a>
  ) : (
    <span>{children}</span>
  );
}
export function Panel({
  title,
  children,
  actions,
  collapsible = false,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  if (collapsible)
    return (
      <details className="panel collapsible-panel" open={defaultOpen}>
        <summary className="panel-heading">
          <h2>{title}</h2>
          <ChevronDown size={16} />
        </summary>
        <div className="panel-content">
          {actions && <div className="panel-note actions">{actions}</div>}
          {children}
        </div>
      </details>
    );
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
export function Disclosure({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="disclosure" open={defaultOpen}>
      <summary>
        {title}
        <ChevronDown size={16} />
      </summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}
export function PageTitle({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions}
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}
export function Feedback({ message }: { message: string }) {
  return message ? (
    <div role="status" aria-live="polite" className="feedback">
      {message}
    </div>
  ) : null;
}
export function useAction() {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const running = useRef(false);
  const run = async (action: () => Promise<void>, success?: string) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      await action();
      if (success) setMessage(success);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { message, setMessage, busy, run };
}
