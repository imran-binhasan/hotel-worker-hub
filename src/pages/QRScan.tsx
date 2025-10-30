import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QrCode, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const QRScan = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [todayEntry, setTodayEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTodayEntry();
    }
  }, [user]);

  const fetchTodayEntry = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", user?.id)
        .eq("date", today)
        .single();

      setTodayEntry(data);
    } catch (error) {
      console.error("Error fetching today's entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    setScanning(true);
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const qrCode = `QR-${Date.now()}`; // Simulated QR code scan

      const { error } = await supabase.from("time_entries").insert([{
        user_id: user?.id,
        date: today,
        start_time: now.toISOString(),
        qr_scan_in: qrCode,
      }]);

      if (error) {
        toast.error("Failed to clock in");
        return;
      }

      toast.success("Clocked in successfully!");
      fetchTodayEntry();
    } catch (error) {
      console.error("Error clocking in:", error);
      toast.error("An error occurred");
    } finally {
      setScanning(false);
    }
  };

  const handleClockOut = async () => {
    if (!todayEntry) return;

    setScanning(true);
    try {
      const now = new Date();
      const startTime = new Date(todayEntry.start_time);
      const diffMs = now.getTime() - startTime.getTime();
      const totalHours = diffMs / (1000 * 60 * 60);
      const qrCode = `QR-${Date.now()}`; // Simulated QR code scan

      const { error } = await supabase
        .from("time_entries")
        .update({
          end_time: now.toISOString(),
          total_hours: parseFloat(totalHours.toFixed(2)),
          qr_scan_out: qrCode,
        })
        .eq("id", todayEntry.id);

      if (error) {
        toast.error("Failed to clock out");
        return;
      }

      toast.success("Clocked out successfully!");
      fetchTodayEntry();
    } catch (error) {
      console.error("Error clocking out:", error);
      toast.error("An error occurred");
    } finally {
      setScanning(false);
    }
  };

  const hasStarted = todayEntry && todayEntry.start_time;
  const hasEnded = todayEntry && todayEntry.end_time;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-6 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-center">QR Code Scanner</h2>

        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <QrCode className="w-6 h-6" />
              Attendance Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : (
              <div className="space-y-6">
                {/* Status Display */}
                <div className="text-center p-6 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                  <div className="flex items-center justify-center gap-2">
                    {hasEnded ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <span className="text-2xl font-bold text-green-600">Completed</span>
                      </>
                    ) : hasStarted ? (
                      <>
                        <Clock className="w-6 h-6 text-primary animate-pulse" />
                        <span className="text-2xl font-bold text-primary">Working</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-6 h-6 text-muted-foreground" />
                        <span className="text-2xl font-bold text-muted-foreground">Not Started</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Time Information */}
                {hasStarted && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Clock In</p>
                      <p className="font-bold text-lg">
                        {format(new Date(todayEntry.start_time), "hh:mm a")}
                      </p>
                    </div>
                    {hasEnded && (
                      <div className="p-4 bg-accent/10 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Clock Out</p>
                        <p className="font-bold text-lg">
                          {format(new Date(todayEntry.end_time), "hh:mm a")}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {hasEnded && todayEntry.total_hours && (
                  <div className="p-6 bg-gradient-to-r from-primary to-accent text-white rounded-lg text-center">
                    <p className="text-sm mb-2">Total Hours Worked</p>
                    <p className="text-4xl font-bold">{todayEntry.total_hours.toFixed(1)}h</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {!hasStarted && (
                    <Button
                      onClick={handleClockIn}
                      disabled={scanning}
                      className="w-full h-14 text-lg"
                    >
                      <QrCode className="w-6 h-6 mr-2" />
                      {scanning ? "Scanning..." : "Scan to Clock In"}
                    </Button>
                  )}

                  {hasStarted && !hasEnded && (
                    <Button
                      onClick={handleClockOut}
                      disabled={scanning}
                      variant="destructive"
                      className="w-full h-14 text-lg"
                    >
                      <QrCode className="w-6 h-6 mr-2" />
                      {scanning ? "Scanning..." : "Scan to Clock Out"}
                    </Button>
                  )}

                  {hasEnded && (
                    <div className="text-center p-4 bg-green-100 text-green-800 rounded-lg">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-medium">You've completed your shift for today!</p>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> In a production environment, this would activate your
                    device camera to scan a physical QR code. For this demo, clicking the button
                    simulates a successful QR code scan.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default QRScan;