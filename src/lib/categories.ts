import {
  Home,
  Apple,
  Laptop,
  Monitor,
  Printer,
  Droplet,
  Mouse,
  type LucideIcon,
} from "lucide-react";

export type CategoryKey = "apple" | "notebook" | "desktop" | "printer" | "supply" | "accessory";

export interface SubcategoryConfig {
  slug: string;
  label: string;
}

export interface CategoryConfig {
  key: CategoryKey;
  label: string;
  icon: LucideIcon;
  subcategories: SubcategoryConfig[];
}

export const CATEGORIES: CategoryConfig[] = [
  {
    key: "apple",
    label: "Apple",
    icon: Apple,
    subcategories: [
      { slug: "iphone", label: "iPhone" },
      { slug: "macbook", label: "MacBook" },
      { slug: "ipad", label: "iPad" },
      { slug: "acessorios-apple", label: "Acessórios Apple" },
    ],
  },
  {
    key: "notebook",
    label: "Notebooks",
    icon: Laptop,
    subcategories: [
      { slug: "dell", label: "Dell" },
      { slug: "lenovo", label: "Lenovo" },
      { slug: "samsung", label: "Samsung" },
      { slug: "asus", label: "Asus" },
      { slug: "acer", label: "Acer" },
      { slug: "hp", label: "HP" },
      { slug: "gamer", label: "Gamer" },
      { slug: "empresarial", label: "Empresarial" },
      { slug: "seminovos", label: "Seminovos" },
    ],
  },
  {
    key: "desktop",
    label: "Computadores",
    icon: Monitor,
    subcategories: [
      { slug: "desktop", label: "Desktop" },
      { slug: "pc-gamer", label: "PC Gamer" },
      { slug: "all-in-one", label: "All in One" },
      { slug: "workstation", label: "Workstation" },
    ],
  },
  {
    key: "printer",
    label: "Impressoras",
    icon: Printer,
    subcategories: [
      { slug: "epson", label: "Epson" },
      { slug: "brother", label: "Brother" },
      { slug: "hp", label: "HP" },
      { slug: "lexmark", label: "Lexmark" },
      { slug: "canon", label: "Canon" },
      { slug: "tanque-de-tinta", label: "Tanque de tinta" },
      { slug: "laser", label: "Laser" },
      { slug: "multifuncional", label: "Multifuncional" },
    ],
  },
  {
    key: "supply",
    label: "Suprimentos",
    icon: Droplet,
    subcategories: [
      { slug: "tintas", label: "Tintas" },
      { slug: "toners", label: "Toners" },
      { slug: "cartuchos", label: "Cartuchos" },
    ],
  },
  {
    key: "accessory",
    label: "Acessórios",
    icon: Mouse,
    subcategories: [
      { slug: "mouse", label: "Mouse" },
      { slug: "teclado", label: "Teclado" },
      { slug: "headset", label: "Headset" },
      { slug: "webcam", label: "Webcam" },
      { slug: "ssd", label: "SSD" },
      { slug: "hd", label: "HD" },
      { slug: "memoria-ram", label: "Memória RAM" },
      { slug: "cabos", label: "Cabos" },
      { slug: "adaptadores", label: "Adaptadores" },
      { slug: "carregadores", label: "Carregadores" },
    ],
  },
];

export const HOME_ITEM = { label: "Início", icon: Home, path: "/catalogo" };

export const getCategory = (key: string): CategoryConfig | undefined =>
  CATEGORIES.find((c) => c.key === key);

export const getSubcategory = (categoryKey: string, slug: string): SubcategoryConfig | undefined =>
  getCategory(categoryKey)?.subcategories.find((s) => s.slug === slug);

export const getCategoryLabel = (key: string): string => getCategory(key)?.label ?? key;

export const getSubcategoryLabel = (categoryKey: string, slug: string): string =>
  getSubcategory(categoryKey, slug)?.label ?? slug;

/** Common notebook/desktop brands surfaced as filter options. */
export const COMMON_BRANDS = [
  "Apple",
  "Dell",
  "Lenovo",
  "Samsung",
  "Asus",
  "Acer",
  "HP",
  "Epson",
  "Brother",
  "Canon",
  "Lexmark",
  "Logitech",
  "Outro",
];

export const CONDITIONS = [
  { value: "Novo", label: "Novo" },
  { value: "Seminovo", label: "Seminovo" },
  { value: "Usado", label: "Usado" },
  { value: "Excelente", label: "Excelente" },
  { value: "Bom", label: "Bom" },
  { value: "Regular", label: "Regular" },
];
