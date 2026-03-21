import { useEffect, useState, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlayCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface ContentItem {
  id: number;
  title: string;
  url: string;
  platform: string;
  created_at: string;
}

const ContentPage = () => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadContents = async () => {
    try {
      setLoading(true);
      const response = await api.getContents({ page, limit: 9 });

      if (response.success && response.data) {
        setContents(response.data.contents || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
        }
      }
    } catch (error: any) {
      console.error('Error loading contents:', error);
      toast.error(error.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  // Load TikTok embed script once
  useEffect(() => {
    if (document.querySelector('script[src="https://www.tiktok.com/embed.js"]')) {
      return; // Script already loaded
    }

    const script = document.createElement('script');
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount
      const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  useEffect(() => {
    loadContents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Extract video ID from TikTok URL
  const extractTikTokVideoId = (url: string): string | null => {
    try {
      // Handle different TikTok URL formats:
      // https://www.tiktok.com/@username/video/1234567890
      // https://vm.tiktok.com/xxxxx/ (short URL - needs to be resolved)
      // https://www.tiktok.com/t/ZTxxxxx/
      
      const urlObj = new URL(url);
      
      // Check if it's a vm.tiktok.com short URL
      if (urlObj.hostname.includes('vm.tiktok.com')) {
        // For short URLs, we'll use the full URL in the embed
        return null;
      }
      
      // Extract from standard TikTok URL format: /@username/video/VIDEO_ID
      const pathParts = urlObj.pathname.split('/');
      const videoIndex = pathParts.indexOf('video');
      if (videoIndex !== -1 && pathParts[videoIndex + 1]) {
        return pathParts[videoIndex + 1];
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing TikTok URL:', error);
      return null;
    }
  };

  // Component to render TikTok embed using official TikTok embed method
  const TikTokEmbed = ({ url, title }: { url: string; title: string }) => {
    const embedRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef<HTMLDivElement>(null);
    const videoId = extractTikTokVideoId(url);

    useEffect(() => {
      if (!embedRef.current) return;

      // Clear previous content
      embedRef.current.innerHTML = '';

      // Create TikTok embed blockquote
      const blockquote = document.createElement('blockquote');
      blockquote.className = 'tiktok-embed';
      blockquote.setAttribute('cite', url);
      blockquote.style.maxWidth = '100%';
      blockquote.style.minWidth = '325px';
      blockquote.style.width = '100%';
      blockquote.style.height = '100%';
      
      if (videoId) {
        blockquote.setAttribute('data-video-id', videoId);
      }

      const section = document.createElement('section');
      blockquote.appendChild(section);

      embedRef.current.appendChild(blockquote);

      // Function to render embed
      const renderEmbed = () => {
        if ((window as any).tiktokEmbed?.lib?.render && embedRef.current) {
          (window as any).tiktokEmbed.lib.render(embedRef.current);
          // Hide loading message after a short delay
          setTimeout(() => {
            if (loadingRef.current) {
              loadingRef.current.style.display = 'none';
            }
          }, 1000);
        }
      };

      // Render embed if TikTok script is already loaded
      if ((window as any).tiktokEmbed?.lib?.render) {
        renderEmbed();
      } else {
        // Wait for script to load
        const checkScript = setInterval(() => {
          if ((window as any).tiktokEmbed?.lib?.render) {
            renderEmbed();
            clearInterval(checkScript);
          }
        }, 100);

        // Cleanup interval after 10 seconds
        setTimeout(() => {
          clearInterval(checkScript);
          // If still loading after 10 seconds, hide loading message
          if (loadingRef.current) {
            loadingRef.current.style.display = 'none';
          }
        }, 10000);
      }
    }, [url, videoId]);

    // Fallback for short URLs or if embed fails
    if (!videoId) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black text-white p-6">
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="relative mb-4">
              <PlayCircle className="h-20 w-20 opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
              </div>
            </div>
            <h3 className="font-semibold text-center mb-2 line-clamp-2 text-sm px-2">
              {title}
            </h3>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Watch on TikTok
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="w-full h-full bg-black overflow-hidden"
        style={{ minHeight: '100%', position: 'relative' }}
      >
        {/* Loading state */}
        <div 
          ref={loadingRef}
          className="absolute inset-0 flex items-center justify-center bg-black z-10"
        >
          <div className="text-white text-sm opacity-60">Loading TikTok video...</div>
        </div>
        {/* Embed container */}
        <div 
          ref={embedRef} 
          className="w-full h-full"
          style={{ minHeight: '100%' }}
        />
      </div>
    );
  };

  return (
    <Layout>
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <span className="text-primary font-medium text-sm uppercase tracking-wider">
                Social Content
              </span>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2 mb-3">
                TikTok Videos
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Watch our latest TikTok content featuring Buneko Nepal handmade
                flowers and arrangements.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl self-start"
              onClick={loadContents}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Content grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="space-y-3">
                  <Skeleton className="w-full aspect-[9/16] rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : contents.length === 0 ? (
            <div className="text-center py-16">
              <PlayCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-60" />
              <p className="text-muted-foreground">
                No TikTok content has been added yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contents.map((item) => (
                <div
                  key={item.id}
                  className="bg-card rounded-2xl shadow-soft overflow-hidden flex flex-col"
                >
                  <div className="relative w-full aspect-[9/16] bg-black rounded-t-2xl overflow-hidden flex items-center justify-center">
                    <TikTokEmbed url={item.url} title={item.title} />
                  </div>
                  <div className="p-4">
                    <h2 className="font-serif text-base font-semibold text-foreground line-clamp-2">
                      {item.title}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-10">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ContentPage;


