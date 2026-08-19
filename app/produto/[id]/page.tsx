import { ProductDetailPage } from "../../../components/product/ProductDetailPage";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailPage productId={Number(id)} />;
}
