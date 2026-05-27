# Plano: Reformulação completa do catálogo ConectadoStore

Vou reestruturar o catálogo em fases. Como é um escopo grande, proponho dividir em **3 entregas** para validar visualmente antes de prosseguir. Você pode aprovar tudo de uma vez ou pedir só a Fase 1 primeiro.

---

## Fase 1 — Estrutura de dados + Menu de categorias

### Banco de dados
Migração para suportar categorias/subcategorias e marcas:

- Adicionar colunas em `products`:
  - `brand` (text) — Dell, Apple, Epson, etc.
  - `subcategory` (text) — iPhone, MacBook, Notebook, Impressora, etc.
  - `model` (text) — modelo específico
  - `views_count` (integer, default 0) — para "mais visualizados"
  - `is_featured` (boolean, default false) — destaque na home
- Atualizar `category` para suportar: `apple`, `notebook`, `desktop`, `printer`, `supply`, `accessory`
- Migrar produtos existentes: `category=notebook` mantém, `iphone`/`macbook` viram `category=apple` + `subcategory` correspondente
- Índices para performance: `category`, `subcategory`, `brand`, `status`, full-text search em `name||description||model`

### Frontend
- **Novo componente `CategoryMenu`** — sidebar accordion com ícones (lucide: Home, Apple, Laptop, Monitor, Printer, Droplet, Mouse), expansão suave (Radix Accordion já instalado)
- **Nova home `/catalogo`** com:
  - Hero com busca global
  - Seção "Ofertas em destaque" (produtos com `is_featured=true`)
  - Grid de categorias principais com ícones
- **Rota `/catalogo/categoria/:category/:subcategory?`** — listagem filtrada
- Responsivo: sidebar vira drawer (Sheet) no mobile

---

## Fase 2 — Busca inteligente + Filtros avançados + Página de produto

### Busca
- Busca global no header que pesquisa em: `name`, `brand`, `category`, `subcategory`, `model`, `description`, especificações (`processor`, `ram`, etc.)
- Resultado agrupado por categoria (ex: "Dell" → seção Notebooks + seção Acessórios)
- Debounce 300ms, query Supabase com `or()` + `ilike`

### Filtros avançados (sidebar/drawer)
- Marca (checkbox múltipla, lista dinâmica baseada em produtos da categoria)
- Estado: novo/seminovo/usado
- Disponibilidade: disponível/esgotado
- Faixa de preço (slider duplo)
- Botão "Limpar filtros"

### Página de produto pública (`/catalogo/:id`)
- Status visual disponível/esgotado (badge grande)
- **Botão "Comprar pelo WhatsApp"** com mensagem pré-preenchida:
  ```
  Olá, tenho interesse no produto:
  Produto: [nome]
  Modelo: [modelo]
  Preço: [valor]
  Código: [ID curto]
  ```
- Botão "Compartilhar" (Web Share API + fallback copiar link)
- **Produtos relacionados** — mesma `subcategory` ou mesma `brand`, excluindo o atual, ordenado por `views_count`
- Incrementar `views_count` ao abrir

### Performance
- Paginação infinita (20 por vez) ou paginação clássica
- `select` apenas das colunas necessárias na listagem (sem `description` longa)
- Lazy load de imagens (já existe `loading="lazy"`)

---

## Fase 3 — Painel admin aprimorado

- Campos novos no `ProductForm`: marca, subcategoria, modelo, destaque (checkbox)
- Seletor de categoria → subcategoria em cascata (ex: escolher "Apple" mostra iPhone/MacBook/iPad/Acessórios Apple)
- Aba "Mais visualizados" no Dashboard
- Toggle rápido de status (Disponível/Reservado/Vendido) direto no card
- Toggle "Destaque" rápido
- Bulk actions (opcional): selecionar múltiplos para alterar status

---

## Detalhes técnicos

**Stack:** React + Vite + Tailwind + shadcn (já no projeto). Sem novas dependências — Radix Accordion, Sheet, Slider e Checkbox já estão disponíveis.

**Categorias/subcategorias** — vou armazenar como constante TypeScript (`src/lib/categories.ts`) em vez de tabela separada. Motivo: lista fixa, raramente muda, evita JOIN extra e mantém ícones tipados. Se no futuro quiser gerenciar pelo admin, migramos para tabela.

**Ícones por categoria:**
- Apple → `Apple`
- Notebooks → `Laptop`
- Computadores → `Monitor`
- Impressoras → `Printer`
- Suprimentos → `Droplet`
- Acessórios → `Mouse`

**Compatibilidade:** produtos existentes (`category=notebook|macbook|iphone`) serão migrados automaticamente. Garantias e formulários continuam funcionando.

---

## O que quero confirmar antes de começar

1. **Posso prosseguir com todas as 3 fases** em sequência, ou prefere validar a Fase 1 primeiro?
2. **Número do WhatsApp** para o botão de compra — qual número usar? (posso deixar configurável via campo do produto se preferir, ou um número fixo da loja)
3. **Gerenciar categorias pelo admin** — você listou isso no item 10, mas como a estrutura é fixa, sugiro **não** criar CRUD de categorias agora (complicaria sem ganho real). Confirma?