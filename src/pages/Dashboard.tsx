import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Clock, TrendingUp, Calendar, Umbrella } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    todayHours: 0,
    weeklyHours: 0,
    roomsCleaned: 0,
    upcomingLeaves: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();
      
      setProfile(profileData);

      // Fetch today's time entry
      const today = new Date().toISOString().split('T')[0];
      const { data: todayEntry } = await supabase
        .from("time_entries")
        .select("total_hours")
        .eq("user_id", user?.id)
        .eq("date", today)
        .single();

      // Fetch weekly hours
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const { data: weekEntries } = await supabase
        .from("time_entries")
        .select("total_hours")
        .eq("user_id", user?.id)
        .gte("date", weekStart.toISOString().split('T')[0]);

      const weeklyHours = weekEntries?.reduce((sum, entry) => sum + (entry.total_hours || 0), 0) || 0;

      // Fetch rooms cleaned this week
      const { data: roomsData } = await supabase
        .from("rooms_cleaned")
        .select("count")
        .eq("user_id", user?.id)
        .gte("date", weekStart.toISOString().split('T')[0]);

      const roomsCleaned = roomsData?.reduce((sum, entry) => sum + (entry.count || 0), 0) || 0;

      // Fetch upcoming leaves
      const { data: leavesData } = await supabase
        .from("leaves")
        .select("*")
        .eq("user_id", user?.id)
        .gte("start_date", today)
        .in("status", ["pending", "approved"]);

      setStats({
        todayHours: todayEntry?.total_hours || 0,
        weeklyHours,
        roomsCleaned,
        upcomingLeaves: leavesData?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      title: "Today's Hours",
      value: stats.todayHours.toFixed(1),
      icon: Clock,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Weekly Hours",
      value: stats.weeklyHours.toFixed(1),
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Rooms This Week",
      value: stats.roomsCleaned,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Upcoming Leaves",
      value: stats.upcomingLeaves,
      icon: Umbrella,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-6">
        <div>
          <h2 className="text-3xl font-bold">Welcome back, {profile?.full_name}!</h2>
          <p className="text-muted-foreground mt-1">
            Role: <span className="font-medium capitalize">{profile?.role}</span>
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="overflow-hidden transition-all hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => navigate("/dashboard/qr-scan")}
                className="w-full p-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Scan QR Code
              </button>
              <button
                onClick={() => navigate("/dashboard/time-tracking")}
                className="w-full p-4 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
              >
                View Time Tracking
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">
                    {stats.todayHours > 0 ? "Active" : "Not Started"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Hours Worked</span>
                  <span className="font-medium">{stats.todayHours.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium capitalize">{profile?.role}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;