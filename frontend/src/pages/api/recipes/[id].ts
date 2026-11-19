import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb, isSupabase } from '@/lib/db';
import { z } from 'zod';

const UpdateRecipeSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  prepTime: z.number().optional(),
  cookTime: z.number().optional(),
  servings: z.number().optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  categoryId: z.number().optional(),
  ingredients: z.array(z.object({
    name: z.string(),
    quantity: z.string().optional(),
    unit: z.string().optional(),
    sortOrder: z.number().optional(),
  })).optional(),
  instructions: z.array(z.object({
    stepNumber: z.number(),
    content: z.string(),
  })).optional(),
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
        const { data: recipe, error } = await db
          .from('recipes')
          .select(`
            *,
            category:categories(id, name, color),
            ingredients(*),
            instructions(*)
          `)
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Recipe not found' });
          }
          console.error('Supabase error:', error);
          return res.status(500).json({ error: 'Failed to fetch recipe' });
        }

        const result = {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          imageUrl: recipe.image_url,
          prepTime: recipe.prep_time,
          cookTime: recipe.cook_time,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          categoryId: recipe.category_id,
          category: recipe.category ? {
            id: recipe.category.id,
            name: recipe.category.name,
            color: recipe.category.color,
          } : null,
          createdAt: recipe.created_at,
          updatedAt: recipe.updated_at,
          ingredients: recipe.ingredients.map((i: any) => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            sortOrder: i.sort_order,
          })),
          instructions: recipe.instructions.map((i: any) => ({
            id: i.id,
            stepNumber: i.step_number,
            content: i.content,
          })),
        };

        return res.status(200).json(result);
      } else {
        // SQLite
        const recipe = db.prepare(`
          SELECT
            r.*,
            c.id as cat_id,
            c.name as cat_name,
            c.color as cat_color
          FROM recipes r
          LEFT JOIN categories c ON r.category_id = c.id
          WHERE r.id = ?
        `).get(id);

        if (!recipe) {
          return res.status(404).json({ error: 'Recipe not found' });
        }

        const ingredients = db.prepare('SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY sort_order').all(id);
        const instructions = db.prepare('SELECT * FROM instructions WHERE recipe_id = ? ORDER BY step_number').all(id);

        const result = {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          imageUrl: recipe.image_url,
          prepTime: recipe.prep_time,
          cookTime: recipe.cook_time,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          categoryId: recipe.category_id,
          category: recipe.cat_id ? {
            id: recipe.cat_id,
            name: recipe.cat_name,
            color: recipe.cat_color,
          } : null,
          createdAt: recipe.created_at,
          updatedAt: recipe.updated_at,
          ingredients: ingredients.map((i: any) => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            sortOrder: i.sort_order,
          })),
          instructions: instructions.map((i: any) => ({
            id: i.id,
            stepNumber: i.step_number,
            content: i.content,
          })),
        };

        return res.status(200).json(result);
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      return res.status(500).json({ error: 'Failed to fetch recipe' });
    }
  } else if (req.method === 'PUT') {
    try {
      const parsed = UpdateRecipeSchema.parse(req.body);

      if (isSupabase()) {
        // Update recipe
        const updateData: any = { updated_at: new Date().toISOString() };
        if (parsed.title !== undefined) updateData.title = parsed.title;
        if (parsed.description !== undefined) updateData.description = parsed.description;
        if (parsed.imageUrl !== undefined) updateData.image_url = parsed.imageUrl;
        if (parsed.prepTime !== undefined) updateData.prep_time = parsed.prepTime;
        if (parsed.cookTime !== undefined) updateData.cook_time = parsed.cookTime;
        if (parsed.servings !== undefined) updateData.servings = parsed.servings;
        if (parsed.difficulty !== undefined) updateData.difficulty = parsed.difficulty;
        if (parsed.categoryId !== undefined) updateData.category_id = parsed.categoryId;

        const { error: updateError } = await db
          .from('recipes')
          .update(updateData)
          .eq('id', id);

        if (updateError) {
          console.error('Supabase error updating recipe:', updateError);
          return res.status(500).json({ error: 'Failed to update recipe' });
        }

        // Replace ingredients if provided
        if (parsed.ingredients) {
          await db.from('ingredients').delete().eq('recipe_id', id);

          if (parsed.ingredients.length > 0) {
            const ingredientsData = parsed.ingredients.map((ing, idx) => ({
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              sort_order: ing.sortOrder ?? idx,
              recipe_id: id,
            }));

            await db.from('ingredients').insert(ingredientsData);
          }
        }

        // Replace instructions if provided
        if (parsed.instructions) {
          await db.from('instructions').delete().eq('recipe_id', id);

          if (parsed.instructions.length > 0) {
            const instructionsData = parsed.instructions.map((inst) => ({
              step_number: inst.stepNumber,
              content: inst.content,
              recipe_id: id,
            }));

            await db.from('instructions').insert(instructionsData);
          }
        }

        // Fetch updated recipe
        const { data: fullRecipe } = await db
          .from('recipes')
          .select(`
            *,
            ingredients(*),
            instructions(*)
          `)
          .eq('id', id)
          .single();

        const result = {
          id: fullRecipe.id,
          title: fullRecipe.title,
          description: fullRecipe.description,
          imageUrl: fullRecipe.image_url,
          prepTime: fullRecipe.prep_time,
          cookTime: fullRecipe.cook_time,
          servings: fullRecipe.servings,
          difficulty: fullRecipe.difficulty,
          categoryId: fullRecipe.category_id,
          createdAt: fullRecipe.created_at,
          updatedAt: fullRecipe.updated_at,
          ingredients: fullRecipe.ingredients.map((i: any) => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            sortOrder: i.sort_order,
          })),
          instructions: fullRecipe.instructions.map((i: any) => ({
            id: i.id,
            stepNumber: i.step_number,
            content: i.content,
          })),
        };

        return res.status(200).json(result);
      } else {
        // SQLite
        const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [];

        if (parsed.title !== undefined) {
          updates.push('title = ?');
          params.push(parsed.title);
        }
        if (parsed.description !== undefined) {
          updates.push('description = ?');
          params.push(parsed.description);
        }
        if (parsed.imageUrl !== undefined) {
          updates.push('image_url = ?');
          params.push(parsed.imageUrl);
        }
        if (parsed.prepTime !== undefined) {
          updates.push('prep_time = ?');
          params.push(parsed.prepTime);
        }
        if (parsed.cookTime !== undefined) {
          updates.push('cook_time = ?');
          params.push(parsed.cookTime);
        }
        if (parsed.servings !== undefined) {
          updates.push('servings = ?');
          params.push(parsed.servings);
        }
        if (parsed.difficulty !== undefined) {
          updates.push('difficulty = ?');
          params.push(parsed.difficulty);
        }
        if (parsed.categoryId !== undefined) {
          updates.push('category_id = ?');
          params.push(parsed.categoryId);
        }

        params.push(id);

        db.prepare(`UPDATE recipes SET ${updates.join(', ')} WHERE id = ?`).run(...params);

        // Replace ingredients if provided
        if (parsed.ingredients) {
          db.prepare('DELETE FROM ingredients WHERE recipe_id = ?').run(id);

          if (parsed.ingredients.length > 0) {
            const insertIng = db.prepare(`
              INSERT INTO ingredients (name, quantity, unit, sort_order, recipe_id)
              VALUES (?, ?, ?, ?, ?)
            `);

            parsed.ingredients.forEach((ing, idx) => {
              insertIng.run(
                ing.name,
                ing.quantity,
                ing.unit,
                ing.sortOrder ?? idx,
                id
              );
            });
          }
        }

        // Replace instructions if provided
        if (parsed.instructions) {
          db.prepare('DELETE FROM instructions WHERE recipe_id = ?').run(id);

          if (parsed.instructions.length > 0) {
            const insertInst = db.prepare(`
              INSERT INTO instructions (step_number, content, recipe_id)
              VALUES (?, ?, ?)
            `);

            parsed.instructions.forEach((inst) => {
              insertInst.run(inst.stepNumber, inst.content, id);
            });
          }
        }

        // Fetch updated recipe
        const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);
        const ingredients = db.prepare('SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY sort_order').all(id);
        const instructions = db.prepare('SELECT * FROM instructions WHERE recipe_id = ? ORDER BY step_number').all(id);

        const result = {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          imageUrl: recipe.image_url,
          prepTime: recipe.prep_time,
          cookTime: recipe.cook_time,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          categoryId: recipe.category_id,
          createdAt: recipe.created_at,
          updatedAt: recipe.updated_at,
          ingredients: ingredients.map((i: any) => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            sortOrder: i.sort_order,
          })),
          instructions: instructions.map((i: any) => ({
            id: i.id,
            stepNumber: i.step_number,
            content: i.content,
          })),
        };

        return res.status(200).json(result);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.issues });
      }
      console.error('Error updating recipe:', error);
      return res.status(500).json({ error: 'Failed to update recipe' });
    }
  } else if (req.method === 'DELETE') {
    try {
      if (isSupabase()) {
        const { error } = await db
          .from('recipes')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Supabase error deleting recipe:', error);
          return res.status(500).json({ error: 'Failed to delete recipe' });
        }

        return res.status(200).json({ success: true });
      } else {
        // SQLite
        db.prepare('DELETE FROM recipes WHERE id = ?').run(id);
        return res.status(200).json({ success: true });
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      return res.status(500).json({ error: 'Failed to delete recipe' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
