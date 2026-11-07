import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

/**
 * Cliente admin: usa el service_role_key, puede saltarse RLS y llamar a
 * `auth.admin.generateLink()`. Vive SOLO en el server — nunca se expone al
 * browser. Se instancia una sola vez para reusar la conexión HTTP interna.
 */
export const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
