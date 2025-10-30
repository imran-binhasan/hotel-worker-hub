import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload } from "lucide-react";

const Leaves = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    leaveType: "sick",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchLeaves();
    }
  }, [user]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("leaves")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      setLeaves(data || []);
    } catch (error) {
      console.error("Error fetching leaves:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let documentUrl = null;

      // Upload document if provided
      if (documentFile) {
        const fileExt = documentFile.name.split(".").pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("leave-documents")
          .upload(fileName, documentFile);

        if (uploadError) {
          toast.error("Failed to upload document");
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("leave-documents")
          .getPublicUrl(fileName);

        documentUrl = publicUrl;
      }

      // Insert leave request
      const { error } = await supabase.from("leaves").insert([{
        user_id: user?.id,
        leave_type: formData.leaveType as "sick" | "holiday" | "other",
        start_date: formData.startDate,
        end_date: formData.endDate,
        reason: formData.reason,
        document_url: documentUrl,
        status: "pending",
      }]);

      if (error) {
        toast.error("Failed to submit leave request");
        return;
      }

      toast.success("Leave request submitted successfully");
      setDialogOpen(false);
      setFormData({ leaveType: "sick", startDate: "", endDate: "", reason: "" });
      setDocumentFile(null);
      fetchLeaves();
    } catch (error) {
      console.error("Error submitting leave:", error);
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Leave Management</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Apply for Leave</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Apply for Leave</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Leave Type</Label>
                  <Select
                    value={formData.leaveType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, leaveType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    placeholder="Briefly explain your reason..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Supporting Document (if required)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      onChange={(e) =>
                        setDocumentFile(e.target.files?.[0] || null)
                      }
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    {documentFile && <Upload className="w-5 h-5 text-green-600" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF, JPG, or PNG (max 5MB)
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">Loading...</p>
              </CardContent>
            </Card>
          ) : leaves.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  No leave requests found
                </p>
              </CardContent>
            </Card>
          ) : (
            leaves.map((leave) => (
              <Card key={leave.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">
                      {leave.leave_type} Leave
                    </CardTitle>
                    <Badge className={getStatusColor(leave.status)} variant="outline">
                      {leave.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium">
                        {format(new Date(leave.start_date), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">End Date</p>
                      <p className="font-medium">
                        {format(new Date(leave.end_date), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  {leave.reason && (
                    <div>
                      <p className="text-sm text-muted-foreground">Reason</p>
                      <p className="text-sm">{leave.reason}</p>
                    </div>
                  )}
                  {leave.document_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={leave.document_url} target="_blank" rel="noopener noreferrer">
                        View Document
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Leaves;