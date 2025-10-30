import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";

const Performance = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalHours: 0,
    avgRoomsPerHour: 0,
    efficiency: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPerformanceData();
    }
  }, [user]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // Fetch profile to get role
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      setProfile(profileData);

      // Fetch last 30 days data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: timeEntries } = await supabase
        .from("time_entries")
        .select("total_hours")
        .eq("user_id", user?.id)
        .gte("date", thirtyDaysAgo.toISOString().split('T')[0]);

      const { data: roomsData } = await supabase
        .from("rooms_cleaned")
        .select("count")
        .eq("user_id", user?.id)
        .gte("date", thirtyDaysAgo.toISOString().split('T')[0]);

      const totalHours = timeEntries?.reduce((sum, entry) => sum + (entry.total_hours || 0), 0) || 0;
      const totalRooms = roomsData?.reduce((sum, entry) => sum + (entry.count || 0), 0) || 0;
      const avgRoomsPerHour = totalHours > 0 ? totalRooms / totalHours : 0;

      // Calculate efficiency based on role
      const expectedRate = profileData?.role === "cleaner" ? 3 : 10; // 3 rooms/hour for cleaner, 10 for checker
      const efficiency = expectedRate > 0 ? (avgRoomsPerHour / expectedRate) * 100 : 0;

      setStats({
        totalRooms,
        totalHours,
        avgRoomsPerHour,
        efficiency: Math.min(efficiency, 100),
      });
    } catch (error) {
      console.error("Error fetching performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const expectedRate = profile?.role === "cleaner" ? 3 : 10;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-6">
        <h2 className="text-3xl font-bold">Performance Metrics</h2>

        {loading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Overall Efficiency</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-primary">
                      {stats.efficiency.toFixed(0)}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Last 30 days
                    </p>
                  </div>
                  <Progress value={stats.efficiency} className="h-3" />
                  <div className="flex items-center justify-center gap-2">
                    {stats.efficiency >= 100 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-orange-600" />
                    )}
                    <span className={stats.efficiency >= 100 ? "text-green-600" : "text-orange-600"}>
                      {stats.efficiency >= 100 ? "Above" : "Below"} Target
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Hours</span>
                      <span className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Rooms</span>
                      <span className="text-2xl font-bold">{stats.totalRooms}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Avg Rooms/Hour</span>
                      <span className="text-2xl font-bold">{stats.avgRoomsPerHour.toFixed(1)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Standards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Your Role</p>
                    <p className="text-xl font-bold capitalize">{profile?.role}</p>
                  </div>
                  <div className="p-4 bg-accent/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Expected Rate</p>
                    <p className="text-xl font-bold">{expectedRate} rooms/hour</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Actual Rate</p>
                    <p className="text-xl font-bold">{stats.avgRoomsPerHour.toFixed(1)} rooms/hour</p>
                  </div>
                  <div className={`p-4 rounded-lg ${stats.efficiency >= 100 ? "bg-green-100" : "bg-orange-100"}`}>
                    <p className="text-sm text-muted-foreground mb-2">Status</p>
                    <p className="text-xl font-bold">
                      {stats.efficiency >= 100 ? "Meeting Target" : "Below Target"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Standard rooms should take approximately 20 minutes for cleaners</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Suite rooms may take 30-40 minutes due to larger size</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Checkers should verify 10 rooms per hour on average</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Quality is more important than speed - maintain high standards</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Performance;