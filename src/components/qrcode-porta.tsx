"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CalendarCheckIcon, CopyIcon, PrinterIcon, ScanLineIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Gera, no client, o QR code apontando para a tela pública /sala usando
 * a origem atual (assim funciona igual em localhost, preview e produção
 * sem precisar configurar a URL em lugar nenhum). O bloco imprimível é
 * isolado via classes de print definidas em globals.css.
 */
export function QrCodePorta() {
  const [urlPublica, setUrlPublica] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}/sala`;
    setUrlPublica(url);

    QRCode.toDataURL(url, {
      width: 1024,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch(() => toast.error("Não foi possível gerar o QR code."));
  }, []);

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(urlPublica);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="print-area mx-auto flex max-w-sm flex-col items-center gap-5 rounded-2xl border bg-card p-7 text-center shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CalendarCheckIcon className="size-5" />
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight">
              Sala de reunião
            </p>
            <p className="text-sm text-muted-foreground">
              Veja os horários livres e ocupados
            </p>
          </div>
        </div>

        {qrDataUrl ? (
          <div className="rounded-2xl border bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR code para a agenda pública da sala"
              className="size-60"
              width={240}
              height={240}
            />
          </div>
        ) : (
          <Skeleton className="size-[17.25rem] rounded-2xl" />
        )}

        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ScanLineIcon className="size-4 text-primary" />
          Aponte a câmera do celular
        </p>

        <p className="text-center text-xs break-all text-muted-foreground">
          {urlPublica}
        </p>
      </div>

      <div className="flex gap-2 print:hidden">
        <Button
          type="button"
          className="h-11 flex-1"
          onClick={() => window.print()}
          disabled={!qrDataUrl}
        >
          <PrinterIcon className="size-4" />
          Imprimir
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={copiarLink}
          disabled={!urlPublica}
        >
          <CopyIcon className="size-4" />
          Copiar link
        </Button>
      </div>
    </div>
  );
}
