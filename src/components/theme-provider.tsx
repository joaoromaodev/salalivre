"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Provedor de tema (claro/escuro/sistema) via next-themes. Aplica a
 * classe `.dark` no <html>, que é o que o `@custom-variant dark` do
 * Tailwind espera. `defaultTheme="system"` respeita a preferência do SO.
 */
export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
