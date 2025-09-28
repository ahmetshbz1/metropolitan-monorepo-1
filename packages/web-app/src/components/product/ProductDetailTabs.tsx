"use client";

import { Product } from "@metropolitan/shared";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  AlertTriangle,
  AppleIcon,
  AwardIcon,
  Building2,
  ChevronDown,
  InfoIcon,
  Snowflake,
} from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

interface ProductDetailTabsProps {
  product: Product;
}

interface TabConfig {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  hidden: boolean;
  content: ReactNode;
}

const BADGE_STYLES: Record<
  keyof NonNullable<Product["badges"]>,
  { labelKey: string; dotClass: string; chipClass: string }
> = {
  halal: {
    labelKey: "product.halal",
    dotClass: "bg-emerald-500",
    chipClass:
      "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-100",
  },
  vegetarian: {
    labelKey: "product.vegetarian",
    dotClass: "bg-lime-500",
    chipClass:
      "bg-lime-100/80 text-lime-700 dark:bg-lime-500/10 dark:text-lime-100",
  },
  vegan: {
    labelKey: "product.vegan",
    dotClass: "bg-green-500",
    chipClass:
      "bg-green-100/80 text-green-700 dark:bg-green-500/10 dark:text-green-100",
  },
  glutenFree: {
    labelKey: "product.gluten_free",
    dotClass: "bg-amber-500",
    chipClass:
      "bg-amber-100/80 text-amber-700 dark:bg-amber-500/10 dark:text-amber-100",
  },
  organic: {
    labelKey: "product.organic",
    dotClass: "bg-orange-500",
    chipClass:
      "bg-orange-100/80 text-orange-700 dark:bg-orange-500/10 dark:text-orange-100",
  },
  lactoseFree: {
    labelKey: "product.lactose_free",
    dotClass: "bg-indigo-500",
    chipClass:
      "bg-indigo-100/80 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-100",
  },
};

const ProductDetailTabs = ({ product }: ProductDetailTabsProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("general");
  const [isManufacturerOpen, setIsManufacturerOpen] = useState<boolean>(false);

  const hasBadges =
    !!product.badges && Object.values(product.badges).some(Boolean);

  const nutritionalEntries = [
    {
      key: "energy",
      label: t("product.energy"),
      value: product.nutritionalValues?.energy,
    },
    {
      key: "fat",
      label: t("product.fat"),
      value: product.nutritionalValues?.fat,
    },
    {
      key: "saturatedFat",
      label: t("product.saturated_fat"),
      value: product.nutritionalValues?.saturatedFat,
    },
    {
      key: "carbohydrates",
      label: t("product.carbohydrates"),
      value: product.nutritionalValues?.carbohydrates,
    },
    {
      key: "sugar",
      label: t("product.sugar"),
      value: product.nutritionalValues?.sugar,
    },
    {
      key: "protein",
      label: t("product.protein"),
      value: product.nutritionalValues?.protein,
    },
    {
      key: "salt",
      label: t("product.salt"),
      value: product.nutritionalValues?.salt,
    },
  ];

  const hasNutritionalValues = nutritionalEntries.some(
    (entry) => !!entry.value
  );

  const manufacturerInfo = product.manufacturerInfo;

  const statisticRow = (
    label: string,
    value: ReactNode,
    options?: { alignTop?: boolean }
  ) => (
    <div
      className={cn(
        "flex flex-col gap-1 px-5 py-4 sm:flex-row",
        options?.alignTop ? "sm:items-start" : "sm:items-center"
      )}
    >
      <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground sm:w-40">
        {label}
      </dt>
      <dd className="text-sm text-foreground sm:flex-1">{value}</dd>
    </div>
  );

  const tabs: TabConfig[] = [
    {
      id: "general",
      label: t("product.general_info"),
      icon: InfoIcon,
      hidden: false,
      content: (
        <>
          {product.description && (
            <section className="rounded-2xl border border-border/30 bg-card p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("product.description")}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-border/30 bg-card shadow-sm">
            <header className="flex items-center gap-2 bg-primary/10 px-5 py-4 text-primary">
              <InfoIcon className="h-4 w-4" />
              <span className="text-sm font-semibold">
                {t("product.general_info")}
              </span>
            </header>
            <dl className="divide-y divide-border/40">
              {statisticRow(t("product.brand"), product.brand)}
              {product.netQuantity &&
                statisticRow(t("product.net_quantity"), product.netQuantity)}
              {product.originCountry &&
                statisticRow(
                  t("product.origin_country"),
                  product.originCountry
                )}
              {product.expiryDate &&
                statisticRow(
                  t("product.expiry_date"),
                  new Date(product.expiryDate).toLocaleDateString("tr-TR")
                )}
            </dl>
          </section>

          {manufacturerInfo && (
            <section className="overflow-hidden rounded-2xl border border-border/30 bg-card shadow-sm">
              <button
                onClick={() => setIsManufacturerOpen(!isManufacturerOpen)}
                className="flex w-full items-center gap-2 bg-primary/10 px-5 py-4 text-primary hover:bg-primary/15 transition-colors"
              >
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  {t("product.manufacturer_info", "Üretici Bilgileri")}
                </span>
                <ChevronDown
                  className={cn(
                    "ml-auto h-4 w-4 transition-transform duration-200",
                    isManufacturerOpen && "rotate-180"
                  )}
                />
              </button>
              <AnimatePresence>
                {isManufacturerOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <dl className="divide-y divide-border/40">
                      {manufacturerInfo.name &&
                        statisticRow(
                          t("product.manufacturer_name", "Üretici"),
                          manufacturerInfo.name
                        )}
                      {manufacturerInfo.address &&
                        statisticRow(
                          t("product.manufacturer_address", "Adres"),
                          manufacturerInfo.address,
                          { alignTop: true }
                        )}
                      {manufacturerInfo.phone &&
                        statisticRow(
                          t("product.manufacturer_phone", "Telefon"),
                          manufacturerInfo.phone
                        )}
                      {manufacturerInfo.email &&
                        statisticRow(
                          t("product.manufacturer_email", "E-posta"),
                          manufacturerInfo.email
                        )}
                    </dl>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}
        </>
      ),
    },
    {
      id: "nutrition",
      label: t("product.nutritional_values"),
      icon: AppleIcon,
      hidden: !hasNutritionalValues,
      content: (
        <section className="overflow-hidden rounded-2xl border border-border/30 bg-card shadow-sm">
          <header className="flex items-center gap-2 bg-primary/10 px-5 py-4 text-primary">
            <AppleIcon className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {t("product.nutritional_values")}
            </span>
            <span className="ml-auto text-xs font-semibold uppercase tracking-wide text-primary/80">
              {t("product.per_100g")}
            </span>
          </header>
          <dl className="divide-y divide-border/40">
            {nutritionalEntries
              .filter((entry) => !!entry.value)
              .map((entry) => (
                <div
                  key={entry.key}
                  className="flex items-center justify-between px-5 py-3 text-sm"
                >
                  <dt className="text-muted-foreground">{entry.label}</dt>
                  <dd className="font-semibold text-foreground">
                    {entry.value}
                  </dd>
                </div>
              ))}
          </dl>
        </section>
      ),
    },
    {
      id: "allergens",
      label: t("product.allergens"),
      icon: AlertTriangle,
      hidden: !product.allergens,
      content: (
        <section className="rounded-2xl border border-amber-200/60 bg-amber-50 p-5 text-amber-800 shadow-sm dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <h3 className="text-sm font-semibold">
                {t("product.allergens")}
              </h3>
              <p className="mt-3 text-sm leading-relaxed">
                {product.allergens}
              </p>
            </div>
          </div>
        </section>
      ),
    },
    {
      id: "storage",
      label: t("product.storage_conditions"),
      icon: Snowflake,
      hidden: !product.storageConditions,
      content: (
        <section className="rounded-2xl border border-border/30 bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3 text-muted-foreground">
            <Snowflake className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t("product.storage_conditions")}
              </h3>
              <p className="mt-3 text-sm leading-relaxed">
                {product.storageConditions}
              </p>
            </div>
          </div>
        </section>
      ),
    },
    {
      id: "certificates",
      label: t("product.certificates"),
      icon: AwardIcon,
      hidden: !hasBadges,
      content: (
        <section className="rounded-2xl border border-border/30 bg-card p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            {product.badges &&
              (
                Object.keys(product.badges) as Array<
                  keyof typeof product.badges
                >
              )
                .filter((badgeKey) => !!product.badges?.[badgeKey])
                .map((badgeKey) => {
                  const badgeStyle = BADGE_STYLES[badgeKey];
                  return (
                    <div
                      key={badgeKey}
                      className={cn(
                        "flex items-center gap-3 rounded-full px-4 py-2",
                        badgeStyle.chipClass
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          badgeStyle.dotClass
                        )}
                      />
                      <span className="text-sm font-semibold">
                        {t(badgeStyle.labelKey)}
                      </span>
                    </div>
                  );
                })}
          </div>
        </section>
      ),
    },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.hidden);
  if (visibleTabs.length === 0) {
    return null;
  }

  const activeTabConfig =
    visibleTabs.find((tab) => tab.id === activeTab) ?? visibleTabs[0];
  const ActiveIcon = activeTabConfig.icon;

  return (
    <LayoutGroup id="product-detail-tabs">
      <div className="mt-10">
        <div className="flex flex-col gap-6">
          <div className="flex w-full items-center gap-2 overflow-x-auto rounded-2xl border border-primary/20 bg-primary/5 p-1">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTabConfig.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    isActive
                      ? "text-primary-foreground"
                      : "text-primary/70 hover:text-primary"
                  )}
                  aria-pressed={isActive}
                >
                  {isActive && (
                    <motion.span
                      layoutId="active-tab-highlight"
                      className="absolute inset-0 rounded-xl bg-primary shadow-lg shadow-primary/30"
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 26,
                      }}
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10 whitespace-nowrap">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTabConfig.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full"
            >
              <div className="rounded-3xl border border-border/30 bg-card p-6 shadow-lg shadow-primary/5 min-h-[400px]">
                <div className="mb-4 flex items-center gap-3 text-primary">
                  <ActiveIcon className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-wide">
                    {activeTabConfig.label}
                  </span>
                </div>
                <div className="space-y-5">{activeTabConfig.content}</div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </LayoutGroup>
  );
};

export default ProductDetailTabs;
