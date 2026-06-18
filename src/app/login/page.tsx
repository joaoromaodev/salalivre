import { LoginForm } from "./login-form";

interface LoginPageProps {
  searchParams: Promise<{ redirecionar?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirecionar } = await searchParams;

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
      {/* Brilho sutil de fundo com a cor de destaque. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--accent),transparent_70%)] opacity-70"
      />
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <LoginForm redirecionar={redirecionar} />
        <p className="text-center text-xs text-muted-foreground">
          Acesso restrito à equipe gestora da sala.
        </p>
      </div>
    </div>
  );
}
