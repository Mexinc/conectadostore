import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CATEGORIES, HOME_ITEM } from "@/lib/categories";
import { cn } from "@/lib/utils";

interface CategoryMenuProps {
  onNavigate?: () => void;
}

const CategoryMenu = ({ onNavigate }: CategoryMenuProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Detect active category/subcategory from URL: /catalogo/categoria/:cat/:sub?
  const segments = location.pathname.split("/").filter(Boolean);
  const isCategoryRoute = segments[0] === "catalogo" && segments[1] === "categoria";
  const activeCategory = isCategoryRoute ? segments[2] : null;
  const activeSubcategory = isCategoryRoute ? segments[3] ?? null : null;
  const isHome = location.pathname === "/catalogo";

  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const HomeIcon = HOME_ITEM.icon;

  return (
    <nav className="flex flex-col gap-1">
      <button
        onClick={() => go(HOME_ITEM.path)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isHome
            ? "bg-brand-yellow/15 text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <HomeIcon className="h-4 w-4" />
        {HOME_ITEM.label}
      </button>

      <Accordion type="multiple" defaultValue={activeCategory ? [activeCategory] : []} className="w-full">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <AccordionItem key={cat.key} value={cat.key} className="border-b-0">
              <div className="flex items-center">
                <button
                  onClick={() => go(`/catalogo/categoria/${cat.key}`)}
                  className={cn(
                    "flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
                    isActive && !activeSubcategory
                      ? "bg-brand-yellow/15 text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{cat.label}</span>
                </button>
                <AccordionTrigger className="px-2 py-0 hover:no-underline [&>svg]:h-4 [&>svg]:w-4" />
              </div>
              <AccordionContent className="pb-1 pl-9">
                <ul className="flex flex-col gap-0.5 border-l border-border pl-3">
                  {cat.subcategories.map((sub) => {
                    const subActive = isActive && activeSubcategory === sub.slug;
                    return (
                      <li key={sub.slug}>
                        <Link
                          to={`/catalogo/categoria/${cat.key}/${sub.slug}`}
                          onClick={() => onNavigate?.()}
                          className={cn(
                            "block rounded-md px-3 py-1.5 text-sm transition-colors",
                            subActive
                              ? "bg-brand-yellow/15 text-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {sub.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </nav>
  );
};

export default CategoryMenu;
