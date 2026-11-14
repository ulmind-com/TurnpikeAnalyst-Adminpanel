import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { apiClient as api } from "@turnpike/shared/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/clients/$industryName")({
  component: AdminIndustryClientsPage,
});

const MANUAL_LOGOS: Record<string, string> = {
  "capgemini.com": "https://upload.wikimedia.org/wikipedia/commons/9/9d/Capgemini_201x_logo.svg",
  "capgemini-engineering.com": "https://upload.wikimedia.org/wikipedia/commons/9/9d/Capgemini_201x_logo.svg"
};

function AdminIndustryClientsPage() {
  const { industryName } = Route.useParams();
  const decodedIndustryName = decodeURIComponent(industryName);
  const [isAdding, setIsAdding] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", img: "" });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!newClient.name || newClient.name.length < 2 || !showSuggestions) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${newClient.name}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (e) {
        // ignore errors
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [newClient.name, showSuggestions]);

  // Fetch all client categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-client-categories"],
    queryFn: async () => {
      const res = await api.get("/content/clients");
      return res.data;
    }
  });

  const currentCategory = useMemo(() => {
    return categories.find((c: any) => c.category === decodedIndustryName);
  }, [categories, decodedIndustryName]);

  const updateMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      if (currentCategory) {
        const res = await api.put(`/content/clients/${currentCategory._id}`, updatedData);
        return res.data;
      } else {
        const res = await api.post("/content/clients", updatedData);
        return res.data;
      }
    },
    onSuccess: () => {
      toast.success("Clients updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-client-categories"] });
      setIsAdding(false);
      setNewClient({ name: "", img: "" });
    }
  });

  const handleAddClient = () => {
    if (!newClient.name || !newClient.img) return;
    const newClientsList = currentCategory ? [...currentCategory.clients, newClient] : [newClient];
    updateMutation.mutate({
      category: decodedIndustryName,
      cols: currentCategory?.cols || 4,
      clients: newClientsList
    });
  };

  const handleRemoveClient = (idxToRemove: number) => {
    if (!currentCategory) return;
    const newClientsList = currentCategory.clients.filter((_: any, idx: number) => idx !== idxToRemove);
    updateMutation.mutate({
      category: decodedIndustryName,
      cols: currentCategory.cols,
      clients: newClientsList
    }, {
      onSuccess: () => {
        setDeleteConfirmIdx(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/clients" className="p-2 hover:bg-slate-100 rounded-md transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Clients in "{decodedIndustryName}"</h1>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
              <input 
                value={newClient.name}
                onChange={e => {
                  setNewClient({ ...newClient, name: e.target.value });
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="e.g. Acme Corp"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg overflow-hidden">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-3"
                      onClick={() => {
                        const logoUrl = MANUAL_LOGOS[s.domain] || `https://icon.horse/icon/${s.domain}`;
                        setNewClient({ name: s.name, img: logoUrl });
                        setShowSuggestions(false);
                      }}
                    >
                      <img 
                        src={MANUAL_LOGOS[s.domain] || `https://icon.horse/icon/${s.domain}`} 
                        alt={s.name} 
                        className="w-5 h-5 rounded-sm object-contain bg-white" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src.includes('icon.horse')) {
                            target.src = `https://www.google.com/s2/favicons?domain=${s.domain}&sz=128`;
                          } else if (target.src.includes('google.com')) {
                            target.src = `https://icons.duckduckgo.com/ip3/${s.domain}.ico`;
                          } else if (target.src.includes('duckduckgo')) {
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=e2e8f0&color=475569&size=64`;
                          }
                        }}
                      />
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-slate-500">{s.domain}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
              <input 
                value={newClient.img}
                onChange={e => setNewClient({ ...newClient, img: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm border rounded-md hover:bg-slate-50">Cancel</button>
            <button 
              onClick={handleAddClient}
              disabled={updateMutation.isPending || !newClient.name || !newClient.img}
              className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              Save Client
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm divide-y">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading clients...</div>
        ) : !currentCategory || currentCategory.clients.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No clients in this industry yet. Add one above!</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
            {currentCategory.clients.map((client: any, idx: number) => (
              <div key={idx} className="group relative border rounded-xl p-4 flex flex-col items-center justify-center text-center gap-4 hover:border-primary transition-colors bg-slate-50 hover:bg-white">
                <button
                  onClick={() => setDeleteConfirmIdx(idx)}
                  disabled={updateMutation.isPending}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-all z-10"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden border p-2">
                  {client.img ? (
                    <img 
                      src={client.img} 
                      alt={client.name} 
                      className="w-full h-full object-contain" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        let domainMatch = client.img.match(/clearbit\.com\/(.+)/);
                        if (!domainMatch) domainMatch = client.img.match(/icon\.horse\/icon\/(.+)/);
                        
                        if (domainMatch && !target.dataset.triedGoogle) {
                          target.dataset.triedGoogle = "true";
                          target.src = `https://www.google.com/s2/favicons?domain=${domainMatch[1]}&sz=128`;
                        } else if (domainMatch && !target.dataset.triedDuck) {
                          target.dataset.triedDuck = "true";
                          target.src = `https://icons.duckduckgo.com/ip3/${domainMatch[1]}.ico`;
                        } else if (!target.src.includes('ui-avatars')) {
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=e2e8f0&color=475569&size=128`;
                        }
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className="font-semibold text-sm text-slate-800">{client.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {deleteConfirmIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Remove Client</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to remove this client? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirmIdx(null)}
                className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-slate-50 transition-colors"
                disabled={updateMutation.isPending}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleRemoveClient(deleteConfirmIdx)}
                disabled={updateMutation.isPending}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {updateMutation.isPending ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
