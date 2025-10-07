import { useEffect, useState } from "react";
import { Input, Select, SelectItem, Switch, Spinner, Divider } from "@heroui/react";
import type { UpdateUserInput } from "../../../api/users";
import type { User } from "../../../api/users";
import { getCompanies, updateCompany, type Company } from "../../../api/companies";

interface UserEditFormProps {
  user: User;
  editForm: UpdateUserInput;
  onFormChange: (form: UpdateUserInput) => void;
  onCompanyUpdate?: () => void;
}

export const UserEditForm = ({ user, editForm, onFormChange, onCompanyUpdate }: UserEditFormProps) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companyForm, setCompanyForm] = useState({ name: "", nip: "" });
  const [savingCompany, setSavingCompany] = useState(false);

  const selectedCompany = companies.find(
    (c) => c.id === (editForm.companyId || user.companyId)
  );

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      setCompanyForm({
        name: selectedCompany.name,
        nip: selectedCompany.nip,
      });
    }
  }, [selectedCompany]);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await getCompanies();
      setCompanies(response.companies);
    } catch (error) {
      console.error("Şirketler yüklenemedi:", error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleCompanyUpdate = async () => {
    if (!selectedCompany) return;

    try {
      setSavingCompany(true);
      await updateCompany(selectedCompany.id, companyForm);
      await loadCompanies();
      onCompanyUpdate?.();
    } catch (error) {
      console.error("Şirket güncellenemedi:", error);
    } finally {
      setSavingCompany(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-3 text-sm font-semibold">Kişisel Bilgiler</h4>
        <div className="space-y-3">
          <Input
            label="Ad"
            value={editForm.firstName || ""}
            onValueChange={(value) => onFormChange({ ...editForm, firstName: value || null })}
            classNames={{ inputWrapper: "dark:bg-[#0a0a0a]" }}
          />
          <Input
            label="Soyad"
            value={editForm.lastName || ""}
            onValueChange={(value) => onFormChange({ ...editForm, lastName: value || null })}
            classNames={{ inputWrapper: "dark:bg-[#0a0a0a]" }}
          />
          <Input
            label="E-posta"
            type="email"
            value={editForm.email || ""}
            onValueChange={(value) => onFormChange({ ...editForm, email: value || null })}
            classNames={{ inputWrapper: "dark:bg-[#0a0a0a]" }}
          />
          <Input
            label="Telefon"
            value={editForm.phoneNumber || ""}
            onValueChange={(value) => onFormChange({ ...editForm, phoneNumber: value })}
            classNames={{ inputWrapper: "dark:bg-[#0a0a0a]" }}
          />
          <Switch
            isSelected={editForm.phoneNumberVerified}
            onValueChange={(value) => onFormChange({ ...editForm, phoneNumberVerified: value })}
          >
            Telefon Doğrulandı
          </Switch>
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold">Hesap Bilgileri</h4>
        <div className="space-y-3">
          <Select
            label="Kullanıcı Tipi"
            selectedKeys={new Set([editForm.userType || user.userType])}
            onSelectionChange={(keys) => {
              const [value] = keys;
              onFormChange({ ...editForm, userType: value as "individual" | "corporate" });
            }}
            classNames={{ trigger: "dark:bg-[#0a0a0a]" }}
          >
            <SelectItem key="individual">Bireysel</SelectItem>
            <SelectItem key="corporate">Kurumsal</SelectItem>
          </Select>

          {(editForm.userType || user.userType) === "corporate" && (
            <>
              {loadingCompanies ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : (
                <>
                  {selectedCompany ? (
                    <div className="space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-[#0d0d0d]">
                      <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Şirket Bilgileri
                      </h5>
                      <Input
                        label="Şirket Adı"
                        value={companyForm.name}
                        onValueChange={(value) => setCompanyForm({ ...companyForm, name: value })}
                        classNames={{ inputWrapper: "dark:bg-[#0a0a0a]" }}
                      />
                      <Input
                        label="NIP"
                        value={companyForm.nip}
                        onValueChange={(value) => setCompanyForm({ ...companyForm, nip: value })}
                        classNames={{ inputWrapper: "dark:bg-[#0a0a0a]" }}
                      />
                      <button
                        type="button"
                        onClick={handleCompanyUpdate}
                        disabled={savingCompany}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {savingCompany ? "Kaydediliyor..." : "Şirket Bilgilerini Güncelle"}
                      </button>
                    </div>
                  ) : (
                    <Select
                      label="Şirket"
                      placeholder="Şirket seçin"
                      selectedKeys={new Set()}
                      onSelectionChange={(keys) => {
                        if (keys === "all") return;
                        const selectedKey = Array.from(keys)[0];
                        onFormChange({ ...editForm, companyId: selectedKey ? (selectedKey as string) : null });
                      }}
                      classNames={{ trigger: "dark:bg-[#0a0a0a]" }}
                    >
                      {companies.map((company) => (
                        <SelectItem key={company.id}>
                          {company.name} - {company.nip}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold">İzinler ve Tercihler</h4>
        <div className="space-y-3">
          <Switch
            isSelected={editForm.marketingConsent}
            onValueChange={(value) => onFormChange({ ...editForm, marketingConsent: value })}
          >
            Pazarlama İzni
          </Switch>
          <Switch
            isSelected={editForm.shareDataWithPartners}
            onValueChange={(value) => onFormChange({ ...editForm, shareDataWithPartners: value })}
          >
            Veriler Partnerlerle Paylaşılabilir
          </Switch>
          <Switch
            isSelected={editForm.analyticsData}
            onValueChange={(value) => onFormChange({ ...editForm, analyticsData: value })}
          >
            Analitik Veriler
          </Switch>
          <Switch
            isSelected={editForm.smsNotifications}
            onValueChange={(value) => onFormChange({ ...editForm, smsNotifications: value })}
          >
            SMS Bildirimleri
          </Switch>
          <Switch
            isSelected={editForm.pushNotifications}
            onValueChange={(value) => onFormChange({ ...editForm, pushNotifications: value })}
          >
            Push Bildirimleri
          </Switch>
          <Switch
            isSelected={editForm.emailNotifications}
            onValueChange={(value) => onFormChange({ ...editForm, emailNotifications: value })}
          >
            E-posta Bildirimleri
          </Switch>
        </div>
      </div>
    </div>
  );
};
