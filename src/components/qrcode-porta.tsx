"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CopyIcon, PrinterIcon } from "lucide-react";
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
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-6 print-area">
        <div className="text-center">
          <p className="text-base font-semibold">Sala de reunião</p>
          <p className="text-sm text-muted-foreground">
            Aponte a câmera para ver os horários disponíveis
          </p>
        </div>

        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt="QR code para a agenda pública da sala"
            className="size-64 rounded-lg"
            width={256}
            height={256}
          />
        ) : (
          <Skeleton className="size-64 rounded-lg" />
        )}

        <p className="text-center text-xs break-all text-muted-foreground">
          {urlPublica}
        </p>
      </div>

      <div className="flex gap-2 print:hidden">
        <Button
          type="button"
          className="flex-1"
          onClick={() => window.print()}
          disabled={!qrDataUrl}
        >
          <PrinterIcon className="size-4" />
          Imprimir
        </Button>
        <Button
          type="button"
          variant="outline"
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
