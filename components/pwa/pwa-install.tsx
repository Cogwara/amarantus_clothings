'use client';

import * as React from 'react';
import { Download, Sparkles, X, Smartphone, Check } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [showIosGuide, setShowIosGuide] = React.useState(false);
  const [showBanner, setShowBanner] = React.useState(false);

  React.useEffect(() => {
    // Check if already in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('Amarantus PWA Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.error('Service Worker registration error:', err);
          });
      });
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt banner after 3 seconds of browsing
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem('amarantus_pwa_dismissed');
        if (!dismissed) {
          setShowBanner(true);
        }
      }, 3500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowBanner(false);
      console.log('Amarantus PWA installed successfully');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // Check if iOS
    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowBanner(false);
      }
    } else {
      // Fallback for browsers that don't support beforeinstallprompt
      setShowIosGuide(true);
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    try {
      localStorage.setItem('amarantus_pwa_dismissed', 'true');
    } catch {}
  };

  return (
    <>
      {/* Install Floating Promo Banner (non-intrusive bottom banner) */}
      {showBanner && !isInstalled && (
        <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-[#17211B] text-white p-3.5 rounded-[16px] shadow-2xl border border-white/10 animate-slideUp flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#16803C] p-0.5 overflow-hidden shrink-0 shadow">
              <img
                src="/icon-192.png"
                alt="Amarantus"
                className="w-full h-full object-cover rounded-[8px]"
              />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>Install Amarantus App</span>
                <span className="text-[10px] bg-[#F28C28] text-white px-1.5 py-0.2 rounded-full font-black">
                  NEW
                </span>
              </h4>
              <p className="text-[11px] text-[#A6B5AC]">
                Faster browsing, quick offline bag & direct notifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={handleInstallClick}
              className="text-xs font-bold shadow-sm whitespace-nowrap bg-[#16803C] hover:bg-[#126630]"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              <span>Install</span>
            </Button>
            <button
              onClick={handleDismissBanner}
              className="p-1 rounded-full text-[#8A968F] hover:text-white transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS & Manual Installation Guide Modal */}
      <Modal
        isOpen={showIosGuide}
        onClose={() => setShowIosGuide(null as any)}
        title="Install Amarantus Clothings App"
        maxWidth="sm"
      >
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-[#F8FAF9] rounded-[12px] border border-[#DDE5DF]">
            <div className="w-12 h-12 rounded-[10px] bg-[#16803C] p-0.5 overflow-hidden shrink-0">
              <img
                src="/icon-192.png"
                alt="Amarantus"
                className="w-full h-full object-cover rounded-[8px]"
              />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#17211B]">Amarantus Clothings</h4>
              <p className="text-xs text-[#66736B]">Instant Home Screen App</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-[#17211B]">
            <p className="font-semibold text-sm">How to install on your phone:</p>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 p-2 rounded-[8px] bg-white border border-[#EBEFEA]">
                <span className="w-5 h-5 rounded-full bg-[#EAF7EE] text-[#16803C] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="block font-bold">On iPhone / iPad (Safari):</strong>
                  <span>Tap the <strong>Share</strong> button at the bottom of your browser (box with arrow pointing up).</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-[8px] bg-white border border-[#EBEFEA]">
                <span className="w-5 h-5 rounded-full bg-[#EAF7EE] text-[#16803C] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="block font-bold">Select &apos;Add to Home Screen&apos;:</strong>
                  <span>Scroll down and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong> in the top-right corner.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-[8px] bg-white border border-[#EBEFEA]">
                <span className="w-5 h-5 rounded-full bg-[#EAF7EE] text-[#16803C] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="block font-bold">On Android / Chrome:</strong>
                  <span>Tap the <strong>three dots menu (⋮)</strong> at top-right and choose <strong>Install App</strong> or <strong>Add to Home Screen</strong>.</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setShowIosGuide(false)}
            className="w-full font-bold mt-2"
          >
            Got it, thanks!
          </Button>
        </div>
      </Modal>
    </>
  );
}

// Compact install button component for Header & Navigation
export function InstallAppButton({ className = '' }: { className?: string }) {
  const [canInstall, setCanInstall] = React.useState(true);

  const handleClick = () => {
    // Trigger global event or custom action
    const event = new CustomEvent('open-amarantus-install');
    window.dispatchEvent(event);

    // If deferredPrompt is available globally on window
    if ((window as any).__amarantus_install_prompt) {
      (window as any).__amarantus_install_prompt.prompt();
    } else {
      // Trigger modal alert
      const isIos =
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIos) {
        alert(
          "To install Amarantus on iPhone: Tap the Share button at the bottom of Safari, then choose 'Add to Home Screen'."
        );
      } else {
        alert(
          "To install Amarantus: Tap the menu (⋮) in your browser and choose 'Install App' or 'Add to Home Screen'."
        );
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-[#16803C] hover:bg-[#126630] text-white text-xs font-bold transition-all shadow-sm active:scale-95 ${className}`}
      title="Install Amarantus App on your device"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Install App</span>
    </button>
  );
}
