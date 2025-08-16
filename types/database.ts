export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          avatar_url: string | null
          role: string
          status: string
          preferences: any | null
          last_login_at: string | null
          email_verified_at: string | null
          metadata: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: string
          status?: string
          preferences?: any | null
          last_login_at?: string | null
          email_verified_at?: string | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: string
          status?: string
          preferences?: any | null
          last_login_at?: string | null
          email_verified_at?: string | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          short_description: string | null
          sku: string
          price: number
          compare_price: number | null
          cost_price: number | null
          brand: string | null
          status: string
          category_id: string | null
          inventory_quantity: number
          track_inventory: boolean
          low_stock_threshold: number | null
          weight: number | null
          dimensions: any | null
          requires_shipping: boolean
          is_digital: boolean
          tax_class: string | null
          seo_title: string | null
          seo_description: string | null
          tags: string[] | null
          attributes: any | null
          variants: any | null
          images: any | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          sku: string
          price: number
          compare_price?: number | null
          cost_price?: number | null
          brand?: string | null
          status?: string
          category_id?: string | null
          inventory_quantity?: number
          track_inventory?: boolean
          low_stock_threshold?: number | null
          weight?: number | null
          dimensions?: any | null
          requires_shipping?: boolean
          is_digital?: boolean
          tax_class?: string | null
          seo_title?: string | null
          seo_description?: string | null
          tags?: string[] | null
          attributes?: any | null
          variants?: any | null
          images?: any | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          sku?: string
          price?: number
          compare_price?: number | null
          cost_price?: number | null
          brand?: string | null
          status?: string
          category_id?: string | null
          inventory_quantity?: number
          track_inventory?: boolean
          low_stock_threshold?: number | null
          weight?: number | null
          dimensions?: any | null
          requires_shipping?: boolean
          is_digital?: boolean
          tax_class?: string | null
          seo_title?: string | null
          seo_description?: string | null
          tags?: string[] | null
          attributes?: any | null
          variants?: any | null
          images?: any | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string
          customer_email: string
          customer_phone: string | null
          status: string
          payment_status: string
          fulfillment_status: string
          subtotal: number
          tax_amount: number
          shipping_amount: number
          discount_amount: number
          total_amount: number
          billing_address: any | null
          shipping_address: any | null
          notes: string | null
          internal_notes: string | null
          tags: string[] | null
          metadata: any | null
          created_at: string
          updated_at: string
          processed_at: string | null
          shipped_at: string | null
          delivered_at: string | null
          cancelled_at: string | null
        }
        Insert: {
          id?: string
          order_number?: string
          user_id: string
          customer_email: string
          customer_phone?: string | null
          status?: string
          payment_status?: string
          fulfillment_status?: string
          subtotal: number
          tax_amount: number
          shipping_amount: number
          discount_amount: number
          total_amount: number
          billing_address?: any | null
          shipping_address?: any | null
          notes?: string | null
          internal_notes?: string | null
          tags?: string[] | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
          processed_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string
          customer_email?: string
          customer_phone?: string | null
          status?: string
          payment_status?: string
          fulfillment_status?: string
          subtotal?: number
          tax_amount?: number
          shipping_amount?: number
          discount_amount?: number
          total_amount?: number
          billing_address?: any | null
          shipping_address?: any | null
          notes?: string | null
          internal_notes?: string | null
          tags?: string[] | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
          processed_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          parent_id: string | null
          image_url: string | null
          is_active: boolean
          sort_order: number | null
          metadata: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          parent_id?: string | null
          image_url?: string | null
          is_active?: boolean
          sort_order?: number | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          parent_id?: string | null
          image_url?: string | null
          is_active?: boolean
          sort_order?: number | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          variant_id: string | null
          quantity: number
          unit_price: number
          total_price: number
          product_snapshot: any | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          variant_id?: string | null
          quantity: number
          unit_price: number
          total_price: number
          product_snapshot?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          variant_id?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          product_snapshot?: any | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          order_id: string
          amount: number
          currency: string
          status: string
          payment_method: string
          payment_gateway: string
          gateway_transaction_id: string | null
          gateway_response: any | null
          processed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          amount: number
          currency: string
          status: string
          payment_method: string
          payment_gateway: string
          gateway_transaction_id?: string | null
          gateway_response?: any | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          amount?: number
          currency?: string
          status?: string
          payment_method?: string
          payment_gateway?: string
          gateway_transaction_id?: string | null
          gateway_response?: any | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory_movements: {
        Row: {
          id: string
          product_id: string
          movement_type: string
          quantity: number
          reason: string | null
          reference_type: string | null
          reference_id: string | null
          cost_per_unit: number | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          movement_type: string
          quantity: number
          reason?: string | null
          reference_type?: string | null
          reference_id?: string | null
          cost_per_unit?: number | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          movement_type?: string
          quantity?: number
          reason?: string | null
          reference_type?: string | null
          reference_id?: string | null
          cost_per_unit?: number | null
          created_by?: string | null
          created_at?: string
        }
      }
      application_settings: {
        Row: {
          id: string
          key: string
          value: string | null
          category: string | null
          description: string | null
          is_encrypted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: string | null
          category?: string | null
          description?: string | null
          is_encrypted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string | null
          category?: string | null
          description?: string | null
          is_encrypted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          display_name: string | null
          description: string | null
          permissions: any | null
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name?: string | null
          description?: string | null
          permissions?: any | null
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string | null
          description?: string | null
          permissions?: any | null
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          assigned_by: string | null
          assigned_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role_id: string
          assigned_by?: string | null
          assigned_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string
          assigned_by?: string | null
          assigned_at?: string
          expires_at?: string | null
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          type: string
          first_name: string | null
          last_name: string | null
          company: string | null
          address_line_1: string
          address_line_2: string | null
          city: string
          state: string | null
          postal_code: string
          country: string
          phone: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          first_name?: string | null
          last_name?: string | null
          company?: string | null
          address_line_1: string
          address_line_2?: string | null
          city: string
          state?: string | null
          postal_code: string
          country: string
          phone?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          first_name?: string | null
          last_name?: string | null
          company?: string | null
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          state?: string | null
          postal_code?: string
          country?: string
          phone?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          old_values: any | null
          new_values: any | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          old_values?: any | null
          new_values?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          old_values?: any | null
          new_values?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      event_store: {
        Row: {
          id: string
          aggregate_id: string
          aggregate_type: string
          event_type: string
          event_data: any | null
          event_metadata: any | null
          version: number
          occurred_at: string
          created_at: string
        }
        Insert: {
          id?: string
          aggregate_id: string
          aggregate_type: string
          event_type: string
          event_data?: any | null
          event_metadata?: any | null
          version: number
          occurred_at: string
          created_at?: string
        }
        Update: {
          id?: string
          aggregate_id?: string
          aggregate_type?: string
          event_type?: string
          event_data?: any | null
          event_metadata?: any | null
          version?: number
          occurred_at?: string
          created_at?: string
        }
      }
      event_snapshots: {
        Row: {
          id: string
          aggregate_id: string
          aggregate_type: string
          version: number
          snapshot_data: any | null
          created_at: string
        }
        Insert: {
          id?: string
          aggregate_id: string
          aggregate_type: string
          version: number
          snapshot_data?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          aggregate_id?: string
          aggregate_type?: string
          version?: number
          snapshot_data?: any | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
