import React from 'react';
import { Settings, Plus, Bot, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Header } from './Header';
import { Breadcrumb } from './Breadcrumb';

interface Toy {
  id: string;
  name: string;
  role_type: string;
  serial_number: string;
  last_online: string | null;
}

export function ToyList() {
  const [toys, setToys] = React.useState<Toy[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadToys();
  }, []);

  const loadToys = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get toys for current user
      const { data, error } = await supabase
        .from('toys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setToys(data || []);
    } catch (error) {
      console.error('Error loading toys:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOnline = (lastOnline: string | null) => {
    if (!lastOnline) return false;
    const lastSeen = new Date(lastOnline);
    const now = new Date();
    return now.getTime() - lastSeen.getTime() < 5 * 60 * 1000; // 5 minutes
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <Breadcrumb />
          <Link
            to="/add-toy"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Toy
          </Link>
        </div>

        {toys.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Bot className="h-12 w-12 text-primary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-primary-900 mb-2">No toys yet</h3>
            <p className="text-primary-500 mb-4">Get started by adding your first AI toy</p>
            <Link
              to="/add-toy"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-500 bg-primary-50 hover:bg-primary-100"
            >
              Add Your First Toy
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {toys.map((toy) => (
              <div
                key={toy.id}
                className="bg-white rounded-lg shadow-sm border border-primary-100 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Bot className="h-6 w-6 text-primary-500" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-primary-900">{toy.name}</h3>
                        <p className="text-sm text-primary-500">{toy.role_type}</p>
                      </div>
                    </div>
                    <Link
                      to={`/toy/${toy.id}/settings`}
                      className="p-2 text-primary-400 hover:text-primary-500 rounded-full hover:bg-primary-50"
                    >
                      <Settings className="h-5 w-5" />
                    </Link>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {isOnline(toy.last_online) ? (
                        <>
                          <Wifi className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-500">Online</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-4 w-4 text-primary-400" />
                          <span className="text-sm text-primary-400">Offline</span>
                        </>
                      )}
                    </div>
                    <span className="text-xs text-primary-400">
                      SN: {toy.serial_number}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}