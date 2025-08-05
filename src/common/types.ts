import { FastifyRequest, FastifyReply } from "fastify";

// Base request and response types
export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    role: "instructor" | "student" | "admin";
  };
}

export interface AuthenticatedReply extends FastifyReply {}

// Common controller function types
export type ControllerFunction = (
  req: AuthenticatedRequest,
  res: AuthenticatedReply
) => Promise<void>;

// Database entity types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  price: number;
  instructor_id: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  enrolled_at: string;
  progress?: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  payment_method?: string;
  description?: string;
}

export interface Instructor {
  id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  rating?: number;
  total_students?: number;
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Review {
  id: string;
  user_id: string;
  course_id?: string;
  rating: number;
  comment?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface TeamPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  max_members: number;
  created_at?: string;
  updated_at?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_percentage: number;
  valid_until: string;
  usage_limit?: number;
  used_count: number;
  created_at?: string;
}

export interface Payout {
  id: string;
  instructor_id: string;
  amount: number;
  status: string;
  created_at: string;
  processed_at?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  instructor_id: string;
  status: string;
  created_at: string;
  expires_at?: string;
}

export interface Bundle {
  id: string;
  name: string;
  description?: string;
  instructor_id: string;
  price: number;
  created_at?: string;
  updated_at?: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Item {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Learning progress types
export interface LearningProgress {
  id: string;
  type: "course";
  title: string;
  image: string;
  author: {
    name: string;
    avatar: string;
  };
  duration?: string;
  enrollmentDate?: string;
  progress: number;
  unitsCompleted: number;
  totalUnits: number;
  avatars: Array<{
    img: string;
    progress: number;
    tooltip: string;
  }>;
}

export interface LearningStats {
  daysLearned: number;
  minutesPerDay: number;
  weeklyAverage: number;
  totalCourses: number;
  completedCourses: number;
  totalMinutes: number;
}

export interface ContentInProgress {
  inProgress: LearningProgress[];
  completed: LearningProgress[];
  certificates: any[];
}

// Map types for efficient lookups
export interface InstructorMap {
  [key: string]: Instructor;
}

export interface OwnerMap {
  [key: string]: User;
}

// Error types
export interface AppError {
  message: string;
  code: string;
  statusCode: number;
}

// Webhook types
export interface WebhookEvent {
  id?: string;
  event_id?: string;
  uuid?: string;
  type: string;
  data: any;
  timestamp: string;
}

// Logger types
export interface LogObject {
  message: string;
  level: string;
  timestamp: string;
  [key: string]: any;
}

// RabbitMQ types
export interface RabbitMQConfig {
  url: string;
  queue: string;
  exchange: string;
}

// Financial types
export interface FinancialStats {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  monthlyGrowth: number;
}

// Dashboard types
export interface DashboardOverview {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  activeEnrollments: number;
  recentTransactions: Transaction[];
  topCourses: Course[];
}
