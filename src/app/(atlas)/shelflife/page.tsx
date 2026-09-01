import type { Metadata } from "next";
import { Store } from "./Store";

export const metadata: Metadata = {
  title: "ShelfLife. Futures Atlas",
  description:
    "A mocked-up online store stocked with products that do not exist yet — and the configurator that writes the prompts to make the next one.",
};

/**
 * ShelfLife — draft project (gated by projects.ts visibility). The page is a
 * storefront in the manner of apple.com/store: what is new, the aisles, the
 * promises, the full shelf — and the "Create a product" call, which opens the
 * prompt configurator in a lightbox. See src/data/shelflife.ts for the
 * prompt assembly and the stock itself; Store.tsx for the shop.
 */
export default function ShelfLifePage() {
  return <Store />;
}
