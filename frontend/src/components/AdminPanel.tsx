import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Globe, RefreshCw, Check, AlertCircle, Loader2 } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [urls, setUrls] = useState<string[]>(['']);
  const [scraping, setScraping] = useState(false);
  const [results, setResults] = useState<Array<{
    url: string;
    success: boolean;
    pagesScraped?: number;
    error?: string;
  }>>([]);

  const addUrl = () => {
    setUrls([...urls, '']);
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const handleScrape = async () => {
    const validUrls = urls.filter(url => url.trim());
    if (validUrls.length === 0) return;

    setScraping(true);
    setResults([]);

    try {
      const response = await fetch('/api/scrape/multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: validUrls, maxPagesPerSite: 10 }),
      });

      const data = await response.json();
      if (data.success) {
        setResults(data.results);
      }
    } catch (error) {
      console.error('Scrape error:', error);
    } finally {
      setScraping(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto px-6 py-12"
    >
      <div className="glass rounded-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold">Admin Panel</h2>
            <p className="text-white/60 mt-1">Configure your AI assistant</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Website Scraper Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-cyan/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-accent-cyan" />
            </div>
            <div>
              <h3 className="font-semibold">Knowledge Base</h3>
              <p className="text-sm text-white/60">Add websites for the AI to learn from</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {urls.map((url, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1 px-4 py-3 rounded-xl bg-dark-700 border border-white/5 focus:border-primary-500/50 outline-none text-white placeholder:text-white/30 transition-colors"
                />
                {urls.length > 1 && (
                  <button
                    onClick={() => removeUrl(index)}
                    className="p-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/40" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={addUrl}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
            >
              + Add URL
            </button>
            
            <button
              onClick={handleScrape}
              disabled={scraping || urls.every(u => !u.trim())}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {scraping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Scrape Websites
                </>
              )}
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-medium text-white/60 mb-3">Results</h4>
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-dark-700"
                >
                  {result.success ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-white/80 truncate">{result.url}</p>
                    <p className="text-xs text-white/40">
                      {result.success
                        ? `${result.pagesScraped} pages scraped`
                        : result.error}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Keys Section */}
        <div className="pt-8 border-t border-white/5">
          <h3 className="font-semibold mb-4">API Configuration</h3>
          <p className="text-sm text-white/60 mb-4">
            API keys are configured in the backend .env file. Make sure to set:
          </p>
          <ul className="space-y-2 text-sm text-white/60">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-500" />
              OPENAI_API_KEY - For GPT-4 reasoning
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent-cyan" />
              PINECONE_API_KEY - For knowledge base
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent-violet" />
              SUPABASE_URL & SUPABASE_KEY - For database
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              GOOGLE_CLIENT_ID/SECRET - For Calendar
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              ELEVENLABS_API_KEY - For voice responses
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}


