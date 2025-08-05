export interface CreateCourseInput {
  title: string;
  description: string;
  thumbnail_url?: string;
  price: number;
  is_published?: boolean;
}
