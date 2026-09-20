export type Spot = {
  id: string
  name: string
  theme: string | null
  lat: number
  lng: number
  description: string | null
  kind: 'official' | 'user' | 'collab'
  order: number | null
  created_at: string
}

export type Post = {
  id: string
  spot_id: string
  image_path: string
  comment: string | null
  tags: string[]
  avg_color: string | null
  created_at: string
  device_id: string
}

export type PostWithSpot = Post & { spots: { name: string } | null }
