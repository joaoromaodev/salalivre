import { LoginForm } from "./login-form";

interface LoginPageProps {
  searchParams: Promise<{ redirecionar?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirecionar } = await searchParams;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <LoginForm redirecionar={redirecionar} />
    </div>
  );
}
