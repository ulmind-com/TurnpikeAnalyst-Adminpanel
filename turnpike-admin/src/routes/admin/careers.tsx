import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Briefcase, MapPin } from "lucide-react";
import { apiClient as api } from "@turnpike/shared/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/careers")({
  component: AdminCareersPage,
});

function AdminCareersPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [newJob, setNewJob] = useState({ title: "", location: "", type: "Full-Time", req: "" });
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => {
      const res = await api.get("/content/jobs");
      return res.data;
    }
  });

  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/content/jobs/${id}`);
    },
    onSuccess: () => {
      toast.success("Item deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newJob) => {
      const res = await api.post("/content/jobs", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Job created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      setIsAdding(false);
      setNewJob({ title: "", location: "", type: "Full-Time", req: "" });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Manage Careers (Jobs)</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Job
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
              <input 
                value={newJob.title}
                onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <input 
                value={newJob.location}
                onChange={e => setNewJob({ ...newJob, location: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="e.g. Riyadh (Saudi Arabia)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select 
                value={newJob.type}
                onChange={e => setNewJob({ ...newJob, type: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Requirements (Short)</label>
              <input 
                value={newJob.req}
                onChange={e => setNewJob({ ...newJob, req: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm border rounded-md hover:bg-slate-50">Cancel</button>
            <button 
              onClick={() => createMutation.mutate(newJob)}
              disabled={createMutation.isPending || !newJob.title || !newJob.location}
              className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              Save Job
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm divide-y">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No jobs found. Add one above!</div>
        ) : (
          jobs.map((job: any) => (
            <div key={job._id} className="p-6 flex items-center justify-between group">
              <div>
                <h3 className="font-bold text-slate-900 mb-1 text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  {job.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded">{job.type}</span>
                  {job.req && <span>Req: {job.req}</span>}
                </div>
              </div>
              <button
                onClick={() => deleteMutation.mutate(job._id)}
                disabled={deleteMutation.isPending}
                className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-md transition-all"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
