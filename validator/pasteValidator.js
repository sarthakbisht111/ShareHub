import { z } from "zod";

export const createPasteSchema = z.object({
    title: z.string().trim().max(100,'Title cannot exceed 100 characters').optional().default('Untitled'),

    content : z.string().trim().min(1, 'Content is required').max(500000, 'Content cannot exceed 500kb'),

    language : z.string().optional().default('PlainText'),

    expiry : z.enum(['1h', '1d', '1w', 'never']).optional().default('1d')
})