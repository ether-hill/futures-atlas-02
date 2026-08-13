import type { ReactNode } from "react";

/** Token-styled button. Renders an <a> when `href` is set, else a <button>. */
export function Button({
  children,
  href,
  variant = "primary",
  onClick,
  type = "button",
  className = "",
  target,
}: {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "ghost";
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  target?: string;
}) {
  const cls = `fa-btn fa-btn--${variant} ${className}`;
  if (href) {
    return (
      <a href={href} className={cls} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick}>
      {children}
    </button>
  );
}
