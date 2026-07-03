import {
  UtensilsCrossed,
  ShoppingCart,
  Car,
  Home,
  Zap,
  Film,
  Heart,
  BookOpen,
  ShoppingBag,
  TrendingUp,
  Package,
  PawPrint,
  Plane,
  Gift,
  Laptop,
  Dumbbell,
  Baby,
  Sparkles,
  Shield,
  PiggyBank,
  Repeat,
  CreditCard,
  Users,
  Wine,
  Receipt,
  Hammer,
  type LucideIcon,
} from "lucide-react";
import { matchKeywordGroup } from "@/lib/utils/categories";

const ICONS: Record<string, LucideIcon> = {
  // Categorías del sistema (por slug)
  comida:          UtensilsCrossed,
  mercado:         ShoppingCart,
  transporte:      Car,
  hogar:           Home,
  servicios:       Zap,
  entretenimiento: Film,
  salud:           Heart,
  educacion:       BookOpen,
  compras:         ShoppingBag,
  ingreso:         TrendingUp,
  otros:           Package,
  // Grupos de palabras clave para categorías personalizadas (ver KEYWORD_ICON_GROUPS)
  mascotas:        PawPrint,
  viajes:          Plane,
  regalos:         Gift,
  tecnologia:      Laptop,
  deporte:         Dumbbell,
  ninos:           Baby,
  belleza:         Sparkles,
  seguros:         Shield,
  ahorro:          PiggyBank,
  suscripciones:   Repeat,
  carro:           Car,
  deuda:           CreditCard,
  familia:         Users,
  licores:         Wine,
  impuestos:       Receipt,
  "mejoras-hogar": Hammer,
};

interface CategoryIconProps {
  slug: string;
  /** Nombre de la categoría — si el slug no es de sistema, se usa para adivinar
   * un ícono relacionado por palabra clave (ver matchKeywordGroup). */
  name?: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export function CategoryIcon({ slug, name, size = 16, strokeWidth = 1.5, className, style }: CategoryIconProps) {
  const guessedId = name ? matchKeywordGroup(name)?.id : undefined;
  const Icon = ICONS[slug] ?? (guessedId ? ICONS[guessedId] : undefined) ?? Package;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} style={style} />;
}
