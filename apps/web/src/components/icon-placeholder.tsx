import * as React from "react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Icon placeholder component that renders lucide-react icons based on the icon name.
 * This component bridges the gap between UI component generators and actual icon implementations.
 */
interface IconPlaceholderProps extends React.SVGProps<SVGSVGElement> {
  /** Lucide icon name (e.g., "ChevronDownIcon") */
  lucide?: string;
  /** Tabler icon name (not implemented - uses lucide fallback) */
  tabler?: string;
  /** HugeIcons name (not implemented - uses lucide fallback) */
  hugeicons?: string;
  /** Phosphor icon name (not implemented - uses lucide fallback) */
  phosphor?: string;
  /** RemixIcon name (not implemented - uses lucide fallback) */
  remixicon?: string;
}

// Map of commonly used icon names to their lucide equivalents
const ICON_MAPPINGS: Record<string, string> = {
  // Common chevron/arrow icons
  IconChevronDown: "ChevronDown",
  IconChevronUp: "ChevronUp",
  IconChevronLeft: "ChevronLeft",
  IconChevronRight: "ChevronRight",
  ArrowDown01Icon: "ChevronDown",
  ArrowUp01Icon: "ChevronUp",
  CaretDownIcon: "ChevronDown",
  CaretUpIcon: "ChevronUp",
  RiArrowDownSLine: "ChevronDown",
  RiArrowUpSLine: "ChevronUp",
  RiArrowLeftSLine: "ChevronLeft",
  RiArrowRightSLine: "ChevronRight",
  
  // Check/circle icons
  IconCheck: "Check",
  IconCircle: "Circle",
  CheckIcon: "Check",
  CircleIcon: "Circle",
  Tick02Icon: "Check",
  RiCheckLine: "Check",
  
  // Close/X icons
  IconX: "X",
  Cancel01Icon: "X",
  XIcon: "X",
  RiCloseLine: "X",
  
  // Search icons
  IconSearch: "Search",
  Search01Icon: "Search",
  MagnifyingGlassIcon: "Search",
  RiSearchLine: "Search",
  
  // More/dots icons
  IconDotsHorizontal: "MoreHorizontal",
  MoreHorizontalIcon: "MoreHorizontal",
  DotsHorizontalIcon: "MoreHorizontal",
  
  // Minus icon
  IconMinus: "Minus",
  MinusSignIcon: "Minus",
  MinusIcon: "Minus",
  RiSubtractLine: "Minus",
  
  // Ellipsis
  IconDots: "Ellipsis",
  MoreHorizontalCircle01Icon: "Ellipsis",
  DotsThreeIcon: "Ellipsis",
  RiMore2Line: "Ellipsis",
  
  // Loader
  IconLoader2: "Loader2",
  Loading03Icon: "Loader2",
  CircleNotchIcon: "Loader2",
  RiLoader4Line: "Loader2",
};

function normalizeIconName(name: string): string {
  // Check if we have a direct mapping
  if (ICON_MAPPINGS[name]) {
    return ICON_MAPPINGS[name];
  }
  
  // Try to normalize the name to lucide format
  // Remove "Icon" suffix if present
  let normalized = name.replace(/Icon$/, "");
  // Remove common prefixes
  normalized = normalized.replace(/^(Ri|Icon|Hugeicons)/, "");
  // Remove "Line" suffix from Remix icons
  normalized = normalized.replace(/Line$/, "");
  // Remove "S" suffix from some icons
  normalized = normalized.replace(/S$/, "");
  
  return normalized;
}

export function IconPlaceholder({
  lucide,
  tabler,
  hugeicons,
  phosphor,
  remixicon,
  className,
  ...props
}: IconPlaceholderProps) {
  // Priority: lucide > tabler > hugeicons > phosphor > remixicon
  const iconName = lucide || tabler || hugeicons || phosphor || remixicon;
  
  if (!iconName) {
    return null;
  }
  
  // Normalize the icon name
  const normalizedName = normalizeIconName(iconName);
  
  // Try to find the icon in lucide-react
  const IconComponent = (LucideIcons as unknown as Record<string, React.FC<React.SVGProps<SVGSVGElement>>>)[normalizedName];
  
  if (!IconComponent) {
    // Fallback: try with "Icon" suffix removed or added
    const alternativeName = normalizedName.endsWith("Icon") 
      ? normalizedName.replace(/Icon$/, "") 
      : `${normalizedName}Icon`;
    const AltIconComponent = (LucideIcons as unknown as Record<string, React.FC<React.SVGProps<SVGSVGElement>>>)[alternativeName];
    
    if (AltIconComponent) {
      return <AltIconComponent className={cn("size-4", className)} {...props} />;
    }
    
    // If still not found, render nothing (or could render a placeholder)
    console.warn(`IconPlaceholder: Icon "${iconName}" (normalized: "${normalizedName}") not found in lucide-react`);
    return null;
  }
  
  return <IconComponent className={cn("size-4", className)} {...props} />;
}

export default IconPlaceholder;
