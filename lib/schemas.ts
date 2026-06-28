import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be 30 characters or less")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const commentSchema = z.object({
  body: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(10000, "Comment is too long"),
});

// Client-side: validates what the user has typed before upload
export const newPostSchema = z.object({
  citySlug: z.string().min(1, "Select a city"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(300, "Title must be 300 characters or less"),
  videoUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});

// Server-side: full shape sent to the API route after media upload
export const newPostApiSchema = z.object({
  citySlug: z.string().min(1),
  title: z.string().min(3).max(300),
  postType: z.enum(["text", "photo", "video"]),
  body: z.string().max(100_000).optional(),
  mediaUrl: z.string().url().nullable().optional(),
});

export const commentApiSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().min(1).max(10_000),
});

export const articleCommentApiSchema = z.object({
  articleId: z.string().uuid(),
  body: z.string().min(1).max(10_000),
});
