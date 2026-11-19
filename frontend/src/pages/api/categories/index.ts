import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb, isSupabase } from '@/lib/db';
import { z } from 'zod';

const CreateCategorySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const db = getDb();

  if (req.method === 'GET') {
    try {
      if (isSupabase()) {
        const { data: categories, error } = await db
          .from('categories')
          .select(`
            *,
            recipes(count)
          `)
          .order('name');

        if (error) {
          console.error('Supabase error:', error);
          return res.status(500).json({ error: 'Failed to fetch categories' });
        }

        const result = categories.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          color: c.color,
          createdAt: c.created_at,
          recipeCount: c.recipes[0]?.count || 0,
        }));

        return res.status(200).json(result);
      } else {
        // SQLite
        const categories = db.prepare(`
          SELECT
            c.*,
            COUNT(r.id) as recipe_count
          FROM categories c
          LEFT JOIN recipes r ON c.id = r.category_id
          GROUP BY c.id
          ORDER BY c.name
        `).all();

        const result = categories.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          color: c.color,
          createdAt: c.created_at,
          recipeCount: c.recipe_count,
        }));

        return res.status(200).json(result);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
  } else if (req.method === 'POST') {
    try {
      const parsed = CreateCategorySchema.parse(req.body);

      if (isSupabase()) {
        const { data: category, error } = await db
          .from('categories')
          .insert({
            name: parsed.name,
            description: parsed.description,
            color: parsed.color,
          })
          .select()
          .single();

        if (error) {
          console.error('Supabase error creating category:', error);
          return res.status(500).json({ error: 'Failed to create category' });
        }

        const result = {
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          createdAt: category.created_at,
        };

        return res.status(201).json(result);
      } else {
        // SQLite
        const insert = db.prepare(`
          INSERT INTO categories (name, description, color)
          VALUES (?, ?, ?)
        `);

        const info = insert.run(
          parsed.name,
          parsed.description,
          parsed.color || '#6366f1'
        );

        const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);

        const result = {
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          createdAt: category.created_at,
        };

        return res.status(201).json(result);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.issues });
      }
      console.error('Error creating category:', error);
      return res.status(500).json({ error: 'Failed to create category' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
