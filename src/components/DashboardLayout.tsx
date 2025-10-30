import { ReactNode } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Clock, 
  Calendar, 
  Umbrella, 
  TrendingUp, 
  QrCode,
  LogOut,
  User
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Clock, label: "Time Tracking", path: "/dashboard/time-tracking" },
    { icon: Calendar, label: "Schedule", path: "/dashboard/schedule" },
    { icon: Umbrella, label: "Leave Management", path: "/dashboard/leaves" },
    { icon: TrendingUp, label: "Performance", path: "/dashboard/performance" },
    { icon: QrCode, label: "QR Scanner", path: "/dashboard/qr-scan" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Hotel Management</h1>
              <p className="text-xs text-muted-foreground">Worker Portal</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/profile")}>
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-card min-h-[calc(100vh-4rem)]">
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 z-50">
        <div className="flex justify-around p-2">
          {menuItems.slice(0, 5).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[60px] ${
                isActive(item.path)
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label.split(" ")[0]}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;