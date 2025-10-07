import { Input, Select, SelectItem, Switch } from "@heroui/react";
import type { UpdateUserInput } from "../../../api/users";
import type { User } from "../../../api/users";

interface UserEditFormProps {
  user: User;
  editForm: UpdateUserInput;
  onFormChange: (form: UpdateUserInput) => void;
}

export const UserEditForm = ({ user, editForm, onFormChange }: UserEditFormProps) => {
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
