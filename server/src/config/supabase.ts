import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

export interface IMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  password?: string;
  avatar_url?: string;
  github_username?: string;
  created_at: string;
}

const FALLBACK_DIR = path.resolve('data');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'members_fallback.json');

let fallbackMembers: IMember[] = [];

const loadFallback = () => {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    if (fs.existsSync(FALLBACK_FILE)) {
      const raw = fs.readFileSync(FALLBACK_FILE, 'utf-8');
      fallbackMembers = JSON.parse(raw);
    } else {
      fallbackMembers = [
        {
          id: 'mem_1',
          name: 'Steve Wozniak',
          email: 'woz@thinkdifferent.com',
          role: 'Maintainer',
          status: 'Active',
          password: '$2a$10$TL2rXM33jBUmslOy/WwROrImYKwGepWkya-KOA_GCrja-qrExample',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          github_username: 'woz',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'mem_2',
          name: 'Ronald Wayne',
          email: 'ron@thinkdifferent.com',
          role: 'Developer',
          status: 'Inactive',
          password: '$2a$10$TL2rXM33jBUmslOy/WwROrImYKwGepWkya-KOA_GCrja-qrExample',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
          github_username: 'ronwayne',
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'mem_3',
          name: 'John Sculley',
          email: 'sculley@thinkdifferent.com',
          role: 'Admin',
          status: 'Active',
          password: '$2a$10$TL2rXM33jBUmslOy/WwROrImYKwGepWkya-KOA_GCrja-qrExample',
          avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
          github_username: 'sculley',
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(fallbackMembers, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Failed to load fallback members database:', err);
    fallbackMembers = [];
  }
};

const saveFallback = () => {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(fallbackMembers, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save fallback members database:', err);
  }
};

// Initialize fallback if Supabase keys aren't found
if (!isSupabaseConfigured) {
  console.log('-------------------------------------------------------------');
  console.log('WARNING: Supabase connection keys are not configured in server/.env');
  console.log('Initializing local JSON file fallback database for members:');
  console.log(`Path: ${FALLBACK_FILE}`);
  console.log('-------------------------------------------------------------');
  loadFallback();
} else {
  console.log('-------------------------------------------------------------');
  console.log('SUCCESS: Supabase URL and Key detected. Initializing client.');
  console.log('-------------------------------------------------------------');
}

// REST call helper to query Supabase PostgREST endpoints directly
const querySupabaseREST = async (
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    preferHeader?: string;
  } = {}
) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { method = 'GET', body, preferHeader } = options;
  const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${endpoint}`;
  
  const headers: Record<string, string> = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };

  if (preferHeader) {
    headers['Prefer'] = preferHeader;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase API error (${response.status}): ${errorText}`);
  }

  // Some operations (like DELETE or empty tables) might not return content or JSON
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export const membersService = {
  find: async (search?: string): Promise<IMember[]> => {
    if (isSupabaseConfigured) {
      try {
        let endpoint = 'members?select=*&order=created_at.desc';
        if (search) {
          const escapedSearch = encodeURIComponent(`%${search}%`);
          endpoint += `&or=(name.ilike.${escapedSearch},email.ilike.${escapedSearch},role.ilike.${escapedSearch})`;
        }
        const data = await querySupabaseREST(endpoint);
        return data || [];
      } catch (err) {
        console.error('Supabase query error, loading local fallback JSON:', err);
        // Fall back to JSON fallback if the database query fails (e.g. table doesn't exist yet)
        loadFallback();
        return fallbackMembers;
      }
    } else {
      let results = [...fallbackMembers];
      if (search) {
        const q = search.toLowerCase();
        results = results.filter(
          m => m.name.toLowerCase().includes(q) ||
               m.email.toLowerCase().includes(q) ||
               m.role.toLowerCase().includes(q)
        );
      }
      return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  create: async (data: { name: string; email: string; role: string; status: string; password?: string; avatar_url?: string; github_username?: string }): Promise<IMember> => {
    if (isSupabaseConfigured) {
      const body = {
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        password: data.password || null,
        avatar_url: data.avatar_url || null,
        github_username: data.github_username || null,
        created_at: new Date().toISOString()
      };
      
      const inserted = await querySupabaseREST('members', {
        method: 'POST',
        body,
        preferHeader: 'return=representation'
      });
      
      // PostgREST returns an array or single item depending on representation request
      return Array.isArray(inserted) ? inserted[0] : inserted;
    } else {
      const newMember: IMember = {
        id: `mem_${Date.now()}`,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        password: data.password,
        avatar_url: data.avatar_url,
        github_username: data.github_username,
        created_at: new Date().toISOString()
      };
      fallbackMembers.push(newMember);
      saveFallback();
      return newMember;
    }
  },

  update: async (id: string, data: { name?: string; email?: string; role?: string; status?: string; password?: string; avatar_url?: string; github_username?: string }): Promise<IMember | null> => {
    if (isSupabaseConfigured) {
      const updated = await querySupabaseREST(`members?id=eq.${id}`, {
        method: 'PATCH',
        body: data,
        preferHeader: 'return=representation'
      });
      return Array.isArray(updated) ? updated[0] : updated;
    } else {
      const index = fallbackMembers.findIndex(m => m.id === id);
      if (index === -1) return null;
      fallbackMembers[index] = {
        ...fallbackMembers[index],
        ...data
      };
      saveFallback();
      return fallbackMembers[index];
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      await querySupabaseREST(`members?id=eq.${id}`, {
        method: 'DELETE'
      });
      return true;
    } else {
      const index = fallbackMembers.findIndex(m => m.id === id);
      if (index === -1) return false;
      fallbackMembers.splice(index, 1);
      saveFallback();
      return true;
    }
  }
};
