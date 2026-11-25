import { Download, Smartphone, X } from 'lucide-react';
import { useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 transition-colors hover:border-zinc-900 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        title="Install on phone or desktop"
      >
        {isInstallable ? (
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        <span>Install App</span>
      </button>

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
        >
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="pwa-install-title"
                  className="text-base font-bold text-zinc-900"
                >
                  Install Capulana Shop Map on Phone
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Open this app outside any preview frame in your phone browser
                  to install it to your home screen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install instructions"
                className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-zinc-700">
              <div
                className={`rounded-md border p-3 ${
                  !isIOS
                    ? 'border-zinc-900 bg-zinc-50'
                    : 'border-zinc-200 bg-white'
                }`}
              >
                <p className="font-semibold text-zinc-900">
                  Android (Chrome / Edge)
                </p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-zinc-600">
                  <li>Open the shared app link in Google Chrome.</li>
                  <li>
                    Tap the 3-dot menu (top-right) and choose{' '}
                    <span className="font-semibold text-zinc-900">
                      Install app
                    </span>{' '}
                    or{' '}
                    <span className="font-semibold text-zinc-900">
                      Add to Home screen
                    </span>
                    .
                  </li>
                  <li>Confirm to add the icon to your home screen.</li>
                </ol>
              </div>

              <div
                className={`rounded-md border p-3 ${
                  isIOS
                    ? 'border-zinc-900 bg-zinc-50'
                    : 'border-zinc-200 bg-white'
                }`}
              >
                <p className="font-semibold text-zinc-900">iPhone / iPad (Safari)</p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-zinc-600">
                  <li>Open the shared app link in Safari.</li>
                  <li>
                    Tap the{' '}
                    <span className="font-semibold text-zinc-900">Share</span>{' '}
                    icon in Safari&apos;s toolbar.
                  </li>
                  <li>
                    Scroll down and tap{' '}
                    <span className="font-semibold text-zinc-900">
                      Add to Home Screen
                    </span>
                    .
                  </li>
                </ol>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-md bg-zinc-900 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      className="fixed top-16 left-1/2 z-40 -translate-x-1/2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm"
    >
      Offline mode — using saved local layout
    </div>
  );
}
