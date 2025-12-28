import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Code, Home, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Fake News Detector
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1 ml-4">
            <Link to="/about">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 bg-sidebar-accent"
              >
                About
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="ghost" size="sm" className="text-xs h-8">
                How it Works
              </Button>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Hero Section */}
            <div className="mb-12">
              <Link to="/">
                <Button variant="ghost" size="sm" className="mb-6 -ml-2">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                About Us
              </h1>
              <p className="text-lg text-muted-foreground">
                Fighting misinformation with advanced AI technology
              </p>
            </div>

            {/* Mission Section */}
            <motion.div
              className="mb-12 p-6 rounded-lg bg-card border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">
                  Our Mission
                </h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                In an era where misinformation spreads faster than ever, we're
                committed to providing a reliable, accessible tool that helps
                people verify the authenticity of news content. Our AI-powered
                platform analyzes news headlines and articles to detect
                potential fake news, empowering users to make informed
                decisions.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We believe that access to accurate information is a fundamental
                right, and our mission is to make fact-checking as simple and
                instant as possible for everyone.
              </p>
            </motion.div>

            {/* Technology Section */}
            <motion.div
              className="mb-12 p-6 rounded-lg bg-card border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Code className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">
                  Technology
                </h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our platform leverages state-of-the-art machine learning
                algorithms and natural language processing to analyze news
                content. The system examines multiple factors including:
              </p>
              <ul className="space-y-2 text-muted-foreground ml-6">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Linguistic patterns and writing style analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Source credibility and verification</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Cross-referencing with verified news databases</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Sentiment and bias detection</span>
                </li>
              </ul>
            </motion.div>

            {/* Team Section */}
            <motion.div
              className="mb-12 p-6 rounded-lg bg-card border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">
                  Developed By
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-sidebar-accent/50 border border-sidebar-border">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Rayhan Aziz Chowdhury Shafi
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Full Stack Developer
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div
              className="text-center p-8 rounded-lg bg-primary/10 border border-primary/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                Ready to verify news?
              </h2>
              <p className="text-muted-foreground mb-6">
                Start checking news authenticity instantly with our AI-powered
                detector
              </p>
              <Link to="/">
                <Button size="lg" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Try Now
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Fake News Detector. Powered by AI Detection.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default About;
