import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, Loader2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortablePhoto = ({ url, index, onRemove }: { url: string; index: number; onRemove: (i: number) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
      <img src={url} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 flex h-6 w-6 cursor-grab items-center justify-center rounded-full bg-foreground/70 text-background opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/70 text-background opacity-0 transition-opacity group-hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPhotos((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("available");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  // Spec fields
  const [processor, setProcessor] = useState("");
  const [ram, setRam] = useState("");
  const [storage, setStorage] = useState("");
  const [screen, setScreen] = useState("");
  const [gpu, setGpu] = useState("");
  const [battery, setBattery] = useState("");
  const [os, setOs] = useState("");
  const [connectivity, setConnectivity] = useState("");
  const [weight, setWeight] = useState("");
  const [condition, setCondition] = useState("");
  const [color, setColor] = useState("");

  useEffect(() => {
    if (isEditing && id) {
      supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            toast.error("Produto não encontrado");
            navigate("/");
            return;
          }
          setName(data.name);
          setDescription(data.description);
          setPrice(formatCurrency(String(data.price * 100)));
          setStatus(data.status);
          setPhotos(data.photos);
          // Load specs
          setProcessor((data as any).processor || "");
          setRam((data as any).ram || "");
          setStorage((data as any).storage || "");
          setScreen((data as any).screen || "");
          setGpu((data as any).gpu || "");
          setBattery((data as any).battery || "");
          setOs((data as any).os || "");
          setConnectivity((data as any).connectivity || "");
          setWeight((data as any).weight || "");
          setCondition((data as any).condition || "");
          setColor((data as any).color || "");
          setLoading(false);
        });
    }
  }, [id, isEditing, navigate]);

  const formatCurrency = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "");
    if (!digits) return "";
    const num = parseInt(digits, 10) / 100;
    return num.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(formatCurrency(e.target.value));
  };

  const parsePriceToNumber = (formatted: string): number => {
    if (!formatted) return 0;
    return parseFloat(formatted.replace(/\./g, "").replace(",", "."));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    const newPhotos: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-photos").upload(path, file);
      if (error) { toast.error(`Erro ao enviar ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from("product-photos").getPublicUrl(path);
      newPhotos.push(urlData.publicUrl);
    }
    setPhotos((prev) => [...prev, ...newPhotos]);
    setUploading(false);
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Nome do produto é obrigatório"); return; }
    setSaving(true);

    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: parsePriceToNumber(price),
      status,
      photos,
      processor: processor.trim(),
      ram: ram.trim(),
      storage: storage.trim(),
      screen: screen.trim(),
      gpu: gpu.trim(),
      battery: battery.trim(),
      os: os.trim(),
      connectivity: connectivity.trim(),
      weight: weight.trim(),
      condition,
      color: color.trim(),
    };

    if (isEditing && id) {
      const { error } = await supabase.from("products").update(productData).eq("id", id);
      if (error) { toast.error("Erro ao atualizar produto"); }
      else { toast.success("Produto atualizado!"); navigate(`/products/${id}`); }
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("products").insert({
        ...productData,
        user_id: userData.user?.id || null,
      });
      if (error) { toast.error("Erro ao cadastrar produto"); }
      else { toast.success("Produto cadastrado!"); navigate("/"); }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">{isEditing ? "Editar Produto" : "Novo Produto"}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photos */}
          <div className="space-y-2">
            <Label>
              Fotos do produto{" "}
              <span className="text-muted-foreground font-normal">(mínimo 5 · arraste para reordenar)</span>
            </Label>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={photos} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {photos.map((url, i) => (
                    <SortablePhoto key={url} url={url} index={i} onRemove={removePhoto} />
                  ))}
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 text-muted-foreground transition-colors hover:border-brand-yellow hover:text-foreground">
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        <span className="mt-1 text-[10px]">Adicionar</span>
                      </>
                    )}
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do produto</Label>
            <Input id="name" placeholder="Ex: Dell Latitude 7420 i5 16GB 512GB" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição detalhada</Label>
            <Textarea id="description" placeholder="Observações gerais, estado de conservação, detalhes adicionais..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>

          {/* Specs section */}
          <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Especificações Técnicas</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="processor">Processador</Label>
                <Input id="processor" placeholder="Ex: Intel Core i5-1145G7 11ª Geração" value={processor} onChange={(e) => setProcessor(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ram">Memória RAM</Label>
                <Input id="ram" placeholder="Ex: 16GB DDR4" value={ram} onChange={(e) => setRam(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage">Armazenamento</Label>
                <Input id="storage" placeholder="Ex: SSD NVMe 512GB" value={storage} onChange={(e) => setStorage(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="screen">Tela</Label>
                <Input id="screen" placeholder='Ex: 14" Full HD IPS' value={screen} onChange={(e) => setScreen(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gpu">Placa de vídeo <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <Input id="gpu" placeholder="Ex: Intel Iris Xe / NVIDIA GeForce MX450" value={gpu} onChange={(e) => setGpu(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="battery">Bateria</Label>
                <Input id="battery" placeholder="Ex: Duração aproximada de 6h" value={battery} onChange={(e) => setBattery(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="os">Sistema Operacional</Label>
                <Input id="os" placeholder="Ex: Windows 11 Pro" value={os} onChange={(e) => setOs(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="connectivity">Conectividade</Label>
                <Input id="connectivity" placeholder="Ex: Wi-Fi 6, Bluetooth 5.0, USB-C, HDMI" value={connectivity} onChange={(e) => setConnectivity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Peso</Label>
                <Input id="weight" placeholder="Ex: 1,4kg" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Cor</Label>
                <Input id="color" placeholder="Ex: Prata, Preto, Cinza" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Estado de conservação</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excelente">Excelente</SelectItem>
                  <SelectItem value="Bom">Bom</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Valor (R$)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input id="price" placeholder="0,00" value={price} onChange={handlePriceChange} className="pl-10 tabular-nums" />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="reserved">Reservado</SelectItem>
                <SelectItem value="sold">Vendido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-brand-dark text-brand-yellow hover:bg-foreground active:scale-[0.98] transition-all" disabled={saving}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ProductForm;
