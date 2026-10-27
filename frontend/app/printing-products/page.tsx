import type { Metadata } from "next";
import PrintingProductsCatalog from "./PrintingProductsCatalog";

export const metadata: Metadata = {
  title: "Printing Products | FBS Prints",
  description: "Explore our available printing products, designs and banner templates.",
  alternates: { canonical: "/printing-products" },
};

export default function PrintingProductsPage() {
  return <PrintingProductsCatalog />;
}
