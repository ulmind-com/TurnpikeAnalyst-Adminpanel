import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit } from "lucide-react";
import { apiClient as api } from "@turnpike/shared/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/faqs")({
  component: AdminFaqsPage,
});

function AdminFaqsPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const queryClient = useQueryClient();

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: async () => {
      const res = await api.get("/content/faqs");
      return res.data;
    }
  });

  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/content/faqs/${id}`);
    },
    onSuccess: () => {
      toast.success("Item deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: { question: string; answer: string }) => {
      const res = await api.post("/content/faqs", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("FAQ created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      setIsAdding(false);
      setNewQuestion("");
      setNewAnswer("");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { question: string; answer: string } }) => {
      const res = await api.put(`/content/faqs/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("FAQ updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      setEditingId(null);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Manage FAQs</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add FAQ
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Question</label>
            <input 
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="e.g. What is ECM?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Answer</label>
            <textarea 
              value={newAnswer}
              onChange={e => setNewAnswer(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm h-24"
              placeholder="Answer goes here..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm border rounded-md hover:bg-slate-50">Cancel</button>
            <button 
              onClick={() => createMutation.mutate({ question: newQuestion, answer: newAnswer })}
              disabled={createMutation.isPending || !newQuestion || !newAnswer}
              className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              Save FAQ
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm divide-y">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading FAQs...</div>
        ) : faqs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No FAQs found. Add one above!</div>
        ) : (
          faqs.map((faq: any) => (
            editingId === faq._id ? (
              <div key={faq._id} className="p-6 bg-slate-50 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Question</label>
                  <input 
                    value={editQuestion}
                    onChange={e => setEditQuestion(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Answer</label>
                  <textarea 
                    value={editAnswer}
                    onChange={e => setEditAnswer(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm h-24 bg-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm border rounded-md bg-white hover:bg-slate-100">Cancel</button>
                  <button 
                    onClick={() => updateMutation.mutate({ id: faq._id, data: { question: editQuestion, answer: editAnswer } })}
                    disabled={updateMutation.isPending || !editQuestion || !editAnswer}
                    className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div key={faq._id} className="p-6 flex gap-4 group">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 mb-2">{faq.question}</h3>
                  <p className="text-sm text-slate-600">{faq.answer}</p>
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => {
                      setEditingId(faq._id);
                      setEditQuestion(faq.question);
                      setEditAnswer(faq.answer);
                    }}
                    className="p-2 h-fit text-slate-500 hover:bg-slate-100 rounded-md transition-all"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(faq._id)}
                    disabled={deleteMutation.isPending}
                    className="p-2 h-fit text-red-500 hover:bg-red-50 rounded-md transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
}
