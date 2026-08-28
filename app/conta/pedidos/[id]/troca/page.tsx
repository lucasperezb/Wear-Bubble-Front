import { OrderReturnsPage } from "../../../../../components/account/OrderReturnsPage";

export default async function OrderReturnRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderReturnsPage orderId={id} />;
}
