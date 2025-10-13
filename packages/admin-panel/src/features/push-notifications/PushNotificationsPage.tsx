import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Textarea,
  Chip,
  Checkbox,
  Spacer,
} from "@heroui/react";
import { Bell, Send, Users, Loader2, Sparkles, X } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  sendPushToUser,
  sendBatchPush,
  sendBroadcastPush,
  translateText,
} from "./api";
import type { PushNotificationPayload } from "./api";
import { getUsers } from "../../api/users";
import type { User } from "../../api/users";

type SendMode = "single" | "batch" | "broadcast";

export const PushNotificationsPage = () => {
  const [mode, setMode] = useState<SendMode>("broadcast");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set()
  );
  const [manualTranslation, setManualTranslation] = useState(false);

  const [translations, setTranslations] = useState({
    tr: { title: "", body: "" },
    en: { title: "", body: "" },
    pl: { title: "", body: "" },
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: usersResponse } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers({ limit: 1000 }),
  });

  const usersData = usersResponse?.users || [];

  const selectedUsers = usersData.filter((user) =>
    selectedUserIds.has(user.id)
  );

  const updateTranslation = (
    lang: "tr" | "en" | "pl",
    field: "title" | "body",
    value: string
  ) => {
    setTranslations((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: value,
      },
    }));
  };

  const translateMutation = useMutation({
    mutationFn: async () => {
      if (!translations.tr.title || !translations.tr.body) {
        throw new Error("Önce Türkçe başlık ve içeriği doldurun");
      }

      const titleResult = await translateText(translations.tr.title);
      const bodyResult = await translateText(translations.tr.body);

      if (!titleResult.data || !bodyResult.data) {
        throw new Error("Çeviri başarısız");
      }

      return {
        title: titleResult.data,
        body: bodyResult.data,
      };
    },
    onSuccess: (data) => {
      setTranslations((prev) => ({
        ...prev,
        en: {
          title: data.title.en,
          body: data.body.en,
        },
        pl: {
          title: data.title.pl,
          body: data.body.pl,
        },
      }));
      setSuccess("Çeviriler başarıyla oluşturuldu!");
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Çeviri başarısız");
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      setSuccess(null);

      if (!translations.tr.title || !translations.tr.body) {
        throw new Error("Türkçe başlık ve içerik zorunludur");
      }

      if (
        manualTranslation &&
        (!translations.en.title ||
          !translations.en.body ||
          !translations.pl.title ||
          !translations.pl.body)
      ) {
        throw new Error("Manuel çeviri modunda tüm diller zorunludur");
      }

      if (!manualTranslation && (!translations.en.title || !translations.en.body)) {
        throw new Error(
          "Lütfen önce 'AI Çeviri Yap' butonuna basın veya manuel çeviri moduna geçin"
        );
      }

      const payload: PushNotificationPayload = {
        customTranslations: translations,
        type: "admin",
        data: {
          sentAt: new Date().toISOString(),
          source: "admin-panel",
        },
      };

      if (mode === "single") {
        if (!selectedUserId) {
          throw new Error("Lütfen bir kullanıcı seçin");
        }
        return await sendPushToUser(selectedUserId, payload);
      } else if (mode === "batch") {
        if (selectedUserIds.size === 0) {
          throw new Error("Lütfen en az bir kullanıcı seçin");
        }
        return await sendBatchPush({
          ...payload,
          userIds: Array.from(selectedUserIds),
        });
      } else {
        return await sendBroadcastPush(payload);
      }
    },
    onSuccess: (data) => {
      setSuccess(data.message);
      setTranslations({
        tr: { title: "", body: "" },
        en: { title: "", body: "" },
        pl: { title: "", body: "" },
      });
      setSelectedUserId("");
      setSelectedUserIds(new Set());
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Gönderim başarısız");
    },
  });

  const removeSelectedUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Bell className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Push Bildirimleri
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kullanıcılara mobil bildirim gönderin
          </p>
        </div>
      </div>

      <Card className="dark:bg-[#1a1a1a]">
        <CardBody className="gap-6">
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Gönderim Modu
            </label>
            <div className="flex gap-2">
              <Chip
                color={mode === "broadcast" ? "primary" : "default"}
                variant={mode === "broadcast" ? "solid" : "flat"}
                className="cursor-pointer"
                onClick={() => setMode("broadcast")}
                startContent={<Users className="h-4 w-4" />}
              >
                Herkese Gönder
              </Chip>
              <Chip
                color={mode === "single" ? "primary" : "default"}
                variant={mode === "single" ? "solid" : "flat"}
                className="cursor-pointer"
                onClick={() => setMode("single")}
              >
                Tek Kullanıcı
              </Chip>
              <Chip
                color={mode === "batch" ? "primary" : "default"}
                variant={mode === "batch" ? "solid" : "flat"}
                className="cursor-pointer"
                onClick={() => setMode("batch")}
                startContent={<Users className="h-4 w-4" />}
              >
                Seçili Kullanıcılar
              </Chip>
            </div>

            {mode === "single" && (
              <>
                <Select
                  label="Kullanıcı Seçin"
                  placeholder="Kullanıcı seçin"
                  selectedKeys={selectedUserId ? [selectedUserId] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setSelectedUserId(selected || "");
                  }}
                  variant="bordered"
                  size="lg"
                >
                  {usersData.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.phoneNumber} - {user.firstName || "İsimsiz"}
                    </SelectItem>
                  ))}
                </Select>

                {selectedUserId && (
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const user = usersData.find((u) => u.id === selectedUserId);
                      return user ? (
                        <Chip
                          key={user.id}
                          onClose={() => setSelectedUserId("")}
                          variant="flat"
                          color="primary"
                        >
                          {user.firstName || user.phoneNumber}
                        </Chip>
                      ) : null;
                    })()}
                  </div>
                )}
              </>
            )}

            {mode === "batch" && (
              <>
                <Select
                  label="Kullanıcılar Seçin"
                  placeholder="Kullanıcıları seçin"
                  selectionMode="multiple"
                  selectedKeys={selectedUserIds}
                  onSelectionChange={(keys) =>
                    setSelectedUserIds(keys as Set<string>)
                  }
                  variant="bordered"
                  size="lg"
                >
                  {usersData.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.phoneNumber} - {user.firstName || "İsimsiz"}
                    </SelectItem>
                  ))}
                </Select>

                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <Chip
                        key={user.id}
                        onClose={() => removeSelectedUser(user.id)}
                        variant="flat"
                        color="primary"
                      >
                        {user.firstName || user.phoneNumber}
                      </Chip>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Checkbox
              isSelected={manualTranslation}
              onValueChange={setManualTranslation}
            >
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Manuel Çeviri Modu
              </span>
            </Checkbox>

            {!manualTranslation && (
              <Button
                color="secondary"
                variant="flat"
                size="sm"
                startContent={
                  translateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )
                }
                onPress={() => translateMutation.mutate()}
                isDisabled={
                  translateMutation.isPending ||
                  !translations.tr.title ||
                  !translations.tr.body
                }
              >
                {translateMutation.isPending ? "Çevriliyor..." : "AI Çeviri Yap"}
              </Button>
            )}
          </div>

          <Tabs aria-label="Diller" variant="bordered" fullWidth>
            <Tab key="tr" title="Türkçe">
              <div className="flex flex-col gap-4 pt-4">
                <Input
                  label="Başlık"
                  placeholder="Örn: Yeni Kampanya!"
                  value={translations.tr.title}
                  onValueChange={(value) =>
                    updateTranslation("tr", "title", value)
                  }
                  variant="bordered"
                  size="lg"
                  isRequired
                />
                <Textarea
                  label="İçerik"
                  placeholder="Bildirim içeriğini yazın..."
                  value={translations.tr.body}
                  onValueChange={(value) =>
                    updateTranslation("tr", "body", value)
                  }
                  variant="bordered"
                  minRows={4}
                  size="lg"
                  isRequired
                />
              </div>
            </Tab>
            <Tab key="en" title="English">
              <div className="flex flex-col gap-4 pt-4">
                <Input
                  label="Title"
                  placeholder="e.g: New Campaign!"
                  value={translations.en.title}
                  onValueChange={(value) =>
                    updateTranslation("en", "title", value)
                  }
                  variant="bordered"
                  size="lg"
                  isRequired={manualTranslation}
                  isDisabled={!manualTranslation && translateMutation.isPending}
                />
                <Textarea
                  label="Body"
                  placeholder="Write notification content..."
                  value={translations.en.body}
                  onValueChange={(value) =>
                    updateTranslation("en", "body", value)
                  }
                  variant="bordered"
                  minRows={4}
                  size="lg"
                  isRequired={manualTranslation}
                  isDisabled={!manualTranslation && translateMutation.isPending}
                />
              </div>
            </Tab>
            <Tab key="pl" title="Polski">
              <div className="flex flex-col gap-4 pt-4">
                <Input
                  label="Tytuł"
                  placeholder="np: Nowa kampania!"
                  value={translations.pl.title}
                  onValueChange={(value) =>
                    updateTranslation("pl", "title", value)
                  }
                  variant="bordered"
                  size="lg"
                  isRequired={manualTranslation}
                  isDisabled={!manualTranslation && translateMutation.isPending}
                />
                <Textarea
                  label="Treść"
                  placeholder="Napisz treść powiadomienia..."
                  value={translations.pl.body}
                  onValueChange={(value) =>
                    updateTranslation("pl", "body", value)
                  }
                  variant="bordered"
                  minRows={4}
                  size="lg"
                  isRequired={manualTranslation}
                  isDisabled={!manualTranslation && translateMutation.isPending}
                />
              </div>
            </Tab>
          </Tabs>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/50">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/50">
              <p className="text-sm text-green-600 dark:text-green-400">
                {success}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button
              color="primary"
              size="lg"
              startContent={
                sendMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )
              }
              onPress={() => sendMutation.mutate()}
              isDisabled={sendMutation.isPending}
            >
              {sendMutation.isPending
                ? "Gönderiliyor..."
                : mode === "broadcast"
                ? "Herkese Gönder"
                : mode === "single"
                ? "Gönder"
                : `${selectedUserIds.size} Kullanıcıya Gönder`}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card className="dark:bg-[#1a1a1a]">
        <CardBody>
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
            Önizleme (Türkçe)
          </h3>
          <div className="rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary p-2">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {translations.tr.title || "Başlık buraya gelecek"}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {translations.tr.body || "İçerik buraya gelecek"}
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
