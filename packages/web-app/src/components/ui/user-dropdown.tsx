import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export const UserDropdown = ({
  user = {
    name: "Misafir",
    username: "",
    email: "",
    avatar: "",
    initials: "M",
    isGuest: true,
  },
  onAction = () => {},
  onLogin = () => {},
}) => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
      {
        icon: "solar:bell-line-duotone",
        labelKey: "dropdown.notifications",
        action: "notifications",
        route: "/notifications",
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
      onClick={() => onAction(item.action, item.route)}
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
                  <AvatarFallback className="text-xs">
                    {user.initials}
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

      <DropdownMenuContent className="w-72 rounded-2xl p-2" align="end">
        {/* User Header */}
        <div className="flex items-center p-3 mb-2">
          <div className="flex-1 flex items-center gap-3">
            {user.avatar ? (
              <Avatar className="size-10">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.initials}</AvatarFallback>
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
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                {user.name}
              </h3>
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
            onClick={() => onLogin()}
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
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="p-2 rounded-lg cursor-pointer">
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
                className="w-48"
                side="right"
                align="center"
                sideOffset={-100}
              >
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
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
                      <span className="text-sm">{t(themeOption.labelKey)}</span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        {/* Language Selection */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="p-2 rounded-lg cursor-pointer">
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
                className="w-48"
                side="right"
                align="center"
                sideOffset={-100}
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
                      <span className="text-sm">{t(langOption.labelKey)}</span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
