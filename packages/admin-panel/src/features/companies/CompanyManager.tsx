import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spacer,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { Building2, PencilLine, RefreshCw } from "lucide-react";

import { getCompanies, updateCompany, type Company } from "../../api/companies";

interface EditableCompany {
  id: string;
  name: string;
  nip: string;
}

export const CompanyManager = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<EditableCompany | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadCompanies = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getCompanies();
      setCompanies(response.companies);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Şirketler yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const handleEdit = (company: Company) => {
    setEditingCompany({
      id: company.id,
      name: company.name,
      nip: company.nip,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
  };

  const handleSave = async () => {
    if (!editingCompany) {
      return;
    }

    try {
      setIsSaving(true);
      await updateCompany(editingCompany.id, {
        name: editingCompany.name,
        nip: editingCompany.nip,
      });
      await loadCompanies();
      handleCloseModal();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Şirket güncellenemedi");
    } finally {
      setIsSaving(false);
    }
  };

  const formattedCompanies = useMemo(
    () =>
      companies.map((company) => ({
        ...company,
        createdAt: new Date(company.createdAt).toLocaleString("tr-TR"),
        updatedAt: new Date(company.updatedAt).toLocaleString("tr-TR"),
      })),
    [companies]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Şirketler</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Kurumsal müşterilere ait şirket bilgilerini yönetin.
            </p>
          </div>
        </div>
        <Button
          variant="flat"
          startContent={<RefreshCw className="h-4 w-4" />}
          onPress={() => {
            void loadCompanies();
          }}
          isLoading={isLoading}
        >
          Yenile
        </Button>
      </div>

      <Card className="dark:bg-[#1a1a1a] dark:border dark:border-[#2a2a2a]">
        <CardBody>
          {error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
              <Button color="danger" variant="flat" onPress={() => void loadCompanies()}>
                Tekrar Dene
              </Button>
            </div>
          ) : (
            <Table aria-label="Şirket listesi" removeWrapper>
              <TableHeader>
                <TableColumn>ŞİRKET</TableColumn>
                <TableColumn>NIP</TableColumn>
                <TableColumn>OLUŞTURMA</TableColumn>
                <TableColumn>GÜNCELLEME</TableColumn>
                <TableColumn align="end">İŞLEM</TableColumn>
              </TableHeader>
              <TableBody
                items={formattedCompanies}
                isLoading={isLoading}
                loadingContent={<Spinner label="Yükleniyor" />}
                emptyContent="Şirket bulunamadı"
              >
                {(company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {company.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {company.id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" color="primary">
                        {company.nip}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{company.createdAt}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{company.updatedAt}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="flat"
                        startContent={<PencilLine className="h-3.5 w-3.5" />}
                        onPress={() => handleEdit(company)}
                      >
                        Düzenle
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} size="lg">
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>Şirket Bilgilerini Güncelle</ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label="Şirket Adı"
                  variant="bordered"
                  value={editingCompany?.name ?? ""}
                  onValueChange={(value) => {
                    setEditingCompany((current) =>
                      current ? { ...current, name: value } : current
                    );
                  }}
                />
                <Input
                  label="NIP"
                  variant="bordered"
                  value={editingCompany?.nip ?? ""}
                  onValueChange={(value) => {
                    setEditingCompany((current) =>
                      current ? { ...current, nip: value } : current
                    );
                  }}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={close} isDisabled={isSaving}>
                  İptal
                </Button>
                <Button color="primary" onPress={() => void handleSave()} isLoading={isSaving}>
                  Kaydet
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Spacer y={4} />
    </div>
  );
};
