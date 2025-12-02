import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  useEffect(() => {
    // Config for the scanner
    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 150 }, // Rectangular box better for barcodes
      aspectRatio: 1.0
    };
    
    // Initialize scanner
    const scanner = new Html5QrcodeScanner("reader", config, false);
    
    scanner.render(
      (decodedText) => {
        // Success callback
        // Play a beep sound if possible
        const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play failed', e));

        onScan(decodedText);
        // We don't clear automatically to allow continuous scanning
        // But in many cases we might want to pause. 
        // For now, the parent handles closing or ignoring dupes.
      }, 
      (errorMessage) => {
        // Error callback (ignore frequent read errors)
      }
    );

    // Cleanup
    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/90 z-[70] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-md relative flex flex-col">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800">Scan Barcode</h3>
            <button 
                onClick={onClose}
                className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full text-gray-600 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
        
        <div className="p-4 bg-black">
             <div id="reader" className="w-full bg-white rounded-lg overflow-hidden"></div>
        </div>
        
        <div className="p-4 text-center text-sm text-gray-500 bg-gray-50">
           Point camera at a barcode. Ensure good lighting.
        </div>
      </div>
    </div>
  );
};
