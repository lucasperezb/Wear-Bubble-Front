import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade · Wear Bubble',
  description:
    'Como a Wear Bubble coleta, usa, compartilha e protege os seus dados pessoais, em conformidade com a LGPD (Lei nº 13.709/2018).',
};

const UPDATED_AT = '10 de agosto de 2026';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      <h2 className="text-[1.5rem] leading-tight">{title}</h2>
      <div className="mt-4 flex flex-col gap-3.5 text-[.95rem] leading-[1.8] text-bubble-ink/80 [&_a]:underline [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-bubble-ink [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-bubble-cream text-bubble-ink">
      <div className="border-b border-bubble-ink bg-bubble-cream px-6 pb-12 pt-[70px]">
        <div className="mx-auto max-w-[820px]">
          <a href="/" className="font-sans text-[.7rem] font-semibold uppercase tracking-[.2em] text-bubble-brown">
            ← Voltar para a loja
          </a>
          <h1 className="mt-5 text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.02]">Política de Privacidade</h1>
          <p className="mt-4 max-w-[560px] font-serif text-[1.05rem] italic leading-[1.7] text-bubble-ink/75">
            Como tratamos os seus dados pessoais na Wear Bubble, em conformidade com a Lei Geral de Proteção de Dados
            (Lei nº 13.709/2018).
          </p>
          <p className="mt-5 font-sans text-[.7rem] uppercase tracking-[.18em] text-bubble-ink/55">
            Última atualização: {UPDATED_AT}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[820px] px-6 pb-[90px] pt-4">
        <Section id="controlador" title="1. Quem é o controlador dos seus dados">
          <p>
            A <strong>Wear Bubble</strong>, inscrita no CNPJ nº 68.177.794/0001-05, é a controladora dos dados pessoais
            tratados neste site, nos termos do art. 5º, VI, da LGPD. Isso significa que somos nós que decidimos por que
            e como os seus dados são usados.
          </p>
          <p>
            Para qualquer assunto relacionado a privacidade e proteção de dados, fale com o nosso encarregado (DPO) pelo
            e-mail <a href="mailto:privacidade@wearbubble.com.br">privacidade@wearbubble.com.br</a>.
          </p>
        </Section>

        <Section id="dados" title="2. Quais dados coletamos">
          <p>Coletamos apenas o necessário para operar a loja. Na prática, são estes:</p>
          <p>
            <strong>Dados que você nos fornece</strong>
          </p>
          <ul>
            <li>
              <strong>Cadastro e conta:</strong> nome, e-mail, CPF, telefone e senha (armazenada apenas de forma
              criptografada — nunca em texto legível).
            </li>
            <li>
              <strong>Endereços:</strong> CEP, rua, número, bairro, cidade, estado e ponto de referência, usados para
              cálculo de frete e entrega.
            </li>
            <li>
              <strong>Pedidos:</strong> itens comprados, tamanhos, cores, valores, cupons aplicados, forma de pagamento
              escolhida e endereço de entrega vinculado ao pedido.
            </li>
            <li>
              <strong>Contato e newsletter:</strong> e-mail informado voluntariamente para receber novidades, junto do
              registro do seu consentimento e da data em que ele foi dado.
            </li>
            <li>
              <strong>Trocas e devoluções:</strong> informações que você envia ao solicitar uma troca, devolução ou
              atendimento.
            </li>
          </ul>
          <p>
            <strong>Dados gerados pelo uso do site</strong>
          </p>
          <ul>
            <li>
              <strong>Registros de acesso:</strong> endereço IP, data e hora das requisições e informações do navegador,
              retidos pelo prazo legal do art. 15 do Marco Civil da Internet.
            </li>
            <li>
              <strong>Eventos de navegação:</strong> visualizações de produto, adições à sacola e etapas do checkout,
              usados para entender o desempenho da loja. Quando você não está logada, esses eventos são registrados de
              forma anônima, sem vínculo com a sua identidade.
            </li>
            <li>
              <strong>Cookies e cookie de sessão:</strong> ver a seção 6.
            </li>
          </ul>
          <p>
            <strong>Dados de pagamento.</strong> Não armazenamos números de cartão, CVV ou credenciais bancárias. Esses
            dados são coletados e processados diretamente pelo nosso provedor de pagamento (Asaas) em ambiente próprio.
            Recebemos de volta apenas o status da transação e um identificador do pagamento.
          </p>
          <p>
            <strong>Dados de crianças e adolescentes.</strong> A loja é destinada a maiores de 18 anos. Não coletamos
            intencionalmente dados de menores. Se identificarmos um cadastro nessa situação, ele será excluído.
          </p>
        </Section>

        <Section id="finalidades" title="3. Por que usamos os seus dados e com que base legal">
          <p>
            Todo tratamento tem uma finalidade específica e uma base legal do art. 7º da LGPD. Nunca usamos os seus
            dados para outra coisa sem avisar você antes.
          </p>
          <ul>
            <li>
              <strong>Criar e manter sua conta, autenticar acessos e recuperar senha</strong> — execução de contrato
              (art. 7º, V).
            </li>
            <li>
              <strong>Processar pedidos, cobranças, entregas, trocas e devoluções</strong> — execução de contrato (art.
              7º, V).
            </li>
            <li>
              <strong>Emitir documentos fiscais e cumprir obrigações contábeis e tributárias</strong> — cumprimento de
              obrigação legal (art. 7º, II).
            </li>
            <li>
              <strong>Guardar registros de acesso</strong> — cumprimento de obrigação legal (art. 7º, II, c/c Marco
              Civil da Internet).
            </li>
            <li>
              <strong>Enviar novidades, lançamentos e promoções por e-mail</strong> — consentimento (art. 7º, I), que
              você pode retirar a qualquer momento.
            </li>
            <li>
              <strong>Prevenir fraudes, abusos e uso indevido de cupons</strong> — legítimo interesse (art. 7º, IX).
            </li>
            <li>
              <strong>Medir o desempenho da loja e melhorar a experiência de compra</strong> — legítimo interesse (art.
              7º, IX), com dados agregados ou pseudoanonimizados sempre que possível.
            </li>
            <li>
              <strong>Exercer ou defender direitos em processo</strong> — art. 7º, VI.
            </li>
          </ul>
          <p>
            Não realizamos decisões automatizadas que produzam efeitos jurídicos ou impactem significativamente você, e
            não fazemos perfilamento para venda de dados.
          </p>
        </Section>

        <Section id="compartilhamento" title="4. Com quem compartilhamos">
          <p>
            Não vendemos os seus dados. Compartilhamos apenas o mínimo necessário, e apenas com quem participa da
            operação da loja:
          </p>
          <ul>
            <li>
              <strong>Asaas</strong> (meio de pagamento) — nome, CPF, e-mail e valor, para processar Pix e cartão.
            </li>
            <li>
              <strong>Melhor Envio e transportadoras</strong> — nome, endereço completo e telefone, para cotação de
              frete, emissão de etiqueta e entrega.
            </li>
            <li>
              <strong>Provedor de e-mail transacional</strong> — nome e e-mail, para enviar confirmações de pedido,
              códigos de acesso e avisos de entrega.
            </li>
            <li>
              <strong>Provedores de infraestrutura e hospedagem</strong> — armazenamento e processamento sob contrato,
              atuando como operadores.
            </li>
            <li>
              <strong>Autoridades públicas</strong> — quando houver ordem judicial ou obrigação legal.
            </li>
          </ul>
          <p>
            Todos os operadores estão contratualmente obrigados a tratar os dados apenas conforme as nossas instruções e
            a adotar medidas de segurança compatíveis.
          </p>
          <p>
            <strong>Transferência internacional.</strong> Alguns desses provedores podem processar dados fora do Brasil.
            Nesses casos, a transferência é feita nos termos dos arts. 33 a 36 da LGPD, com cláusulas contratuais de
            proteção equivalentes às previstas na lei.
          </p>
        </Section>

        <Section id="retencao" title="5. Por quanto tempo guardamos">
          <ul>
            <li>
              <strong>Dados de cadastro e endereços:</strong> enquanto a conta existir, e por até 6 meses após a
              exclusão, para atender a eventuais contestações.
            </li>
            <li>
              <strong>Pedidos e dados fiscais:</strong> 5 anos, conforme o Código de Defesa do Consumidor e a legislação
              tributária. Após a exclusão da conta, o pedido permanece desvinculado do seu perfil.
            </li>
            <li>
              <strong>Registros de acesso:</strong> 6 meses, conforme o art. 15 do Marco Civil da Internet.
            </li>
            <li>
              <strong>Códigos de login e tokens de redefinição de senha:</strong> expiram em minutos e são descartados
              logo após o uso.
            </li>
            <li>
              <strong>E-mail de newsletter:</strong> até você retirar o consentimento.
            </li>
            <li>
              <strong>Protocolos de exclusão:</strong> mantemos apenas o número do protocolo, a data e um identificador
              mascarado, como comprovação de que o pedido foi atendido.
            </li>
          </ul>
          <p>Encerrado o prazo, os dados são eliminados ou anonimizados de forma irreversível.</p>
        </Section>

        <Section id="cookies" title="6. Cookies">
          <p>Usamos um conjunto enxuto de cookies:</p>
          <ul>
            <li>
              <strong>Necessários:</strong> o cookie de sessão <code>bubble_token</code>, que mantém você autenticada. É
              <code> httpOnly</code>, o que impede o acesso por scripts, e é removido quando você sai da conta. Sem ele
              a loja não funciona, por isso não depende de consentimento.
            </li>
            <li>
              <strong>Funcionais:</strong> armazenamento local no seu navegador para lembrar o conteúdo da sacola entre
              visitas.
            </li>
          </ul>
          <p>
            Você pode bloquear ou apagar cookies nas configurações do navegador. Se bloquear os necessários, o login e o
            checkout deixam de funcionar.
          </p>
        </Section>

        <Section id="pseudoanonimizacao" title="7. Dados pseudoanonimizados e anonimizados">
          <p>
            Nem todo dado que passa pelos nossos sistemas identifica você. Sempre que conseguimos atingir o mesmo
            objetivo sem saber de quem é o dado, é isso que fazemos — é o princípio da necessidade, previsto no art. 6º,
            III, da LGPD.
          </p>
          <p>
            <strong>O que é cada coisa</strong>
          </p>
          <ul>
            <li>
              <strong>Anonimizado</strong> é o dado que perdeu de forma irreversível a ligação com uma pessoa. O art. 12
              da LGPD determina que ele deixa de ser dado pessoal, e por isso não está mais sujeito às regras desta
              política.
            </li>
            <li>
              <strong>Pseudoanonimizado</strong> é o dado que continua ligado a você, mas apenas por um identificador
              interno separado — sem nome, e-mail ou CPF junto. Ele ainda é dado pessoal, e continua protegido por esta
              política.
            </li>
          </ul>
          <p>
            <strong>Onde aplicamos isso na prática</strong>
          </p>
          <ul>
            <li>
              <strong>Navegação de visitantes não logados.</strong> Visualizações de produto, adições à sacola e etapas
              do checkout são registradas apenas com um rótulo genérico. Não há como reconstruir quem navegou.
            </li>
            <li>
              <strong>Métricas da loja.</strong> Relatórios de peças mais vistas, taxa de conversão e desempenho de
              cupons são gerados a partir de dados agregados. Trabalhamos com números totais, não com pessoas.
            </li>
            <li>
              <strong>Eventos de quem tem conta.</strong> Aqui o registro guarda um identificador interno da conta, não
              os seus dados de cadastro. É um dado pseudoanonimizado: ainda é seu, e você pode exercer todos os direitos
              da seção 8 sobre ele.
            </li>
            <li>
              <strong>Protocolos de exclusão de conta.</strong> Quando você exclui a conta, guardamos apenas o número do
              protocolo, a data e um identificador mascarado — o suficiente para provar que atendemos ao seu pedido, e
              nada além disso.
            </li>
            <li>
              <strong>Exclusão de conta com histórico de compras.</strong> Ao excluir sua conta, o vínculo entre os
              pedidos e o seu perfil é desfeito, e o seu histórico de navegação deixa de ser associado a você. Os dados
              de identificação que constam do próprio pedido — nome, e-mail, CPF e telefone do comprador — são mantidos
              pelo prazo fiscal de 5 anos, por exigência legal (art. 16, I, da LGPD).
            </li>
          </ul>
        </Section>

        <Section id="direitos" title="8. Os seus direitos">
          <p>O art. 18 da LGPD garante a você, a qualquer momento e sem custo, o direito de:</p>
          <ul>
            <li>confirmar se tratamos os seus dados e acessá-los;</li>
            <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>
              solicitar anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em
              desconformidade com a lei;
            </li>
            <li>solicitar a portabilidade dos dados a outro fornecedor;</li>
            <li>eliminar dados tratados com base no seu consentimento;</li>
            <li>saber com quais entidades compartilhamos os seus dados;</li>
            <li>ser informada sobre a possibilidade de não consentir e as consequências disso;</li>
            <li>retirar o consentimento a qualquer momento;</li>
            <li>opor-se a tratamentos fundados em legítimo interesse.</li>
          </ul>
          <p>
            <strong>Como exercer.</strong> Boa parte dos direitos está disponível direto na sua conta: em{' '}
            <a href="/conta">Minha conta</a> você consulta e edita seus dados, gerencia endereços e pode solicitar a
            exclusão da conta — nesse caso emitimos um protocolo de confirmação na hora. Para os demais pedidos, escreva
            para <a href="mailto:privacidade@wearbubble.com.br">privacidade@wearbubble.com.br</a>.
          </p>
          <p>
            Respondemos em até <strong>15 dias</strong>. Podemos pedir informações adicionais para confirmar a sua
            identidade antes de atender, para proteger a sua própria conta.
          </p>
          <p>
            Para cancelar os e-mails de novidades, basta usar o link de descadastro presente no rodapé de cada mensagem.
          </p>
        </Section>

        <Section id="seguranca" title="9. Como protegemos os seus dados">
          <ul>
            <li>tráfego criptografado em HTTPS entre o seu navegador, a loja e a nossa API;</li>
            <li>senhas armazenadas com algoritmo de hash — nem nós conseguimos lê-las;</li>
            <li>
              cookie de autenticação <code>httpOnly</code>, resistente a roubo por scripts;
            </li>
            <li>acesso ao painel administrativo restrito a pessoas autorizadas e autenticadas;</li>
            <li>envio de e-mails por conexão TLS 1.2 ou superior;</li>
            <li>dados sensíveis de pagamento nunca trafegam pelos nossos servidores.</li>
          </ul>
          <p>
            <strong>Incidentes.</strong> Se ocorrer um incidente de segurança com risco relevante aos seus direitos,
            comunicaremos você e a ANPD nos prazos e na forma do art. 48 da LGPD.
          </p>
          <p>
            Nenhum sistema é totalmente imune. Mantenha sua senha em segredo e evite reutilizá-la em outros serviços.
          </p>
        </Section>

        <Section id="alteracoes" title="10. Mudanças nesta política">
          <p>
            Podemos atualizar esta política para refletir mudanças na operação da loja ou na legislação. A data de
            última atualização fica sempre no topo da página. Se a mudança for significativa, avisaremos por e-mail ou
            por um aviso em destaque no site antes de ela entrar em vigor.
          </p>
        </Section>

        <Section id="contato" title="11. Fale com a gente">
          <p>
            Dúvidas, pedidos ou reclamações sobre privacidade:{' '}
            <a href="mailto:privacidade@wearbubble.com.br">privacidade@wearbubble.com.br</a>. Assuntos gerais:{' '}
            <a href="mailto:contato@wearbubble.com.br">contato@wearbubble.com.br</a> ou{' '}
            <a href="https://wa.me/5511936240362" target="_blank" rel="noopener">
              WhatsApp (11) 93624-0362
            </a>
            .
          </p>
          <p>
            Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD) por meio do site{' '}
            <a href="https://www.gov.br/anpd" target="_blank" rel="noopener">
              gov.br/anpd
            </a>
            .
          </p>
        </Section>

        <div className="mt-14 border-t border-bubble-line pt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-bubble-ink bg-transparent px-[30px] py-[15px] font-sans text-[.78rem] font-semibold uppercase tracking-[.14em] text-bubble-ink transition-all hover:bg-bubble-ink hover:text-bubble-white"
          >
            Voltar para a loja
          </a>
        </div>
      </div>
    </main>
  );
}
