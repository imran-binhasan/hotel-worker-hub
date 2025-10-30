import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Badge } from "@/components/ui/badge";

const Schedule = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSchedules();
    }
  }, [user, selectedDate]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);

      const { data } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", user?.id)
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      setSchedules(data || []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedDateSchedules = schedules.filter(
    (s) => s.date === format(selectedDate, "yyyy-MM-dd")
  );

  const scheduledDates = schedules.map((s) => new Date(s.date));

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-6">
        <h2 className="text-3xl font-bold">Schedule</h2>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="pointer-events-auto"
                modifiers={{
                  scheduled: scheduledDates,
                }}
                modifiersStyles={{
                  scheduled: {
                    backgroundColor: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                    borderRadius: "0.5rem",
                  },
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Schedule for {format(selectedDate, "MMMM dd, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : selectedDateSchedules.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No schedule for this day</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateSchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="p-4 bg-secondary rounded-lg space-y-2"
                    >
                      <div className="flex items-center gap-3">
                        <Badge>Shift</Badge>
                        <span className="font-medium">
                          {schedule.shift_start} - {schedule.shift_end}
                        </span>
                      </div>
                      {schedule.notes && (
                        <p className="text-sm text-muted-foreground">{schedule.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No upcoming shifts scheduled
              </p>
            ) : (
              <div className="space-y-3">
                {schedules.slice(0, 5).map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{format(new Date(schedule.date), "EEEE, MMMM dd")}</p>
                      <p className="text-sm text-muted-foreground">
                        {schedule.shift_start} - {schedule.shift_end}
                      </p>
                    </div>
                    <Badge variant="outline">{schedule.notes || "Regular Shift"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Schedule;