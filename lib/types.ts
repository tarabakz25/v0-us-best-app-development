// データベース型定義
export type ContentType = 'ad' | 'remix' | 'survey'

export interface Profile {
  id: string
  email: string
  display_name: string
  avatar_url?: string
  created_at: string
}

export interface Ad {
  id: string
  user_id: string
  title: string
  description: string
  video_url: string
  shop_url?: string
  created_at: string
  profiles?: Profile
}

export interface Remix {
  id: string
  user_id: string
  original_ad_id: string
  title: string
  description: string
  video_url: string
  created_at: string
  profiles?: Profile
  ads?: Ad
}

export interface SurveyQuestion {
  id: string
  question: string
  type: 'multiple_choice' | 'text' | 'rating'
  options?: string[]
}

export interface Survey {
  id: string
  user_id: string
  title: string
  description: string
  questions: SurveyQuestion[]
  created_at: string
  profiles?: Profile
}

export interface Like {
  id: string
  user_id: string
  content_type: ContentType
  content_id: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  content_type: ContentType
  content_id: string
  text: string
  created_at: string
  profiles?: Profile
}

export interface Review {
  id: string
  user_id: string
  content_type: ContentType
  content_id: string
  rating: number
  comment?: string
  created_at: string
  profiles?: Profile
}

export interface SurveyResponse {
  id: string
  survey_id: string
  user_id: string
  answers: Record<string, string | number>
  created_at: string
}

// API レスポンス型
export interface EngagementCounts {
  likes: number
  comments: number
  isLiked: boolean
}

export interface ContentWithEngagement {
  id: string
  content_type: ContentType
  likes: number
  comments: number
  isLiked: boolean
}

// エラー型
export interface ApiError {
  error: string
  details?: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}
