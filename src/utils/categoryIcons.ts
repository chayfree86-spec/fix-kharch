import React from 'react';
import {
  UsersRound,
  Landmark,
  Store,
  ReceiptText,
  Truck,
  Utensils,
  Tag,
  Wrench,
  ShoppingBag,
  Wallet,
  ShieldCheck,
  Layers,
  Coffee,
  Package,
  FileText,
  Percent,
  Zap,
  Flame,
  CreditCard,
  Building2,
  FolderMinus,
} from 'lucide-react';

export const AVAILABLE_ICONS = [
  { id: 'users', label: 'Staff / Team', icon: UsersRound },
  { id: 'landmark', label: 'Bank / Loan', icon: Landmark },
  { id: 'store', label: 'Shop / Outlet', icon: Store },
  { id: 'receipt', label: 'Receipt / Bill', icon: ReceiptText },
  { id: 'truck', label: 'Transport / Delivery', icon: Truck },
  { id: 'utensils', label: 'Kitchen / Food', icon: Utensils },
  { id: 'coffee', label: 'Café / Coffee', icon: Coffee },
  { id: 'package', label: 'Supplies / Inventory', icon: Package },
  { id: 'shopping-bag', label: 'Purchases', icon: ShoppingBag },
  { id: 'wrench', label: 'Maintenance / Repair', icon: Wrench },
  { id: 'wallet', label: 'Cash / Wallet', icon: Wallet },
  { id: 'credit-card', label: 'Card / POS', icon: CreditCard },
  { id: 'building', label: 'Property / Rent', icon: Building2 },
  { id: 'zap', label: 'Electricity / Power', icon: Zap },
  { id: 'flame', label: 'Gas / Fuel', icon: Flame },
  { id: 'percent', label: 'Tax / GST', icon: Percent },
  { id: 'shield', label: 'Insurance / Legal', icon: ShieldCheck },
  { id: 'tag', label: 'Marketing / Promo', icon: Tag },
  { id: 'file-text', label: 'Contract / Legal', icon: FileText },
  { id: 'layers', label: 'Other Overhead', icon: Layers },
];

export function getCategoryIconComponent(iconName: string): React.FC<{ className?: string }> {
  const match = AVAILABLE_ICONS.find(i => i.id === iconName);
  if (match) return match.icon;

  // Fallbacks for standard names
  switch (iconName) {
    case 'users':
      return UsersRound;
    case 'landmark':
      return Landmark;
    case 'store':
      return Store;
    case 'receipt':
      return ReceiptText;
    default:
      return FolderMinus;
  }
}
