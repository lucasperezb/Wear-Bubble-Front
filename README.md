# Wear Bubble — Frontend

Frontend do e-commerce Wear Bubble, desenvolvido com Next.js, React, TypeScript e Tailwind CSS. A aplicação contempla catálogo de produtos, carrinho, checkout integrado, autenticação, conta do cliente e painel administrativo.

## Tecnologias

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Lucide React

## Requisitos

- Node.js 20.9 ou superior
- npm
- API Wear Bubble em execução

O backend do projeto está no repositório [Wear-Bubble-API](https://github.com/lucasperezb/Wear-Bubble-API).

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone git@github.com:lucasperezb/Wear-Bubble-Front.git
cd Wear-Bubble-Front
npm install
```

Crie o arquivo de ambiente local:

```bash
cp .env.example .env.local
```

Configuração padrão para desenvolvimento:

```env
NEXT_PUBLIC_API_BASE=/api
BACKEND_API_URL=http://localhost:4007/api
```

`NEXT_PUBLIC_API_BASE` é o endereço usado pelo navegador. Mantendo `/api`, as requisições passam pelo rewrite do Next.js.

`BACKEND_API_URL` é o endereço interno da API usado pelo rewrite configurado em `next.config.mjs`.

O arquivo `.env.local` contém configurações locais e não deve ser enviado ao Git.

## Executando localmente

Com o backend disponível na porta `4007`, inicie o frontend:

```bash
npm run dev
```

A loja ficará disponível em:

```text
http://localhost:4000
```

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o Next.js em modo de desenvolvimento com HTTP |
| `npm run build` | Gera o build de produção |
| `npm run start` | Executa o build de produção na porta `4000` |
| `npm run typecheck` | Valida os tipos TypeScript sem gerar arquivos |

## Rotas

| Rota | Descrição |
| --- | --- |
| `/` | Loja, catálogo, produtos, combos e carrinho lateral |
| `/carrinho` | Fluxo de carrinho, entrega, pagamento e confirmação |
| `/login` | Login com senha ou código enviado por e-mail |
| `/cadastro` | Criação de conta |
| `/verificar-email` | Verificação do endereço de e-mail |
| `/conta` | Dados pessoais, endereços e pedidos do cliente |
| `/?admin=1` | Abertura do painel para usuários com perfil de gerente |

## Funcionalidades

- Catálogo com filtros e detalhes dos produtos
- Combinação de peças
- Carrinho persistido no navegador
- Checkout para cliente autenticado ou convidado
- Consulta e preenchimento de endereço por CEP
- Pagamento transparente via Pix e cartão
- Login com senha ou código por e-mail
- Verificação de e-mail
- Área do cliente com pedidos, perfil e endereços
- Painel administrativo para produtos, combos, cupons, clientes e envios

## Estrutura

```text
app/
├── cadastro/           Página de cadastro
├── carrinho/           Checkout
├── conta/              Área do cliente
├── login/              Login
├── verificar-email/    Confirmação de e-mail
├── globals.css         Estilos realmente globais
├── layout.tsx          Layout raiz
└── page.tsx            Loja

components/
├── account/            Perfil e endereços
├── admin/              Painel administrativo
├── auth/               Login, cadastro e verificação
├── cart/               Carrinho lateral
├── checkout/           Etapas do checkout
├── home/               Seções da página inicial
├── layout/             Cabeçalho
├── product/            Catálogo, card e modal
└── shared/             Componentes compartilhados

lib/
├── api.ts              Cliente HTTP e tipos da API
├── cart.ts             Persistência do carrinho
└── input-formatters.ts Formatação dos campos
```

## Integração com a API

As chamadas HTTP são centralizadas em `lib/api.ts` e enviam cookies com `credentials: "include"`. A API precisa permitir a origem do frontend e habilitar credenciais no CORS.

Em desenvolvimento, o Next.js encaminha:

```text
/api/* → http://localhost:4007/api/*
```

Para produção, configure no provedor do frontend:

```env
NEXT_PUBLIC_API_BASE=/api
BACKEND_API_URL=https://api.wearbubble.com.br/api
```

Em produção, `wearbubble.com.br` é redirecionado permanentemente para
`www.wearbubble.com.br`. Isso mantém uma única origem canônica e evita que caches
independentes sirvam versões diferentes após um deploy.

No backend, configure:

```env
NODE_ENV=production
FRONTEND_ORIGIN=https://wearbubble.com.br,https://www.wearbubble.com.br
STORE_URL=https://wearbubble.com.br
```

## Build de produção

Valide os tipos e gere o build:

```bash
npm run typecheck
npm run build
```

Execute localmente o resultado:

```bash
npm run start
```

O projeto atualmente utiliza rewrite do Next.js para acessar a API e, portanto, precisa de um ambiente com runtime Node.js, como Vercel, Render ou uma VPS. Para hospedagem puramente estática, a integração com a API e a configuração do Next.js precisam ser adaptadas.

## Segurança

- Não versione `.env.local`, tokens ou credenciais.
- O token de autenticação é mantido em cookie `HttpOnly` pelo backend.
- Pagamentos e webhooks devem utilizar HTTPS em produção.
- Dados de cartão não devem ser armazenados pelo frontend ou backend.
- Variáveis sem o prefixo `NEXT_PUBLIC_` ficam restritas ao servidor Next.js.
