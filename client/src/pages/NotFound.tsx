import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Fake News Detector</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          className="text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <h1 className="text-8xl font-bold text-primary mb-2">404</h1>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Page Not Found</h2>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <Link to="/">
            <Button className="gap-2">
              <Home className="h-4 w-4" />
              Return to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
