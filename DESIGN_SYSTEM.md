# 🎨 DESIGN_SYSTEM.md — Tokens e Diretrizes Visuais

Este documento estabelece a especificação oficial de design tokens, componentes, cores e tipografia aplicáveis ao ecossistema SaaS Fiscal para Prefeituras.

---

## 1. Tipografia e Fontes

1. **Fonte Técnica e Dados Numéricos**:
   - **`JetBrains Mono`** (`font-mono`): **Obrigatória** para todos os valores monetários (`R$`), percentuais (`%`), datas, códigos IBGE, CNPJ, CPF, limites da LRF, dados de tabelas e métricas estatísticas.
2. **Fonte Institucional / Texto**:
   - `Inter`, `Roboto` ou padrão sans-serif do DSGov.br (`font-sans`).

---

## 2. Paleta de Cores e Tokens Oficiais

### A. Cores Corporativas SaaS (Escrita.Online / SaaS Master)
- **Fundo Master Admin / Dark Mode**: `bg-slate-950`, `bg-slate-900`, `bg-slate-800/80`
- **Destaque Primário**: Emerald / Esmeralda (`#10b981`, `text-emerald-400`, `bg-emerald-600`)
- **Destaque Secundário / Acentos**: Indigo (`#6366f1`), Cyan (`#06b6d4`), Amber (`#f59e0b`)

### B. Cores Institucionais Governamentais (DSGov / Prefeituras Padrão)
- **Azul Governo Federal**: `#0c326f`, `#1351b4`, `#071d41` (`bg-blue-900`, `text-blue-400`)
- **Estados e Semáforos Fiscais**:
  - **Regular / Conforme (Verde)**: `#168821` (`text-emerald-400`, `bg-emerald-950/60`, `border-emerald-700/50`)
  - **Alerta / Atenção (Âmbar/Amarelo)**: `#ffcd07` (`text-amber-400`, `bg-amber-950/60`, `border-amber-700/50`)
  - **Crítico / Limite Prudencial Excedido (Vermelho/Rosa)**: `#e52207` (`text-rose-400`, `bg-rose-950/60`, `border-rose-700/50`)
  - **Informativo / Neutro (Azul / Ardósia)**: `text-sky-400`, `text-slate-300`, `bg-slate-800`

---

## 3. Diretrizes de White-Label & Personalização

1. **Pacote Básico (Standard)**:
   - Exibe a marca institucional "Escrita.Online — Inteligência & Análise Fiscal" no rodapé e no login.
   - Headers utilizam o padrão do município com badge "Powered by Escrita.Online".

2. **Pacote 100% Personalizado (White-Label Premium)**:
   - Permite que o Administrador do SaaS aplique:
     - Cor primária personalizada do município (`customPrimaryColor`);
     - Brasão / Logomarca em alta definição (`customLogoUrl`);
     - Título e subtítulo do portal configurados exclusivamente para o município;
     - Ocultação da assinatura do fornecedor;
   - Aplica os custos adicionais de implantação e mensalidade nas faturas.
