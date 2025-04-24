import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Save, Bot, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendToyUpdate } from '../lib/mqtt';
import { Header } from './Header';
import { Breadcrumb } from './Breadcrumb';
import toast from 'react-hot-toast';

interface Toy {
  id: string;
  name: string;
  serial_number: string;
  role_type: 'Puzzle Solver' | 'Story Teller' | 'Math Tutor';
  language: 'English' | 'Spanish' | 'French' | 'Hindi';
  voice: 'Sparkles for Kids' | 'Deep Voice' | 'Soft Calm Voice';
}

export function ToySettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [toy, setToy] = useState<Toy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [roleType, setRoleType] = useState<Toy['role_type']>('Puzzle Solver');
  const [language, setLanguage] = useState<Toy['language']>('English');
  const [voice, setVoice] = useState<Toy['voice']>('Sparkles for Kids');

  useEffect(() => {
    loadToy();
  }, [id]);

  const loadToy = async () => {
    try {
      if (!id) {
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('toys')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        throw new Error('Toy not found');
      }

      setToy(data);
      setName(data.name);
      setRoleType(data.role_type);
      setLanguage(data.language);
      setVoice(data.voice);
    } catch (error) {
      console.error('Error loading toy:', error);
      toast.error('Toy not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // First save to database
      const { error } = await supabase
        .from('toys')
        .update({
          name,
          role_type: roleType,
          language,
          voice,
        })
        .eq('id', id);

      if (error) throw error;

      // Then try to update the toy via MQTT
      if (toy) {
        try {
          // Assuming sendToyUpdate now returns more detailed info
          const result = await sendToyUpdate(toy.serial_number, roleType, language, voice);
          toast.success('Settings saved and toy updated successfully!');
          console.log("MQTT Update Result:", result); // Log the result

        } catch (mqttError) {
          console.error('MQTT Error:', mqttError);
          toast.success('Settings saved to database, but failed to update toy. It will update when the toy comes online.');
        }
      }

      navigate('/');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this toy? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('toys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Toy deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Error deleting toy:', error);
      toast.error('Failed to delete toy');
    } finally {
      setDeleting(false);
    }
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

  if (!toy) {
    return null;
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb />
        
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-8">
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <Bot className="h-8 w-8 text-primary-500" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-primary-700 mb-1">
                  Toy Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg border border-primary-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter toy name"
                  required
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-primary-700 mb-1">
                  Role Type
                </label>
                <select
                  id="role"
                  value={roleType}
                  onChange={(e) => setRoleType(e.target.value as Toy['role_type'])}
                  className="block w-full px-4 py-3 rounded-lg border border-primary-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="Puzzle Solver">Puzzle Solver</option>
                  <option value="Story Teller">Story Teller</option>
                  <option value="Math Tutor">Math Tutor</option>
                </select>
              </div>

              <div>
                <label htmlFor="language" className="block text-sm font-medium text-primary-700 mb-1">
                  Language
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Toy['language'])}
                  className="block w-full px-4 py-3 rounded-lg border border-primary-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>

              <div>
                <label htmlFor="voice" className="block text-sm font-medium text-primary-700 mb-1">
                  Voice
                </label>
                <select
                  id="voice"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value as Toy['voice'])}
                  className="block w-full px-4 py-3 rounded-lg border border-primary-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="Sparkles for Kids">Sparkles for Kids</option>
                  <option value="Deep Voice">Deep Voice</option>
                  <option value="Soft Calm Voice">Soft Calm Voice</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-6">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center px-4 py-2 border border-primary-300 text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Toy
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}