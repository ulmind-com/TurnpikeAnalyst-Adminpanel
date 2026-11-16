import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Folder } from "lucide-react";
import { apiClient as api } from "@turnpike/shared/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/clients/")({
  component: AdminClientsPage,
});

function AdminClientsPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch from /content/clients so we manage actual ClientCategories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-client-categories"],
    queryFn: async () => {
      const res = await api.get("/content/clients");
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/content/clients/${id}`);
    },
    onSuccess: () => {
      toast.success("Category deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-client-categories"] });
      setDeleteConfirmId(null);
    }
  });

  const createMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      const newCat = {
        category: categoryName,
        cols: 4,
        clients: []
      };
      const res = await api.post("/content/clients", newCat);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Category added successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-client-categories"] });
      setIsAdding(false);
      setNewCategoryName("");
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Manage Client Categories</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-slate-700 mb-1">Category / Industry Name</label>
            <input 
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="e.g. Technology & Communication"
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-2">
              Create a category first. You can add specific clients and logos by clicking on the category after it's saved.
            </p>
          </div>
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => createMutation.mutate(newCategoryName)}
              disabled={createMutation.isPending || newCategoryName.trim().length < 2}
              className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              Save Category
            </button>
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm border rounded-md hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm divide-y">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No categories found. Add one above!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {categories.map((cat: any) => {
              const firstClientWithImg = (cat.clients || []).find((c: any) => c.img);
              return (
                <Link 
                  key={cat._id} 
                  to="/admin/clients/$industryName"
                  params={{ industryName: cat.category }}
                  className="group relative p-4 border rounded-lg bg-slate-50 flex items-center gap-3 hover:border-primary hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-slate-400 group-hover:text-primary transition-colors overflow-hidden border shadow-sm shrink-0">
                    {firstClientWithImg ? (
                      <img 
                        src={firstClientWithImg.img} 
                        alt="Category Icon" 
                        className="w-full h-full object-contain p-1" 
                      />
                    ) : (
                      <Folder className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium group-hover:text-primary transition-colors truncate">{cat.category}</div>
                    <div className="text-xs text-slate-500">{(cat.clients || []).length} clients</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteConfirmId(cat._id);
                    }}
                    disabled={deleteMutation.isPending}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-md transition-all z-10 shrink-0"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Category</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this entire category and all its clients? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-slate-50 transition-colors"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button 
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

