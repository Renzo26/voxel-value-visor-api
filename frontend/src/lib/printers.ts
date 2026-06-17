export interface Printer {
  chave: string;
  nome: string;
  preco: number;
  vidaUtil: number; // meses
  watts: number;
  grupo: "entrada" | "intermediaria" | "pro";
}

export const PRINTERS: Printer[] = [
  { chave: "ender3", nome: "Creality Ender 3", preco: 1259, vidaUtil: 36, watts: 270, grupo: "entrada" },
  { chave: "ender3v2neo", nome: "Creality Ender 3 V2 Neo", preco: 1299, vidaUtil: 36, watts: 350, grupo: "entrada" },
  { chave: "ender3s1", nome: "Creality Ender 3 S1", preco: 1399, vidaUtil: 36, watts: 350, grupo: "entrada" },
  { chave: "ender3v3se", nome: "Creality Ender 3 V3 SE", preco: 1599, vidaUtil: 36, watts: 350, grupo: "entrada" },
  { chave: "sovol", nome: "Sovol SV04", preco: 1899, vidaUtil: 36, watts: 500, grupo: "entrada" },
  { chave: "elegoomars5", nome: "ELEGOO Mars 5 (Resina)", preco: 2599, vidaUtil: 48, watts: 50, grupo: "intermediaria" },
  { chave: "k1se", nome: "Creality K1 SE", preco: 2299, vidaUtil: 48, watts: 350, grupo: "intermediaria" },
  { chave: "bambuA1", nome: "Bambu Lab A1", preco: 3189, vidaUtil: 48, watts: 150, grupo: "intermediaria" },
  { chave: "ender3v3plus", nome: "Creality Ender 3 V3 Plus", preco: 3554, vidaUtil: 48, watts: 350, grupo: "intermediaria" },
  { chave: "elegoocentauri", nome: "ELEGOO Centauri Carbon", preco: 3299, vidaUtil: 48, watts: 300, grupo: "intermediaria" },
  { chave: "bambuA1combo", nome: "Bambu Lab A1 Combo + AMS Lite", preco: 5760, vidaUtil: 48, watts: 150, grupo: "intermediaria" },
  { chave: "k1max", nome: "Creality K1 Max", preco: 5299, vidaUtil: 48, watts: 800, grupo: "intermediaria" },
  { chave: "bambuP1S", nome: "Bambu Lab P1S + AMS", preco: 14066, vidaUtil: 60, watts: 300, grupo: "pro" },
  { chave: "bambuk2plus", nome: "Creality K2 Plus Combo", preco: 9999, vidaUtil: 60, watts: 800, grupo: "pro" },
];

export const PRINTER_GROUPS: { key: Printer["grupo"]; label: string }[] = [
  { key: "entrada", label: "🟢 Entrada (até R$ 2.000)" },
  { key: "intermediaria", label: "🟡 Intermediária (R$ 2.000–6.000)" },
  { key: "pro", label: "🔴 Pro (acima de R$ 6.000)" },
];

export const CUSTOM_PRINTER_KEY = "custom";

export function getPrinter(chave: string): Printer | undefined {
  return PRINTERS.find((p) => p.chave === chave);
}
