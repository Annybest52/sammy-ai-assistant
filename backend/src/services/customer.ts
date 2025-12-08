import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  preferences?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface UpsertCustomerParams {
  name: string;
  email: string;
  phone?: string;
  preferences?: Record<string, unknown>;
}

export class CustomerService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.serviceKey);
  }

  async getByEmail(email: string): Promise<Customer | null> {
    try {
      const { data, error } = await this.supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }

      return data as Customer;
    } catch (error) {
      console.error('Error getting customer:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<Customer | null> {
    try {
      const { data, error } = await this.supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as Customer;
    } catch (error) {
      console.error('Error getting customer by ID:', error);
      throw error;
    }
  }

  async upsertCustomer(params: UpsertCustomerParams): Promise<Customer> {
    try {
      const existing = await this.getByEmail(params.email);

      if (existing) {
        // Update existing customer
        const { data, error } = await this.supabase
          .from('customers')
          .update({
            name: params.name,
            phone: params.phone,
            preferences: params.preferences,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as Customer;
      } else {
        // Create new customer
        const { data, error } = await this.supabase
          .from('customers')
          .insert({
            name: params.name,
            email: params.email,
            phone: params.phone,
            preferences: params.preferences,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return data as Customer;
      }
    } catch (error) {
      console.error('Error upserting customer:', error);
      throw error;
    }
  }

  async updatePreferences(email: string, preferences: Record<string, unknown>): Promise<void> {
    try {
      const customer = await this.getByEmail(email);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const mergedPreferences = {
        ...(customer.preferences || {}),
        ...preferences,
      };

      await this.supabase
        .from('customers')
        .update({
          preferences: mergedPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customer.id);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      const { data, error } = await this.supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return data as Customer[];
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  async getRecentCustomers(limit: number = 10): Promise<Customer[]> {
    try {
      const { data, error } = await this.supabase
        .from('customers')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Customer[];
    } catch (error) {
      console.error('Error getting recent customers:', error);
      throw error;
    }
  }
}


