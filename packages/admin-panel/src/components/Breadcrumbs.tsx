import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  key?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate?: (key: string) => void;
}

export const Breadcrumbs = ({ items, onNavigate }: BreadcrumbsProps) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onNavigate?.("dashboard")}
        className="flex items-center gap-1.5 text-xs text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        aria-label="Ana sayfa"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Ana Sayfa</span>
      </button>
      {items.map((item, index) => (
        <div key={item.key ?? index} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
          {item.key && index < items.length - 1 ? (
            <button
              type="button"
              onClick={() => onNavigate?.(item.key!)}
              className="text-xs text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-xs font-medium text-slate-900 dark:text-white">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};
