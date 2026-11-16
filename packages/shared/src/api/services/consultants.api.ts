import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { toast } from "sonner";

export interface Consultant {
  _id: string;
  name: string;
  role_description: string;
  avatar_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsultantCreate {
  name: string;
  role_description: string;
  avatar_url: string;
  is_active?: boolean;
}

export function useConsultants(active_only: boolean = false) {
  return useQuery({
    queryKey: ["consultants", active_only],
    queryFn: async () => {
      const response = await apiClient.get<Consultant[]>("/consultants/", {
        params: { active_only, limit: 100 },
      });
      return response.data;
    },
  });
}

export function useCreateConsultant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ConsultantCreate) => {
      const response = await apiClient.post<Consultant>("/consultants/", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Consultant created successfully");
      qc.invalidateQueries({ queryKey: ["consultants"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to create consultant");
    },
  });
}

export function useUpdateConsultant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ConsultantCreate> }) => {
      const response = await apiClient.put<Consultant>(`/consultants/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Consultant updated successfully");
      qc.invalidateQueries({ queryKey: ["consultants"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to update consultant");
    },
  });
}

export function useDeleteConsultant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/consultants/${id}`);
    },
    onSuccess: () => {
      toast.success("Consultant deleted successfully");
      qc.invalidateQueries({ queryKey: ["consultants"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to delete consultant");
    },
  });
}
