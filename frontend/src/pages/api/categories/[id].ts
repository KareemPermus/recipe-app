import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb, isSupabase } from '@/lib/db';
import { z } from 'zod';

const UpdateCategorySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const db = getDb();

  if (req.method === 'GET') {
    try {
      if (isSupabase()) {
        const { data: category, error } = await db
          .from('categories')
          .select(`
            *,
            recipes(*)
          `)
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Category not found' });
          }
          console.error('Supabase error:', error);
          return res.status(500).json({ error: 'Failed to fetch category' });
        }

        const result = {
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          createdAt: category.created_at,
          recipes: category.recipes.map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            imageUrl: r.image_url,
            prepTime: r.prep_time,
            cookTime: r.cook_time,
            difficulty: r.difficulty,
            createdAt: r.created_at,
          })),
        };

        return res.status(200).json(result);
      } else {
        // SQLite
        const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);

        if (!category) {
          return res.status(404).json({ error: 'Category not found' });
        }

        const recipes = db.prepare('SELECT * FROM recipes WHERE category_id = ? ORDER BY created_at DESC').all(id);

        const result = {
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          createdAt: category.created_at,
          recipes: recipes.map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            imageUrl: r.image_url,
            prepTime: r.prep_time,
            cookTime: r.cook_time,
            difficulty: r.difficulty,
            createdAt: r.created_at,
          })),
        };

        return res.status(200).json(result);
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      return res.status(500).json({ error: 'Failed to fetch category' });
    }
  } else if (req.method === 'PUT') {
    try {
      const parsed = UpdateCategorySchema.parse(req.body);

      if (isSupabase()) {
        const updateData: any = {};
        if (parsed.name !== undefined) updateData.name = parsed.name;
        if (parsed.description !== undefined) updateData.description = parsed.description;
        if (parsed.color !== undefined) updateData.color = parsed.color;

        const { data: category, error } = await db
          .from('categories')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Supabase error updating category:', error);
          return res.status(500).json({ error: 'Failed to update category' });
        }

        const result = {
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          createdAt: category.created_at,
        };

        return res.status(200).json(result);
      } else {
        // SQLite
        const updates: string[] = [];
        const params: any[] = [];

        if (parsed.name !== undefined) {
          updates.push('name = ?');
          params.push(parsed.name);
        }
        if (parsed.description !== undefined) {
          updates.push('description = ?');
          params.push(parsed.description);
        }
        if (parsed.color !== undefined) {
          updates.push('color = ?');
          params.push(parsed.color);
        }

        if (updates.length === 0) {
          return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(id);

        db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(...params);

        const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);

        const result = {
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          createdAt: category.created_at,
        };

        return res.status(200).json(result);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.issues });
      }
      console.error('Error updating category:', error);
      return res.status(500).json({ error: 'Failed to update category' });
    }
  } else if (req.method === 'DELETE') {
    try {
      if (isSupabase()) {
        const { error } = await db
          .from('categories')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Supabase error deleting category:', error);
          return res.status(500).json({ error: 'Failed to delete category' });
        }

        return res.status(200).json({ success: true });
      } else {
        // SQLite
        db.prepare('DELETE FROM categories WHERE id = ?').run(id);
        return res.status(200).json({ success: true });
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      return res.status(500).json({ error: 'Failed to delete category' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
