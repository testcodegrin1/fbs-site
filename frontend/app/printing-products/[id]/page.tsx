import type { Metadata } from "next";
import PrintingProductDetail from "./PrintingProductDetail";

export const metadata: Metadata = {
  title: "Printing Product Details | FBS Prints",
  description: "View printing product details and submit your customization requirements.",
};

export default async function PrintingProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PrintingProductDetail productId={id} />;
}
