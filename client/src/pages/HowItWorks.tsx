import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, Search, Brain, CheckCircle, AlertCircle, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';

const HowItWorks = () => {
  const steps = [
    {
      icon: Search,
      title: 'Enter News Content',
      description: 'Paste a news headline or URL into our search box. You can check any news article, social media post, or headline you come across.',
      color: 'text-blue-500',
    },
    {
      icon: Brain,
      title: 'AI Analysis',
      description: 'Our advanced machine learning algorithms analyze the content using natural language processing, checking linguistic patterns, source credibility, and cross-referencing with verified databases.',
      color: 'text-purple-500',
    },
    {
      icon: CheckCircle,
      title: 'Get Results',
      description: 'Receive instant feedback on the authenticity of the news. Our system provides a clear verdict along with confidence scores and detailed analysis.',
      color: 'text-success',
    },
  ];

  const features = [
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Get verification results in seconds, not hours',
    },
    {
      icon: Brain,
      title: 'AI-Powered',
      description: 'Advanced machine learning for accurate detection',
    },
    {
      icon: Shield,
      title: 'Reliable',
      description: 'Cross-referenced with trusted news sources',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Fake News Detector</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1 ml-4">
            <Link to="/about">
              <Button variant="ghost" size="sm" className="text-xs h-8">
                About
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="ghost" size="sm" className="text-xs h-8 bg-sidebar-accent">
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
                How It Works
              </h1>
              <p className="text-lg text-muted-foreground">
                Verify news authenticity in three simple steps
              </p>
            </div>

            {/* Steps Section */}
            <div className="mb-12 space-y-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  className="flex gap-6 p-6 rounded-lg bg-card border border-border"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <step.icon className={`h-6 w-6 ${step.color}`} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-primary">Step {index + 1}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Features Section */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
                Why Choose Our Detector?
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="p-6 rounded-lg bg-card border border-border text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Detection Indicators */}
            <motion.div
              className="mb-12 p-6 rounded-lg bg-card border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Understanding Results
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-success/10 border border-success/20">
                  <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Real News</h3>
                    <p className="text-sm text-muted-foreground">
                      The content appears to be authentic and from credible sources. Our AI has verified 
                      the information against trusted databases and found no red flags.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-error/10 border border-error/20">
                  <AlertCircle className="h-6 w-6 text-error flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Fake News</h3>
                    <p className="text-sm text-muted-foreground">
                      The content shows signs of misinformation. This could include misleading headlines, 
                      unverified sources, or patterns commonly found in fake news.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div
              className="text-center p-8 rounded-lg bg-primary/10 border border-primary/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                Ready to start verifying?
              </h2>
              <p className="text-muted-foreground mb-6">
                Try our fake news detector now and stay informed
              </p>
              <Link to="/">
                <Button size="lg" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Start Detecting
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

export default HowItWorks;
