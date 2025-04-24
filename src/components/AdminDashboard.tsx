import React, { useState, useEffect } from 'react';
import { Plus, Loader2, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Header } from './Header';
import { Breadcrumb } from './Breadcrumb';
import toast from 'react-hot-toast';

interface MqttAuth {
  serial_number: string;
  is_active: boolean;
  created_at: string;
}

export function AdminDashboard() {
  const [devices, setDevices] = useState<MqttAuth[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    loadDevices();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAdmin(user?.email === 'admin@gmail.com' || user?.email === 'rahul@craftech360.com');
  };

  const loadDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('mqtt_auth')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error loading devices:', error);
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSerialNumber.trim()) return;

    setAdding(true);
    try {
      const { error } = await supabase
        .from('mqtt_auth')
        .insert([
          {
            serial_number: newSerialNumber,
            password_hash: 'default_hash', // In production, use a proper hash
            is_active: true
          }
        ]);

      if (error) throw error;

      toast.success('Device added successfully');
      setNewSerialNumber('');
      loadDevices();
    } catch (error) {
      console.error('Error adding device:', error);
      toast.error('Failed to add device');
    } finally {
      setAdding(false);
    }
  };

  const toggleDeviceStatus = async (serialNumber: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('mqtt_auth')
        .update({ is_active: !currentStatus })
        .eq('serial_number', serialNumber);

      if (error) throw error;

      toast.success('Device status updated');
      loadDevices();
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error('Failed to update device');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-primary-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary-900">Access Denied</h2>
            <p className="mt-2 text-primary-600">You don't have permission to access this page.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb />
        
        <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-8">
          <h2 className="text-2xl font-bold text-primary-900 mb-8">Device Management</h2>

          <form onSubmit={handleAddDevice} className="mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                value={newSerialNumber}
                onChange={(e) => setNewSerialNumber(e.target.value)}
                placeholder="Enter device serial number"
                className="flex-1 px-4 py-2 rounded-lg border border-primary-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={adding || !newSerialNumber.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {adding ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span className="ml-2">Add Device</span>
              </button>
            </div>
          </form>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-primary-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                      Serial Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-primary-100">
                  {devices.map((device) => (
                    <tr key={device.serial_number}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-900">
                        {device.serial_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          device.is_active 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {device.is_active ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          {device.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-500">
                        {new Date(device.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => toggleDeviceStatus(device.serial_number, device.is_active)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          {device.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}