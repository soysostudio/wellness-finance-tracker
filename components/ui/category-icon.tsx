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
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
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
};

interface CategoryIconProps {
  slug: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export function CategoryIcon({ slug, size = 16, strokeWidth = 1.5, className, style }: CategoryIconProps) {
  const Icon = ICONS[slug] ?? Package;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} style={style} />;
}
