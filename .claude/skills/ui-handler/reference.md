# UI Architecture Reference

## 1. Component Strategy

| Component Type | Source | MCP Tool | Path |
| :--- | :--- | :--- | :--- |
| **Atoms** (Button, Input) | Shadcn UI | `shadcn` | `src/components/ui/` |
| **Blocks** (Hero, Footer) | Custom/Claude | - | `src/components/sections/` |
| **Page Specific** | Custom | - | `src/app/.../_components/` |

## 2. Theming (`src/app/globals.css`)
-   **Format**: CSS Variables with Tailwind v4 `@theme`.
-   **Colors**: OKLCH color space is preferred for dynamic range.
-   **Updates**: Use the Shadcn MCP to update the base color palette or typography variables safely.

## 3. Best Practices
1.  **Don't Reinvent**: Sempre verifique o catálogo Shadcn antes de escrever do zero.
2.  **Tailwind Native**: Use utility classes (`flex gap-4`) ao invés de CSS customizado.
3.  **Responsiveness**: Design Mobile-First (`w-full md:w-1/2`).
4.  **Dark Mode**: Use sempre variáveis semânticas (`bg-background` não `bg-white`) para suportar dark mode automaticamente.
