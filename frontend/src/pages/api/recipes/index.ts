import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb, isSupabase } from '@/lib/db';
import { z } from 'zod';

const CreateRecipeSchema = z.object({
  title: z.string(),
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
  const db = getDb();

  if (req.method === 'GET') {
    try {
      const { search, categoryId, difficulty } = req.query;

      if (isSupabase()) {
        let query = db.from('recipes').select(`
          *,
          category:categories(id, name, color)
        `);

        if (search && typeof search === 'string') {
          query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        if (difficulty) {
          query = query.eq('difficulty', difficulty);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
          console.error('Supabase error:', error);
          return res.status(500).json({ error: 'Failed to fetch recipes' });
        }

        const recipes = data.map((r: any) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          imageUrl: r.image_url,
          prepTime: r.prep_time,
          cookTime: r.cook_time,
          servings: r.servings,
          difficulty: r.difficulty,
          categoryId: r.category_id,
          category: r.category ? {
            id: r.category.id,
            name: r.category.name,
            color: r.category.color,
          } : null,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));

        return res.status(200).json(recipes);
      } else {
        // SQLite
        let sql = `
          SELECT
            r.*,
            c.id as cat_id,
            c.name as cat_name,
            c.color as cat_color
          FROM recipes r
          LEFT JOIN categories c ON r.category_id = c.id
          WHERE 1=1
        `;
        const params: any[] = [];

        if (search && typeof search === 'string') {
          sql += ` AND (r.title LIKE ? OR r.description LIKE ?)`;
          params.push(`%${search}%`, `%${search}%`);
        }

        if (categoryId) {
          sql += ` AND r.category_id = ?`;
          params.push(categoryId);
        }

        if (difficulty) {
          sql += ` AND r.difficulty = ?`;
          params.push(difficulty);
        }

        sql += ` ORDER BY r.created_at DESC`;

        const rows = db.prepare(sql).all(...params);

        const recipes = rows.map((r: any) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          imageUrl: r.image_url,
          prepTime: r.prep_time,
          cookTime: r.cook_time,
          servings: r.servings,
          difficulty: r.difficulty,
          categoryId: r.category_id,
          category: r.cat_id ? {
            id: r.cat_id,
            name: r.cat_name,
            color: r.cat_color,
          } : null,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));

        return res.status(200).json(recipes);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return res.status(500).json({ error: 'Failed to fetch recipes' });
    }
  } else if (req.method === 'POST') {
    try {
      const parsed = CreateRecipeSchema.parse(req.body);

      // Generate slug from title
      const slug = parsed.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      if (isSupabase()) {
        // Insert recipe
        const { data: recipe, error: recipeError } = await db
          .from('recipes')
          .insert({
            title: parsed.title,
            slug,
            description: parsed.description,
            image_url: parsed.imageUrl,
            prep_time: parsed.prepTime,
            cook_time: parsed.cookTime,
            servings: parsed.servings,
            difficulty: parsed.difficulty,
            category_id: parsed.categoryId,
          })
          .select()
          .single();

        if (recipeError) {
          console.error('Supabase error creating recipe:', recipeError);
          return res.status(500).json({ error: 'Failed to create recipe' });
        }

        // Insert ingredients
        if (parsed.ingredients && parsed.ingredients.length > 0) {
          const ingredientsData = parsed.ingredients.map((ing, idx) => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            sort_order: ing.sortOrder ?? idx,
            recipe_id: recipe.id,
          }));

          const { error: ingError } = await db
            .from('ingredients')
            .insert(ingredientsData);

          if (ingError) {
            console.error('Supabase error creating ingredients:', ingError);
          }
        }

        // Insert instructions
        if (parsed.instructions && parsed.instructions.length > 0) {
          const instructionsData = parsed.instructions.map((inst) => ({
            step_number: inst.stepNumber,
            content: inst.content,
            recipe_id: recipe.id,
          }));

          const { error: instError } = await db
            .from('instructions')
            .insert(instructionsData);

          if (instError) {
            console.error('Supabase error creating instructions:', instError);
          }
        }

        // Fetch complete recipe with relations
        const { data: fullRecipe } = await db
          .from('recipes')
          .select(`
            *,
            ingredients(*),
            instructions(*)
          `)
          .eq('id', recipe.id)
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

        return res.status(201).json(result);
      } else {
        // SQLite
        const insert = db.prepare(`
          INSERT INTO recipes (title, slug, description, image_url, prep_time, cook_time, servings, difficulty, category_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const info = insert.run(
          parsed.title,
          slug,
          parsed.description,
          parsed.imageUrl,
          parsed.prepTime,
          parsed.cookTime,
          parsed.servings,
          parsed.difficulty,
          parsed.categoryId
        );

        const recipeId = info.lastInsertRowid;

        // Insert ingredients
        if (parsed.ingredients && parsed.ingredients.length > 0) {
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
              recipeId
            );
          });
        }

        // Insert instructions
        if (parsed.instructions && parsed.instructions.length > 0) {
          const insertInst = db.prepare(`
            INSERT INTO instructions (step_number, content, recipe_id)
            VALUES (?, ?, ?)
          `);

          parsed.instructions.forEach((inst) => {
            insertInst.run(inst.stepNumber, inst.content, recipeId);
          });
        }

        // Fetch complete recipe
        const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
        const ingredients = db.prepare('SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY sort_order').all(recipeId);
        const instructions = db.prepare('SELECT * FROM instructions WHERE recipe_id = ? ORDER BY step_number').all(recipeId);

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

        return res.status(201).json(result);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.issues });
      }
      console.error('Error creating recipe:', error);
      return res.status(500).json({ error: 'Failed to create recipe' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
