---
name: ui-handler
description: Implement UI using Shadcn MCP (atoms/theme) and custom components. Use when adding buttons, layouts, or building sections for landing pages or app.
tools: Read, Write, Edit, mcp_shadcn
model: inherit
---

# UI Handler

## Instructions

### 1. Installing Standard Components (Atoms)
Use o **Shadcn MCP** para elementos de UI fundamentais (buttons, inputs, dialogs, cards).
1.  **Action**: Peça ao Shadcn MCP para adicionar o componente.
    > "Add the button and dialog components using Shadcn MCP."
2.  **Manual Fallback**: `pnpm dlx shadcn@latest add {component}`

### 2. Criando Seções Complexas (Blocks)
Para seções de alto nível (Landing pages, Heroes, Dashboards), escreva manualmente ou peça ao Claude para gerar baseado nos componentes Shadcn existentes.
1.  **Location**: Coloque em `src/components/sections/` ou `src/components/website/`.
2.  **Integration**: Importe e use na `page.tsx`.

### 3. Theming & Styling
Use o **Shadcn MCP** ou edite `src/app/globals.css` diretamente.
-   **Theme Updates**: Peça ao Shadcn MCP para aplicar um tema ou paleta.
    > "Update the app theme to use a 'zinc' neutral base with 'blue' primary color."
-   **CSS Variables**: Usamos variáveis CSS (OKLCH) em `src/app/globals.css`. Garanta que novos estilos usem as variáveis semânticas (ex: `bg-background`, `text-primary`).

### 4. Creating Layouts
1.  **Identify**: Header, Sidebar, Content Area.
2.  **Compose**: Use atoms de `@/components/ui` e seções de `@/components/sections`.
3.  **Co-location**: Se um componente é único a uma página, coloque em `_components/` ao lado da página.

## Reference
For detailed architecture and best practices, see [reference.md](reference.md).
