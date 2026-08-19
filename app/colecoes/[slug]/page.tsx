import { ShowcasePage } from "../../../components/store/ShowcasePage";
import { collectionLabelFromSlug } from "../../../lib/collections";

export default async function DynamicCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const label = collectionLabelFromSlug(slug);
  return (
    <ShowcasePage
      collectionSlug={slug}
      collectionName={label}
      eyebrow={`Coleções · ${label}`}
      title={label}
      description={`Descubra todas as peças cadastradas na coleção ${label}.`}
    />
  );
}
