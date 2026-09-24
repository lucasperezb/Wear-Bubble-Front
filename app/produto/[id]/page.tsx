import { ProductDetailPage } from "../../../components/product/ProductDetailPage";
import { parseProductParam } from "../../../lib/product-url";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailPage productId={parseProductParam(id)} />;
}
