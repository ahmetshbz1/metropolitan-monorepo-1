import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type LegalType = "privacy-policy" | "cookie-policy" | "terms-of-service";
type Language = "tr" | "en" | "pl";

interface LegalResponse {
  success: boolean;
  data: {
    type: string;
    language: string;
    content: string;
  };
}

export const useLegal = (type: LegalType, language: Language = "tr") => {
  return useQuery({
    queryKey: ["legal", type, language],
    queryFn: async () => {
      const { data } = await api.get<LegalResponse>(`/legal/${type}`, {
        params: { lang: language },
      });
      return data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};