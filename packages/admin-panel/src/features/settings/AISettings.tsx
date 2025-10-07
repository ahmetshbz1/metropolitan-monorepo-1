import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Button,
  Spinner,
} from "@heroui/react";
import { Save, Brain } from "lucide-react";
import { getAISettings, updateAISettings, getAvailableModels } from "../../api/ai-settings";
import type {
  AISettings as AISettingsType,
  UpdateAISettingsInput,
  AIModel,
  AvailableModelsResponse
} from "../../api/ai-settings";

const AI_PROVIDERS = [
  { value: "gemini", label: "Google Gemini" },
  { value: "openai", label: "OpenAI / ChatGPT" },
];

interface FormState {
  provider: string;
  apiKey: string;
  model: string;
}

export const AISettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    provider: "gemini",
    apiKey: "",
    model: "",
  });
  const [originalSettings, setOriginalSettings] = useState<AISettingsType | null>(null);
  const [availableModels, setAvailableModels] = useState<AvailableModelsResponse>({
    gemini: [],
    openai: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settings, models] = await Promise.all([
        getAISettings(),
        getAvailableModels(),
      ]);

      setAvailableModels(models);

      if (settings) {
        setForm({
          provider: settings.provider,
          apiKey: settings.apiKey,
          model: settings.model,
        });
        setOriginalSettings(settings);
      } else {
        setForm((prev) => ({
          ...prev,
          model: models.gemini[0]?.id || "",
        }));
      }
    } catch (error) {
      console.error("AI ayarları yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (value: string) => {
    const providerModels = value === "gemini" ? availableModels.gemini : availableModels.openai;
    setForm({
      ...form,
      provider: value,
      model: providerModels[0]?.id || "",
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const input: UpdateAISettingsInput = {
        provider: form.provider,
        apiKey: form.apiKey,
        model: form.model,
      };
      const updated = await updateAISettings(input);
      setOriginalSettings(updated);
      setForm({
        provider: updated.provider,
        apiKey: updated.apiKey,
        model: updated.model,
      });
    } catch (error) {
      console.error("AI ayarları kaydedilemedi:", error);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!originalSettings) return true;
    return (
      form.provider !== originalSettings.provider ||
      form.apiKey !== originalSettings.apiKey ||
      form.model !== originalSettings.model
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          AI Çeviri Ayarları
        </h1>
      </div>

      <Card className="dark:bg-[#1a1a1a] dark:border dark:border-[#2a2a2a]">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            AI Sağlayıcı Yapılandırması
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Otomatik çeviri için kullanılacak AI modelini ve API anahtarını belirleyin
          </p>
        </CardHeader>
        <CardBody className="gap-6 px-6 pb-6">
          <Select
            label="AI Sağlayıcı"
            placeholder="Bir sağlayıcı seçin"
            selectedKeys={[form.provider]}
            onChange={(e) => handleProviderChange(e.target.value)}
            classNames={{
              trigger: "dark:bg-[#0a0a0a] dark:border-[#2a2a2a]",
            }}
          >
            {AI_PROVIDERS.map((provider) => (
              <SelectItem key={provider.value} value={provider.value}>
                {provider.label}
              </SelectItem>
            ))}
          </Select>

          <Input
            label="API Anahtarı"
            placeholder="API anahtarınızı girin"
            value={form.apiKey}
            onValueChange={(value) => setForm({ ...form, apiKey: value })}
            type="password"
            classNames={{
              inputWrapper: "dark:bg-[#0a0a0a] dark:border dark:border-[#2a2a2a]",
            }}
          />

          <Select
            label="Model"
            placeholder="Bir model seçin"
            selectedKeys={form.model ? [form.model] : []}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            classNames={{
              trigger: "dark:bg-[#0a0a0a] dark:border-[#2a2a2a]",
            }}
          >
            {(form.provider === "gemini" ? availableModels.gemini : availableModels.openai).map(
              (model) => (
                <SelectItem key={model.id} value={model.id} textValue={model.name}>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{model.name}</span>
                    {model.description && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {model.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              )
            )}
          </Select>

          <div className="flex justify-end gap-3">
            <Button
              color="primary"
              startContent={<Save className="h-4 w-4" />}
              onPress={handleSave}
              isLoading={saving}
              isDisabled={!hasChanges() || !form.apiKey || !form.model}
            >
              Kaydet
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
