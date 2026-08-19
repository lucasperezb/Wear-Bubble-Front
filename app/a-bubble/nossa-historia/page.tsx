import { EditorialPage } from "../../../components/store/EditorialPage";

export default function StoryPage() {
  return <EditorialPage eyebrow="A Bubble · Nossa história" title="Feita para quem não para" lead="A Bubble nasceu para mostrar que nenhuma mulher precisa escolher entre conforto, qualidade e estilo." items={[
    { number: "01", title: "O começo", text: "Tudo começou com a busca por roupas fitness que funcionassem na rotina completa, da academia à rua." },
    { number: "02", title: "O cuidado", text: "Modelagem, tecido e acabamento são pensados para o corpo e para o ritmo da mulher brasileira." },
    { number: "03", title: "O próximo passo", text: "Seguimos construindo uma marca próxima, autoral e pronta para evoluir junto com a nossa comunidade." },
  ]} />;
}
