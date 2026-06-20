import type { ReactNode } from "react";

/** Width-constrained, centred, guttered box. Single source of horizontal
 *  alignment for the whole kit (max-width + gutter from tokens). */
export function Container({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "header" | "footer" | "section";
}) {
  return <Tag className={`fa-container ${className}`}>{children}</Tag>;
}
