import { QrCodePorta } from "@/components/qrcode-porta";

export default function QrCodePage() {
  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h1 className="text-xl font-semibold tracking-tight">QR da porta</h1>
        <p className="text-sm text-muted-foreground">
          Imprima e cole na porta da sala. Quem escanear vê a
          disponibilidade — só horários livres e ocupados, sem dados de quem
          reservou.
        </p>
      </div>
      <QrCodePorta />
    </div>
  );
}
