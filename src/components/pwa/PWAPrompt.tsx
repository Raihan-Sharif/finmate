"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { storage } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Plus, Share, Smartphone, Wallet, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from 'next-intl';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAPrompt() {
  const t = useTranslations('pwa');
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isInStandaloneMode = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;
      const isNavigatorStandalone =
        (window.navigator as any).standalone === true;
      setIsInstalled(isInStandaloneMode || isNavigatorStandalone);
    };

    // Check if device is iOS
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsIOS(isIOSDevice);
    };

    checkInstalled();
    checkIOS();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user has previously dismissed the prompt
      const dismissed = storage.get("pwa-prompt-dismissed");
      const lastDismissed = storage.get("pwa-prompt-last-dismissed");
      const now = Date.now();
      const weekInMs = 7 * 24 * 60 * 60 * 1000;

      // Show prompt if not dismissed or if it's been more than a week
      if (!dismissed || (typeof lastDismissed === 'number' && now - lastDismissed > weekInMs)) {
        setTimeout(() => setShowPrompt(true), 3000); // Show after 3 seconds
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Show iOS prompt for iOS devices after some time
    if (isIOS && !isInstalled) {
      const iosPromptDismissed = storage.get("ios-pwa-prompt-dismissed");
      const iosLastDismissed = storage.get("ios-pwa-prompt-last-dismissed");
      const now = Date.now();
      const weekInMs = 7 * 24 * 60 * 60 * 1000;

      if (
        !iosPromptDismissed ||
        (typeof iosLastDismissed === 'number' && now - iosLastDismissed > weekInMs)
      ) {
        setTimeout(() => setShowIOSPrompt(true), 5000);
      }
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isIOS, isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
        storage.set("pwa-prompt-dismissed", true);
        storage.set("pwa-prompt-last-dismissed", Date.now());
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error("Error installing PWA:", error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    storage.set("pwa-prompt-dismissed", true);
    storage.set("pwa-prompt-last-dismissed", Date.now());
  };

  const handleIOSDismiss = () => {
    setShowIOSPrompt(false);
    storage.set("ios-pwa-prompt-dismissed", true);
    storage.set("ios-pwa-prompt-last-dismissed", Date.now());
  };

  // Don't show anything if already installed
  if (isInstalled) return null;

  return (
    <>
      {/* Standard PWA Prompt */}
      <AnimatePresence>
        {showPrompt && deferredPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto"
          >
            <Card className="shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t('title')}</CardTitle>
                      <CardDescription className="text-sm">
                        {t('subtitle')}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <span>{t('benefits.worksOffline')}</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      <span>{t('benefits.fasterLoading')}</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                      <span>{t('benefits.pushNotifications')}</span>
                    </li>
                  </ul>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleInstallClick}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t('buttons.install')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDismiss}
                      size="sm"
                      className="px-3"
                    >
                      {t('buttons.later')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Installation Instructions */}
      <AnimatePresence>
        {showIOSPrompt && isIOS && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto"
          >
            <Card className="shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t('ios.title')}</CardTitle>
                      <CardDescription className="text-sm">
                        {t('ios.addToHomeScreen')}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleIOSDismiss}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-medium">{t('ios.title')}:</p>
                    <ol className="space-y-1 ml-4">
                      <li className="flex items-start space-x-2">
                        <span className="font-medium">1.</span>
                        <div className="flex items-center space-x-1">
                          <span>{t('ios.step1')}</span>
                          <Share className="w-4 h-4 text-blue-500" />
                          <span>{t('ios.shareButton')}</span>
                        </div>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="font-medium">2.</span>
                        <div className="flex items-center space-x-1">
                          <span>{t('ios.step2')}</span>
                          <Plus className="w-4 h-4 text-blue-500" />
                          <span>"{t('ios.addToHomeScreen')}"</span>
                        </div>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="font-medium">3.</span>
                        <span>{t('ios.step3')}</span>
                      </li>
                    </ol>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleIOSDismiss}
                    className="w-full"
                    size="sm"
                  >
                    Got it
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
