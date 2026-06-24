export interface Toilet {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  is_free: boolean;
  price: number | null;
  is_accessible: boolean;
  has_changing_table: boolean;
  comment: string | null;
  comment_created_at: string | null;
  is_approved: boolean;
  opening_hours: any;
  created_at: string;
}
