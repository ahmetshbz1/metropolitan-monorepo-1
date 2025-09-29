import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// Hook to detect mobile screen size
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
};

// Theme and language options
const THEME_OPTIONS = [
  {
    value: "light",
    icon: "solar:sun-line-duotone",
    labelKey: "dropdown.light_theme",
  },
  {
    value: "dark",
    icon: "solar:moon-line-duotone",
    labelKey: "dropdown.dark_theme",
  },
  {
    value: "system",
    icon: "solar:monitor-line-duotone",
    labelKey: "dropdown.system_theme",
  },
];

const LANGUAGE_OPTIONS = [
  {
    value: "tr",
    icon: "solar:global-line-duotone",
    labelKey: "dropdown.turkish",
  },
  {
    value: "en",
    icon: "solar:global-line-duotone",
    labelKey: "dropdown.english",
  },
  {
    value: "pl",
    icon: "solar:global-line-duotone",
    labelKey: "dropdown.polish",
  },
];

interface UserDropdownProps {
  user?: {
    name: string;
    username: string;
    email: string;
    avatar: string;
    initials: string;
    isGuest: boolean;
    userType?: "individual" | "corporate";
  };
  onAction?: (action: string, route?: string) => void;
  onLogin?: () => void;
}

export const UserDropdown = ({
  user = {
    name: "Misafir",
    username: "",
    email: "",
    avatar: "",
    initials: "M",
    isGuest: true,
  },
  onAction,
  onLogin,
}: UserDropdownProps) => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const MENU_ITEMS = {
    account: [
      {
        icon: "solar:heart-line-duotone",
        labelKey: "dropdown.favorites",
        action: "favorites",
        route: "/favorites",
      },
      {
        icon: "solar:map-point-line-duotone",
        labelKey: "dropdown.addresses",
        action: "addresses",
        route: "/addresses",
      },
    ],
    settings: [
      {
        icon: "solar:user-circle-line-duotone",
        labelKey: "dropdown.account_settings",
        action: "account-settings",
        route: "/account-settings",
      },
      {
        icon: "solar:palette-line-duotone",
        labelKey: "dropdown.app_settings",
        action: "app-settings",
        route: "/app-settings",
      },
    ],
    support: [
      {
        icon: "solar:question-circle-line-duotone",
        labelKey: "dropdown.help_center",
        action: "help",
        route: "/support",
      },
      {
        icon: "solar:document-text-line-duotone",
        labelKey: "dropdown.legal",
        action: "legal",
        route: "/legal",
      },
    ],
    auth: [
      {
        icon: "solar:logout-2-bold-duotone",
        labelKey: "dropdown.logout",
        action: "logout",
        danger: true,
      },
    ],
  };
  const renderMenuItem = (item, index) => (
    <DropdownMenuItem
      key={index}
      className={cn(
        "p-2 rounded-lg cursor-pointer transition-colors font-medium",
        item.danger ? "text-red-600 dark:text-red-400" : ""
      )}
      onClick={() => onAction?.(item.action, item.route)}
    >
      <span className="flex items-center gap-2">
        <Icon
          icon={item.icon}
          className={cn(
            "size-4",
            item.danger
              ? "text-red-600 dark:text-red-400"
              : "text-gray-500 dark:text-gray-400"
          )}
        />
        <span className="text-sm">
          {item.labelKey ? t(item.labelKey) : item.label}
        </span>
      </span>
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
              {user.avatar ? (
                <Avatar className="size-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-transparent">
                    <Icon
                      icon="solar:user-bold-duotone"
                      className="size-6 text-primary"
                    />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Icon
                  icon="solar:user-bold-duotone"
                  className="size-6 text-primary"
                />
              )}
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent className="hidden md:block">
          <p>{user.isGuest ? "Misafir hesabi" : "Profil menusu"}</p>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        className="w-80 sm:w-72 md:w-80 rounded-2xl p-2 max-w-[calc(100vw-2rem)]"
        align="end"
        alignOffset={-16}
        sideOffset={8}
        avoidCollisions={true}
        collisionPadding={16}
      >
        {/* User Header */}
        <div className="flex items-center p-3 mb-2">
          <div className="flex-1 flex items-center gap-3">
            {user.avatar ? (
              <Avatar className="size-10">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary/20">
                  <Icon
                    icon="solar:user-bold-duotone"
                    className="size-6 text-primary"
                  />
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Icon
                  icon="solar:user-bold-duotone"
                  className="size-6 text-primary"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {user.name}
                </h3>
                {!user.isGuest && user.userType && (
                  <Badge
                    variant="default"
                    className="text-xs px-2 py-0 h-5"
                  >
                    {user.userType === "corporate" ? "Kurumsal" : "Bireysel"}
                  </Badge>
                )}
              </div>
              {user.username && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.username}
                </p>
              )}
              {user.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {user.isGuest ? (
          /* Guest User - Login Button */
          <DropdownMenuItem
            className="p-2 rounded-lg cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary font-medium"
            onClick={() => onLogin?.()}
          >
            <span className="flex items-center gap-2">
              <Icon
                icon="solar:login-2-line-duotone"
                className="size-4 text-primary"
              />
              <span className="text-sm">{t("dropdown.login")}</span>
            </span>
          </DropdownMenuItem>
        ) : (
          /* Logged In User - Menu Items */
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {MENU_ITEMS.account.map(renderMenuItem)}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {MENU_ITEMS.settings.map(renderMenuItem)}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {MENU_ITEMS.support.map(renderMenuItem)}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {MENU_ITEMS.auth.map(renderMenuItem)}
            </DropdownMenuGroup>
          </>
        )}

        {/* Theme and Language Settings - Available for all users */}
        <DropdownMenuSeparator />

        {/* Theme Selection */}
        <DropdownMenuGroup>
          {isMobile ? (
            // Mobile: Inline theme options
            <>
              <DropdownMenuItem
                className="p-2 rounded-lg cursor-pointer hover:bg-accent focus:bg-accent transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowThemeOptions(!showThemeOptions);
                }}
                onSelect={(e) => e.preventDefault()}
              >
                <span className="flex items-center gap-2 justify-between w-full">
                  <span className="flex items-center gap-2">
                    <Icon
                      icon={
                        mounted && theme === "dark"
                          ? "solar:moon-line-duotone"
                          : "solar:sun-line-duotone"
                      }
                      className="size-4 text-gray-500 dark:text-gray-400"
                    />
                    <span className="text-sm">{t("dropdown.theme")}</span>
                  </span>
                  <Icon
                    icon={
                      showThemeOptions
                        ? "solar:alt-arrow-up-line-duotone"
                        : "solar:alt-arrow-down-line-duotone"
                    }
                    className="size-4 text-gray-500 dark:text-gray-400"
                  />
                </span>
              </DropdownMenuItem>
              {showThemeOptions && (
                <div className="ml-6 mb-3 space-y-2 mt-2">
                  {THEME_OPTIONS.map((themeOption) => (
                    <DropdownMenuItem
                      key={themeOption.value}
                      className={cn(
                        "gap-2 p-2.5 cursor-pointer rounded-md transition-colors hover:bg-accent/50",
                        theme === themeOption.value ? "bg-accent" : ""
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTheme(themeOption.value);
                        setShowThemeOptions(false);
                      }}
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Icon
                        icon={themeOption.icon}
                        className="size-4 text-gray-500 dark:text-gray-400"
                      />
                      <span className="text-sm">{t(themeOption.labelKey)}</span>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Desktop: Submenu
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="p-2 rounded-lg cursor-pointer hover:bg-accent focus:bg-accent transition-colors">
                <span className="flex items-center gap-2">
                  <Icon
                    icon={
                      mounted && theme === "dark"
                        ? "solar:moon-line-duotone"
                        : "solar:sun-line-duotone"
                    }
                    className="size-4 text-gray-500 dark:text-gray-400"
                  />
                  <span className="text-sm">{t("dropdown.theme")}</span>
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent
                  className="w-52"
                  side="left"
                  align="start"
                  sideOffset={8}
                  alignOffset={-4}
                  avoidCollisions={true}
                  collisionPadding={16}
                >
                  <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={setTheme}
                  >
                    {THEME_OPTIONS.map((themeOption) => (
                      <DropdownMenuRadioItem
                        key={themeOption.value}
                        value={themeOption.value}
                        className="gap-2 p-1.5"
                      >
                        <Icon
                          icon={themeOption.icon}
                          className="size-4 text-gray-500 dark:text-gray-400"
                        />
                        <span className="text-sm">
                          {t(themeOption.labelKey)}
                        </span>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          )}
        </DropdownMenuGroup>

        {/* Language Selection */}
        <DropdownMenuGroup>
          {isMobile ? (
            // Mobile: Inline language options
            <>
              <DropdownMenuItem
                className="p-2 rounded-lg cursor-pointer hover:bg-accent focus:bg-accent transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLanguageOptions(!showLanguageOptions);
                }}
                onSelect={(e) => e.preventDefault()}
              >
                <span className="flex items-center gap-2 justify-between w-full">
                  <span className="flex items-center gap-2">
                    <Icon
                      icon={
                        LANGUAGE_OPTIONS.find(
                          (lang) => lang.value === i18n.language
                        )?.icon || "solar:global-line-duotone"
                      }
                      className="size-4 text-gray-500 dark:text-gray-400"
                    />
                    <span className="text-sm">{t("dropdown.language")}</span>
                  </span>
                  <Icon
                    icon={
                      showLanguageOptions
                        ? "solar:alt-arrow-up-line-duotone"
                        : "solar:alt-arrow-down-line-duotone"
                    }
                    className="size-4 text-gray-500 dark:text-gray-400"
                  />
                </span>
              </DropdownMenuItem>
              {showLanguageOptions && (
                <div className="ml-6 mb-3 space-y-2 mt-2">
                  {LANGUAGE_OPTIONS.map((langOption) => (
                    <DropdownMenuItem
                      key={langOption.value}
                      className={cn(
                        "gap-2 p-2.5 cursor-pointer rounded-md transition-colors hover:bg-accent/50",
                        i18n.language === langOption.value ? "bg-accent" : ""
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        i18n.changeLanguage(langOption.value);
                        setShowLanguageOptions(false);
                      }}
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Icon
                        icon={langOption.icon}
                        className="size-4 text-gray-500 dark:text-gray-400"
                      />
                      <span className="text-sm">{t(langOption.labelKey)}</span>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Desktop: Submenu
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="p-2 rounded-lg cursor-pointer hover:bg-accent focus:bg-accent transition-colors">
                <span className="flex items-center gap-2">
                  <Icon
                    icon={
                      LANGUAGE_OPTIONS.find(
                        (lang) => lang.value === i18n.language
                      )?.icon || "solar:global-line-duotone"
                    }
                    className="size-4 text-gray-500 dark:text-gray-400"
                  />
                  <span className="text-sm">{t("dropdown.language")}</span>
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent
                  className="w-52"
                  side="left"
                  align="start"
                  sideOffset={8}
                  alignOffset={-4}
                  avoidCollisions={true}
                  collisionPadding={16}
                >
                  <DropdownMenuRadioGroup
                    value={i18n.language}
                    onValueChange={(lang) => i18n.changeLanguage(lang)}
                  >
                    {LANGUAGE_OPTIONS.map((langOption) => (
                      <DropdownMenuRadioItem
                        key={langOption.value}
                        value={langOption.value}
                        className="gap-2 p-1.5"
                      >
                        <Icon
                          icon={langOption.icon}
                          className="size-4 text-gray-500 dark:text-gray-400"
                        />
                        <span className="text-sm">
                          {t(langOption.labelKey)}
                        </span>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
