import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const TimeTracking = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [roomsData, setRoomsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && selectedDate) {
      fetchTimeData();
    }
  }, [user, selectedDate]);

  const fetchTimeData = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      // Fetch time entry for selected date
      const { data: entryData } = await supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", user?.id)
        .eq("date", dateStr)
        .single();

      setTimeEntries(entryData ? [entryData] : []);

      if (entryData) {
        // Fetch rooms cleaned for this entry
        const { data: roomsData } = await supabase
          .from("rooms_cleaned")
          .select("*")
          .eq("time_entry_id", entryData.id)
          .eq("date", dateStr);

        setRoomsData(roomsData || []);
      } else {
        setRoomsData([]);
      }
    } catch (error) {
      console.error("Error fetching time data:", error);
    } finally {
      setLoading(false);
    }
  };

  const entry = timeEntries[0];
  const roomTypes = ["standard", "suite", "type1", "type2", "type3"];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Time Tracking</h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        ) : !entry ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No time entry for this date</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Start Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {entry.start_time ? format(new Date(entry.start_time), "hh:mm a") : "N/A"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    End Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {entry.end_time ? format(new Date(entry.end_time), "hh:mm a") : "N/A"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {entry.total_hours ? `${entry.total_hours.toFixed(1)}h` : "0h"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Rooms Cleaned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {roomTypes.map((type) => {
                    const room = roomsData.find((r) => r.room_type === type);
                    const count = room?.count || 0;
                    return (
                      <div
                        key={type}
                        className="flex justify-between items-center p-3 bg-secondary rounded-lg"
                      >
                        <span className="font-medium capitalize">{type}</span>
                        <span className="text-lg font-bold text-primary">{count}</span>
                      </div>
                    );
                  })}
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Total Rooms</span>
                      <span className="text-xl font-bold text-primary">
                        {roomsData.reduce((sum, r) => sum + (r.count || 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TimeTracking;