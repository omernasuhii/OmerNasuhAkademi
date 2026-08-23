import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, Flashlight, SwitchCamera, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'focuson-barcode-reader';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setError(null);
      setScannedResult(null);
      return;
    }

    let isMounted = true;

    const initScanner = async () => {
      try {
        setError(null);
        setScannedResult(null);

        // Get list of cameras
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (!devices || devices.length === 0) {
          setError('Cihazınızda kullanılabilir kamera bulunamadı.');
          return;
        }

        setCameras(devices);

        // Prefer rear / back camera (environment)
        const backCamera = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') || 
          d.label.toLowerCase().includes('arka') ||
          d.label.toLowerCase().includes('environment')
        ) || devices[devices.length - 1];

        const cameraIdToUse = backCamera?.id || devices[0].id;
        setSelectedCameraId(cameraIdToUse);

        await startScanningWithCamera(cameraIdToUse);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Camera init error:', err);
        if (err?.name === 'NotAllowedError' || err?.toString?.().includes('Permission denied')) {
          setError('Kamera erişim izni verilmedi. Lütfen tarayıcı ayarlarından kameraya izin verin.');
        } else {
          setError(err?.message || 'Kamera başlatılırken bir sorun oluştu.');
        }
      }
    };

    // Slight delay to ensure DOM container is rendered
    const timer = setTimeout(() => {
      initScanner();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const startScanningWithCamera = async (cameraId: string) => {
    try {
      await stopScanner();

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE
        ],
        verbose: false
      });

      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const width = Math.min(viewfinderWidth * 0.85, 360);
          const height = Math.min(viewfinderHeight * 0.45, 180);
          return { width, height };
        },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          handleSuccessfulScan(decodedText);
        },
        () => {
          // Frame parsed without barcode detection (silent)
        }
      );

      setIsScanning(true);

      // Check if torch / flashlight is supported
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities();
        if (capabilities && (capabilities as any).torch) {
          setTorchAvailable(true);
        } else {
          setTorchAvailable(false);
        }
      } catch {
        setTorchAvailable(false);
      }
    } catch (err: any) {
      console.error('Failed to start scanner on camera:', err);
      setError('Kamera başlatılamadı. Lütfen başka bir kamera seçin veya izinleri kontrol edin.');
    }
  };

  const handleSuccessfulScan = (code: string) => {
    if (!code) return;
    const cleanCode = code.trim().replace(/[^0-9X]/gi, '');
    if (!cleanCode) return;

    // Haptic vibration feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    setScannedResult(cleanCode);
    stopScanner();

    // Short confirmation before returning result
    setTimeout(() => {
      onScanSuccess(cleanCode);
      onClose();
    }, 450);
  };

  const stopScanner = async () => {
    const scanner = html5QrCodeRef.current;
    html5QrCodeRef.current = null;
    setIsScanning(false);
    setIsTorchOn(false);

    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch (err) {
        console.warn('Warning stopping scanner tracks:', err);
      }

      try {
        scanner.clear();
      } catch (err) {
        console.warn('Warning clearing scanner DOM:', err);
      }
    }
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !torchAvailable) return;
    try {
      const nextState = !isTorchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any]
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.error('Failed to toggle torch:', err);
    }
  };

  const handleCameraChange = async (newCamId: string) => {
    setSelectedCameraId(newCamId);
    await startScanningWithCamera(newCamId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
      {/* Container */}
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Barkod Okuyucu</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md">
                  Kamera
                </span>
              </h3>
              <p className="text-xs text-slate-400">Kitabın arkasındaki 13 haneli ISBN barkodunu hizalayın</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Camera Viewport Area */}
        <div className="relative flex-1 bg-black min-h-[300px] sm:min-h-[360px] flex items-center justify-center overflow-hidden">
          
          {/* html5-qrcode target DOM element */}
          <div id={scannerContainerId} className="w-full h-full" />

          {/* Overlay Framing Box */}
          {isScanning && !scannedResult && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              {/* Target Aim Box */}
              <div className="relative w-full max-w-[320px] h-40 rounded-2xl border-2 border-dashed border-indigo-400/80 bg-indigo-500/5 flex items-center justify-center shadow-lg">
                {/* Corner Markers */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-xl" />

                {/* Animated Laser Scanning Line */}
                <div className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_rgba(239,68,68,1)] animate-bounce" />

                <span className="text-[11px] font-bold text-white/80 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                  Barkodu çerçevenin içine getirin
                </span>
              </div>
            </div>
          )}

          {/* Success Overlay Animation */}
          {scannedResult && (
            <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mb-3">
                <CheckCircle2 size={36} />
              </div>
              <h4 className="text-lg font-black text-white mb-1">Barkod Başarıyla Okundu!</h4>
              <p className="font-mono text-xl font-black text-emerald-400 bg-black/40 px-4 py-1.5 rounded-xl border border-emerald-500/30">
                {scannedResult}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="absolute inset-x-4 top-4 p-4 bg-red-950/90 border border-red-500/40 rounded-2xl flex items-start gap-3 text-red-200 text-xs backdrop-blur-md z-20">
              <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold mb-1">Kamera Hatası</p>
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls Toolbar */}
        <div className="p-4 bg-slate-900 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          {/* Camera Selection Switch */}
          {cameras.length > 1 ? (
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <SwitchCamera size={16} className="text-slate-400 shrink-0" />
              <select
                value={selectedCameraId}
                onChange={(e) => handleCameraChange(e.target.value)}
                className="bg-slate-800 border border-white/10 text-white text-xs rounded-xl py-2 px-3 outline-none focus:border-indigo-500 flex-1 truncate cursor-pointer"
              >
                {cameras.map((cam, idx) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Kamera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-400" />
              <span>Otomatik Barkod Tarama Aktif</span>
            </div>
          )}

          {/* Flashlight toggle (if supported by hardware) */}
          <div className="flex items-center gap-2">
            {torchAvailable && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isTorchOn 
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
                title="Flaş / Fener"
              >
                <Flashlight size={16} />
                <span className="hidden sm:inline">{isTorchOn ? 'Feneri Kapat' : 'Feneri Aç'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
