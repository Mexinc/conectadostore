import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Download, Printer, Loader2, FileText } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import jsPDF from "jspdf";

type Product = Tables<"products">;

// ─── Helpers ──────────────────────────────────────────────

const maskCPF = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
};

const formatDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("pt-BR");

const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

function extractSpec(description: string, patterns: RegExp[], fallback = "Não informado") {
  for (const p of patterns) {
    const m = description.match(p);
    if (m) return m[0];
  }
  return fallback;
}

function extractSpecs(desc: string) {
  const d = desc || "";
  const processor = extractSpec(d, [
    /intel\s*core\s*i\d[\w\s\-]*/i,
    /i[3579][\s-]\d{4,5}\w*/i,
    /ryzen\s*\d[\w\s\-]*/i,
    /celeron[\w\s\-]*/i,
    /pentium[\w\s\-]*/i,
    /apple\s*m\d[\w\s]*/i,
  ]);
  const ram = extractSpec(d, [/\d+\s*gb\s*(ram|ddr\d?)/i, /\d+gb/i]);
  const storageMatch = extractSpec(d, [
    /\d+\s*(tb|gb)\s*(nvme|ssd|hd|hdd)/i,
    /(nvme|ssd|hd|hdd)\s*\d+\s*(tb|gb)/i,
    /\d+\s*(tb|gb)\s*(de\s*)?(armazenamento|disco)/i,
  ]);
  let storageType = "HD";
  if (/nvme/i.test(storageMatch)) storageType = "NVMe";
  else if (/ssd/i.test(storageMatch)) storageType = "SSD";
  const storage = storageMatch !== "Não informado" ? `${storageMatch} (${storageType})` : "Não informado";
  const os = extractSpec(d, [
    /windows\s*\d+[\w\s]*/i,
    /macos[\w\s]*/i,
    /linux[\w\s]*/i,
    /chrome\s*os/i,
    /ubuntu[\w\s.]*/i,
  ]);
  return { processor, ram, storage, os };
}

// ─── PDF Generation ───────────────────────────────────────

const YELLOW = "#FFCC00";
const BLACK = "#1A1A1A";
const LIGHT_GRAY = "#F5F5F5";
const DARK_GRAY = "#555555";
const WHITE = "#FFFFFF";
const RED_DARK = "#8B1A1A";
const GREEN = "#2E7D32";
const RED = "#C62828";
const BLUE = "#1565C0";

function generateWarrantyPDF(data: {
  warrantyNumber: string;
  equipmentName: string;
  processor: string;
  ram: string;
  storage: string;
  os: string;
  clientName: string;
  clientCpf: string;
  clientPhone: string;
  clientAddress: string;
  warrantyDays: number;
  saleDate: string;
  validUntil: string;
  sellerName: string;
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 15;
  const CW = W - M * 2;
  const today = new Date().toLocaleDateString("pt-BR");

  // ─── Helper functions ───
  const hexToRgb = (hex: string) => {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)] as [number, number, number];
  };

  const setColor = (hex: string) => doc.setTextColor(...hexToRgb(hex));
  const setFill = (hex: string) => doc.setFillColor(...hexToRgb(hex));
  const setDraw = (hex: string) => doc.setDrawColor(...hexToRgb(hex));

  const sectionBar = (y: number, label: string, bgColor = BLACK, textColor = YELLOW) => {
    setFill(bgColor);
    doc.roundedRect(M, y, CW, 8, 1, 1, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    setColor(textColor);
    doc.text(label, M + 4, y + 5.5);
    return y + 10;
  };

  const fieldBox = (x: number, y: number, w: number, label: string, value: string) => {
    setFill(WHITE);
    doc.roundedRect(x, y, w, 14, 2, 2, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    setColor(DARK_GRAY);
    doc.text(label, x + 3, y + 5);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    setColor(BLACK);
    doc.text(value || "—", x + 3, y + 11, { maxWidth: w - 6 });
    return y + 16;
  };

  const halfW = (CW - 4) / 2;

  // ═══════════════════ PAGE 1 ═══════════════════

  // Top yellow stripe
  setFill(YELLOW);
  doc.rect(0, 0, W, 4, "F");

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  setColor(BLACK);
  doc.text("CERTIFICADO DE GARANTIA", W / 2, 20, { align: "center" });

  // Yellow line under title
  setDraw(YELLOW);
  doc.setLineWidth(0.8);
  doc.line(M, 24, W - M, 24);

  // Certificate number & date top-right
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  setColor(DARK_GRAY);
  doc.text(`Nº ${data.warrantyNumber}`, W - M, 14, { align: "right" });
  doc.text(`Emissão: ${today}`, W - M, 18, { align: "right" });

  // Body background
  setFill(LIGHT_GRAY);
  doc.rect(0, 28, W, 245, "F");

  let y = 32;

  // ─── PRODUTO ───
  y = sectionBar(y, "PRODUTO");
  y = fieldBox(M, y, CW, "EQUIPAMENTO", data.equipmentName);
  const row2y = y;
  fieldBox(M, y, halfW, "PROCESSADOR", data.processor);
  y = fieldBox(M + halfW + 4, y, halfW, "MEMÓRIA RAM", data.ram);
  const row3y = y;
  fieldBox(M, y, halfW, "ARMAZENAMENTO", data.storage);
  y = fieldBox(M + halfW + 4, y, halfW, "SISTEMA OPERACIONAL", data.os);

  y += 2;

  // ─── DADOS DO CLIENTE ───
  y = sectionBar(y, "DADOS DO CLIENTE");
  y = fieldBox(M, y, CW, "NOME COMPLETO", data.clientName);
  const cpfRow = y;
  fieldBox(M, y, halfW, "CPF", data.clientCpf);
  y = fieldBox(M + halfW + 4, y, halfW, "TELEFONE", data.clientPhone);
  y = fieldBox(M, y, CW, "ENDEREÇO", data.clientAddress);

  y += 2;

  // ─── GARANTIA ───
  y = sectionBar(y, "GARANTIA");
  const thirdW = (CW - 8) / 3;
  fieldBox(M, y, thirdW, "PRAZO DE GARANTIA", `${data.warrantyDays} dias`);
  fieldBox(M + thirdW + 4, y, thirdW, "DATA DA VENDA", formatDate(data.saleDate));
  y = fieldBox(M + (thirdW + 4) * 2, y, thirdW, "VÁLIDA ATÉ", formatDate(data.validUntil));
  y = fieldBox(M, y, CW, "VENDEDOR RESPONSÁVEL", data.sellerName);

  y += 8;

  // ─── Signatures ───
  setDraw(BLACK);
  doc.setLineWidth(0.3);
  const sigW = 70;
  const sig1x = M + (CW / 2 - sigW) / 2;
  const sig2x = M + CW / 2 + (CW / 2 - sigW) / 2;
  doc.line(sig1x, y, sig1x + sigW, y);
  doc.line(sig2x, y, sig2x + sigW, y);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  setColor(DARK_GRAY);
  doc.text("Assinatura do Vendedor", sig1x + sigW / 2, y + 4, { align: "center" });
  doc.text("Assinatura do Cliente", sig2x + sigW / 2, y + 4, { align: "center" });

  // ─── Footer ───
  const footerY = 273;
  setFill(BLACK);
  doc.rect(0, footerY, W, 24, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  setColor(YELLOW);
  doc.text("Este certificado é válido mediante apresentação do documento.", W / 2, footerY + 6, { align: "center" });
  setColor(WHITE);
  doc.text("Garantia cobre defeitos de funcionamento. Não cobre danos físicos, líquidos ou mau uso.", W / 2, footerY + 11, { align: "center" });
  setColor(YELLOW);
  doc.text("Conectado Informática • São Paulo - SP", W / 2, footerY + 16, { align: "center" });

  // ═══════════════════ PAGE 2 ═══════════════════
  doc.addPage();

  // Top yellow stripe
  setFill(YELLOW);
  doc.rect(0, 0, W, 4, "F");

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  setColor(BLACK);
  doc.text("TERMOS E CONDIÇÕES DE GARANTIA", W / 2, 20, { align: "center" });

  setDraw(YELLOW);
  doc.setLineWidth(0.8);
  doc.line(M, 24, W - M, 24);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  setColor(DARK_GRAY);
  doc.text(`Certificado ${data.warrantyNumber} • ${data.equipmentName}`, W / 2, 30, { align: "center" });

  setFill(LIGHT_GRAY);
  doc.rect(0, 34, W, 239, "F");

  let y2 = 38;

  // ─── O QUE A GARANTIA COBRE ───
  y2 = sectionBar(y2, "O QUE A GARANTIA COBRE");
  const covers = [
    "Defeitos de fabricação nos componentes internos",
    "Falhas no processador, RAM e armazenamento",
    "Problemas na placa-mãe por uso normal",
    "Falhas na bateria com perda acima de 40% em até 30 dias",
    "Defeitos na tela (pixels mortos acima do tolerado)",
    "Problemas no teclado e trackpad por defeito",
    "Qualquer defeito comprovado não causado pelo usuário",
  ];
  doc.setFontSize(9);
  covers.forEach((item) => {
    doc.setFont("helvetica", "bold");
    setColor(GREEN);
    doc.text("✔", M + 4, y2 + 4);
    doc.setFont("helvetica", "normal");
    setColor(BLACK);
    doc.text(item, M + 12, y2 + 4);
    y2 += 7;
  });

  y2 += 4;

  // ─── O QUE A GARANTIA NÃO COBRE ───
  y2 = sectionBar(y2, "O QUE A GARANTIA NÃO COBRE", RED_DARK, WHITE);
  const notCovers = [
    "Danos físicos por quedas ou impactos",
    "Danos por líquidos",
    "Mau uso ou negligência",
    "Instalação de softwares, vírus ou alterações no sistema",
    "Desgaste natural de peças",
    "Variações de tensão elétrica",
    "Lacres violados ou abertura não autorizada",
    "Danos estéticos (arranhões, manchas)",
  ];
  doc.setFontSize(9);
  notCovers.forEach((item) => {
    doc.setFont("helvetica", "bold");
    setColor(RED);
    doc.text("✘", M + 4, y2 + 4);
    doc.setFont("helvetica", "normal");
    setColor(BLACK);
    doc.text(item, M + 12, y2 + 4);
    y2 += 7;
  });

  y2 += 4;

  // ─── COMO ACIONAR A GARANTIA ───
  y2 = sectionBar(y2, "COMO ACIONAR A GARANTIA");
  const steps = [
    "Entrar em contato com o vendedor apresentando este certificado",
    "Equipamento avaliado em até 5 dias úteis",
    "Defeito coberto será reparado ou substituído",
  ];
  doc.setFontSize(9);
  steps.forEach((item) => {
    doc.setFont("helvetica", "bold");
    setColor(BLUE);
    doc.text("→", M + 4, y2 + 4);
    doc.setFont("helvetica", "normal");
    setColor(BLACK);
    doc.text(item, M + 12, y2 + 4);
    y2 += 7;
  });

  // ─── Footer page 2 ───
  const footer2Y = 273;
  setFill(BLACK);
  doc.rect(0, footer2Y, W, 24, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  setColor(YELLOW);
  doc.text("Conectado Informática", W / 2, footer2Y + 6, { align: "center" });
  setColor(WHITE);
  doc.text(`Certificado ${data.warrantyNumber} • Válido até ${formatDate(data.validUntil)}`, W / 2, footer2Y + 11, { align: "center" });
  setColor(DARK_GRAY);
  doc.text("Este documento tem validade legal conforme legislação vigente.", W / 2, footer2Y + 16, { align: "center" });

  return doc;
}

// ─── Component ────────────────────────────────────────────

const WarrantyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [warranties, setWarranties] = useState<any[]>([]);

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientCpf, setClientCpf] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [warrantyDays, setWarrantyDays] = useState(90);
  const [processor, setProcessor] = useState("");
  const [ram, setRam] = useState("");
  const [storage, setStorage] = useState("");
  const [os, setOs] = useState("");

  const validUntil = addDays(saleDate, warrantyDays);

  // Load product + user + existing warranties
  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      const [prodRes, userRes, warRes] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase.auth.getUser(),
        supabase.from("warranties").select("*").eq("product_id", id).order("created_at", { ascending: false }),
      ]);

      if (prodRes.error || !prodRes.data) {
        toast.error("Produto não encontrado");
        navigate("/");
        return;
      }

      setProduct(prodRes.data);
      const specs = extractSpecs(prodRes.data.description);
      setProcessor(specs.processor);
      setRam(specs.ram);
      setStorage(specs.storage);
      setOs(specs.os);

      if (userRes.data.user?.email) {
        setSellerName(userRes.data.user.email);
      }

      if (warRes.data) setWarranties(warRes.data);
      setLoading(false);
    };

    loadData();
  }, [id, navigate]);

  const validate = () => {
    if (!clientName.trim()) { toast.error("Nome do cliente é obrigatório"); return false; }
    if (clientCpf.replace(/\D/g, "").length !== 11) { toast.error("CPF inválido"); return false; }
    if (clientPhone.replace(/\D/g, "").length < 10) { toast.error("Telefone inválido"); return false; }
    if (!clientAddress.trim()) { toast.error("Endereço é obrigatório"); return false; }
    if (!sellerName.trim()) { toast.error("Nome do vendedor é obrigatório"); return false; }
    return true;
  };

  const handleGenerate = async () => {
    if (!validate() || !product) return;
    setSaving(true);

    try {
      // Get warranty number
      const { data: numData, error: numErr } = await supabase.rpc("generate_warranty_number");
      if (numErr) throw numErr;
      const warrantyNumber = numData as string;

      const warrantyData = {
        warranty_number: warrantyNumber,
        product_id: product.id,
        user_id: (await supabase.auth.getUser()).data.user?.id || null,
        client_name: clientName,
        client_cpf: clientCpf,
        client_phone: clientPhone,
        client_address: clientAddress,
        seller_name: sellerName,
        sale_date: saleDate,
        warranty_days: warrantyDays,
        valid_until: validUntil,
        equipment_name: product.name,
        processor,
        ram,
        storage,
        os,
      };

      const { error } = await supabase.from("warranties").insert(warrantyData);
      if (error) throw error;

      // Generate and download PDF
      const doc = generateWarrantyPDF({
        warrantyNumber,
        equipmentName: product.name,
        processor,
        ram,
        storage,
        os,
        clientName,
        clientCpf,
        clientPhone,
        clientAddress,
        warrantyDays,
        saleDate,
        validUntil,
        sellerName,
      });

      doc.save(`Garantia_${warrantyNumber}.pdf`);
      toast.success("Garantia gerada com sucesso!");

      // Refresh list
      const { data: updated } = await supabase
        .from("warranties")
        .select("*")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false });
      if (updated) setWarranties(updated);

      // Reset client fields
      setClientName("");
      setClientCpf("");
      setClientPhone("");
      setClientAddress("");
    } catch (err: any) {
      toast.error("Erro ao gerar garantia: " + (err.message || "Erro desconhecido"));
    } finally {
      setSaving(false);
    }
  };

  const handleReprint = (w: any) => {
    const doc = generateWarrantyPDF({
      warrantyNumber: w.warranty_number,
      equipmentName: w.equipment_name,
      processor: w.processor,
      ram: w.ram,
      storage: w.storage,
      os: w.os,
      clientName: w.client_name,
      clientCpf: w.client_cpf,
      clientPhone: w.client_phone,
      clientAddress: w.client_address,
      warrantyDays: w.warranty_days,
      saleDate: w.sale_date,
      validUntil: w.valid_until,
      sellerName: w.seller_name,
    });
    doc.save(`Garantia_${w.warranty_number}.pdf`);
    toast.success("PDF baixado!");
  };

  const handlePrint = (w: any) => {
    const doc = generateWarrantyPDF({
      warrantyNumber: w.warranty_number,
      equipmentName: w.equipment_name,
      processor: w.processor,
      ram: w.ram,
      storage: w.storage,
      os: w.os,
      clientName: w.client_name,
      clientCpf: w.client_cpf,
      clientPhone: w.client_phone,
      clientAddress: w.client_address,
      warrantyDays: w.warranty_days,
      saleDate: w.sale_date,
      validUntil: w.valid_until,
      sellerName: w.seller_name,
    });
    const blobUrl = doc.output("bloburl");
    window.open(blobUrl as string, "_blank");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) return null;

  const dayOptions = [30, 60, 90, 180];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/products/${id}`)} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="truncate text-lg font-bold">Gerar Garantia</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6 animate-fade-up">
        {/* Product info */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Produto</p>
          <p className="font-bold text-foreground">{product.name}</p>
        </div>

        {/* Specs (auto-filled, editable) */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Especificações do Produto
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="processor">Processador</Label>
              <Input id="processor" value={processor} onChange={(e) => setProcessor(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ram">Memória RAM</Label>
              <Input id="ram" value={ram} onChange={(e) => setRam(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="storage">Armazenamento</Label>
              <Input id="storage" value={storage} onChange={(e) => setStorage(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="os">Sistema Operacional</Label>
              <Input id="os" value={os} onChange={(e) => setOs(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Client data */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Dados do Cliente
          </h3>
          <div>
            <Label htmlFor="clientName">Nome completo *</Label>
            <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nome completo do cliente" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="clientCpf">CPF *</Label>
              <Input id="clientCpf" value={clientCpf} onChange={(e) => setClientCpf(maskCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
            </div>
            <div>
              <Label htmlFor="clientPhone">Telefone *</Label>
              <Input id="clientPhone" value={clientPhone} onChange={(e) => setClientPhone(maskPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} />
            </div>
          </div>
          <div>
            <Label htmlFor="clientAddress">Endereço completo *</Label>
            <Input id="clientAddress" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Rua, número, complemento, bairro, cidade - UF" />
          </div>
        </div>

        {/* Sale data */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Dados da Venda
          </h3>
          <div>
            <Label htmlFor="sellerName">Vendedor *</Label>
            <Input id="sellerName" value={sellerName} onChange={(e) => setSellerName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="saleDate">Data da venda</Label>
              <Input id="saleDate" type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
            </div>
            <div>
              <Label>Prazo de garantia (dias)</Label>
              <div className="flex gap-2 mt-1">
                {dayOptions.map((d) => (
                  <Button
                    key={d}
                    type="button"
                    variant={warrantyDays === d ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWarrantyDays(d)}
                    className="active:scale-[0.97]"
                  >
                    {d}
                  </Button>
                ))}
                <Input
                  type="number"
                  value={warrantyDays}
                  onChange={(e) => setWarrantyDays(Number(e.target.value) || 0)}
                  className="w-20"
                  min={1}
                />
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              Válida até: <span className="font-semibold text-foreground">{formatDate(validUntil)}</span>
            </p>
          </div>
        </div>

        {/* Generate buttons */}
        <div className="flex gap-3">
          <Button onClick={handleGenerate} disabled={saving} className="flex-1 active:scale-[0.97]">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Gerar e Baixar PDF
          </Button>
        </div>

        {/* Existing warranties */}
        {warranties.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Garantias Geradas
            </h3>
            <div className="space-y-2">
              {warranties.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{w.warranty_number}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {w.client_name} • {formatDate(w.sale_date)}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => handleReprint(w)} title="Baixar PDF">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handlePrint(w)} title="Imprimir">
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WarrantyForm;
