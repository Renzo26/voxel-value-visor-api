// Build de produção para self-host (Docker/EasyPanel).
// Mantém o config padrão do Lovable intacto (que tem como alvo o Cloudflare)
// e apenas troca o preset do Nitro para `node-server`, gerando um servidor
// Node executável em vez de um worker de edge.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: "node-server",
  },
});
