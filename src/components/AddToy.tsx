import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Loader2, X } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../lib/supabase';
import { Header } from './Header';
import { Breadcrumb } from './Breadcrumb';
import toast from 'react-hot-toast';

interface QRData {
  serialNumber: string;
  activationKey: string;
}

export function AddToy() {
  const navigate = useNavigate();
  const [serialNumber, setSerialNumber] = useState('');
  const [activationKey, setActivationKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      // Cleanup scanner on component unmount
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        stopScanner();
      }
    };

    if (isScanning) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isScanning]);

  const startScanner = () => {
    setIsScanning(true);
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        { 
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          rememberLastUsedCamera: true,
        },
        false
      );
      scannerRef.current.render(onScanSuccess, onScanError);
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      setIsScanning(false);
    }
  };

  const onScanSuccess = (decodedText: string) => {
    try {
      const data: QRData = JSON.parse(decodedText);
      setSerialNumber(data.serialNumber);
      setActivationKey(data.activationKey);
      stopScanner();
      toast.success('QR code scanned successfully!');
    } catch (error) {
      toast.error('Invalid QR code format');
    }
  };

  const onScanError = (error: string) => {
    console.error(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate serial number exists in mqtt_auth
      const { data: mqttAuth, error: mqttError } = await supabase
        .from('mqtt_auth')
        .select('serial_number')
        .eq('serial_number', serialNumber)
        .eq('is_active', true)
        .single();

      if (mqttError || !mqttAuth) {
        throw new Error('Invalid serial number or toy is not activated');
      }

      // Verify activation key length
      if (activationKey.length < 6) {
        throw new Error('Invalid activation key');
      }

      // Check if toy already exists
      const { data: existingToy } = await supabase
        .from('toys')
        .select('id')
        .eq('serial_number', serialNumber)
        .single();

      if (existingToy) {
        // Update existing toy's user_id
        const { error: updateError } = await supabase
          .from('toys')
          .update({ user_id: user.id })
          .eq('serial_number', serialNumber);

        if (updateError) throw updateError;
        toast.success('Toy transferred to your account successfully!');
      } else {
        // Create new toy
        const { error: insertError } = await supabase.from('toys').insert([
          {
            user_id: user.id,
            serial_number: serialNumber,
            name: `Toy ${Math.floor(Math.random() * 1000)}`,
            activation_key: activationKey,
            role_type: 'Puzzle Solver',
            language: 'English',
            voice: 'Sparkles for Kids'
          }
        ]);

        if (insertError) throw insertError;
        toast.success('Toy added successfully!');
      }

      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add toy');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb />
        
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-8">
            <h2 className="text-2xl font-bold text-primary-900 text-center mb-8">Add New Toy</h2>

            <div className="mb-8 text-center">
              <button
                onClick={startScanner}
                className="inline-flex items-center justify-center w-32 h-32 bg-primary-100 rounded-full mb-4 hover:bg-primary-200 transition-colors cursor-pointer"
              >
                <QrCode className="h-12 w-12 text-primary-500" />
              </button>
              <p className="text-sm text-primary-600">Click to scan QR code</p>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-primary-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white text-sm text-primary-500">OR</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="sn" className="block text-sm font-medium text-primary-700 mb-1">
                  Serial Number
                </label>
                <input
                  id="sn"
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg border border-primary-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter serial number"
                  required
                />
              </div>

              <div>
                <label htmlFor="key" className="block text-sm font-medium text-primary-700 mb-1">
                  Activation Key
                </label>
                <input
                  id="key"
                  type="text"
                  value={activationKey}
                  onChange={(e) => setActivationKey(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg border border-primary-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter activation key"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Toy'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* QR Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={modalRef} className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-primary-900">Scan QR Code</h3>
              <button
                onClick={stopScanner}
                className="p-2 hover:bg-primary-50 rounded-full"
              >
                <X className="h-5 w-5 text-primary-500" />
              </button>
            </div>
            <div id="qr-reader" className="rounded-lg overflow-hidden" />
            <p className="text-sm text-primary-600 text-center mt-4">
              Position the QR code within the frame to scan
            </p>
          </div>
        </div>
      )}
    </div>
  );
}