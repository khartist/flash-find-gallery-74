
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BarChart2, Home } from "lucide-react";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Home className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            FlashFind
          </span>
        </Link>
        
        <Link to="/stats">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span>Statistics</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;
