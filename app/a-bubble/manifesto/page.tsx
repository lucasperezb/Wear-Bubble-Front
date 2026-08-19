import { EditorialPage } from "../../../components/store/EditorialPage";

export default function ManifestoPage() {
  return <EditorialPage eyebrow="A Bubble · Manifesto" title="Estoure seus limites" lead="Movimento não é apenas exercício. É a escolha diária de ocupar espaço, confiar no próprio corpo e seguir em frente com autenticidade." items={[
    { number: "01", title: "Conforto é força", text: "Criamos peças que acompanham o corpo sem limitar quem você pode ser dentro ou fora do treino." },
    { number: "02", title: "Identidade em movimento", text: "Performance e estilo não precisam disputar espaço. Cada detalhe existe para unir os dois." },
    { number: "03", title: "Feita para ir além", text: "A Bubble veste mulheres reais, ritmos diferentes e toda a energia que existe entre um desafio e o próximo." },
  ]} />;
}
