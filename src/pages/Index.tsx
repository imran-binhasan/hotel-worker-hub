import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
      <div className="text-center text-white space-y-6 p-8">
        <div className="mx-auto w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mb-4">
          <Clock className="w-12 h-12" />
        </div>
        <h1 className="text-5xl font-bold">Hotel Management System</h1>
        <p className="text-xl text-white/90">Worker Portal</p>
        <Button onClick={() => navigate("/auth")} size="lg" className="mt-8 bg-white text-primary hover:bg-white/90">
          Sign In to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Index;
