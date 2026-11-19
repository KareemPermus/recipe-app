import path from 'path';

let db: any = null;

export function getDb() {
  if (db) return db;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = require('@supabase/supabase-js');
    db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    return db;
  }

  // VMSS preview only — Supabase env vars are absent.
  const Database = require('better-sqlite3');
  db = new Database(path.join('/tmp', 'app.db'));
  db.pragma('journal_mode = WAL');

  // Create tables (SQLite syntax, mirroring schema.sql)
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      color TEXT DEFAULT '#6366f1',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      image_url TEXT,
      prep_time INTEGER,
      cook_time INTEGER,
      servings INTEGER,
      difficulty TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quantity TEXT,
      unit TEXT,
      sort_order INTEGER DEFAULT 0 NOT NULL,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS instructions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      step_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category_id);
    CREATE INDEX IF NOT EXISTS idx_ingredients_recipe ON ingredients(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_instructions_recipe ON instructions(recipe_id);
  `);

  // Seed if empty (SQLite syntax, mirroring seed.sql)
  const count = db.prepare('SELECT COUNT(*) as c FROM categories').get();
  if (count.c === 0) {
    // Insert categories
    const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name, description, color) VALUES (?, ?, ?)');
    insertCat.run('Mediterranean', 'Fresh and healthy Mediterranean dishes', '#4A6638');
    insertCat.run('Asian', 'Flavors from across Asia', '#B83F25');
    insertCat.run('Baking', 'Breads, cakes, and pastries', '#E5B443');
    insertCat.run('Quick & Easy', 'Weeknight dinners under 30 minutes', '#6F6052');

    // Get category IDs
    const getMedId = db.prepare('SELECT id FROM categories WHERE name = ?').get('Mediterranean');
    const getAsianId = db.prepare('SELECT id FROM categories WHERE name = ?').get('Asian');
    const getBakingId = db.prepare('SELECT id FROM categories WHERE name = ?').get('Baking');
    const getQuickId = db.prepare('SELECT id FROM categories WHERE name = ?').get('Quick & Easy');

    // Insert recipes
    const insertRecipe = db.prepare(`
      INSERT OR IGNORE INTO recipes (title, slug, description, image_url, prep_time, cook_time, servings, difficulty, category_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertRecipe.run(
      'Charred Tomato & Butter Bean Stew',
      'charred-tomato-butter-bean-stew',
      'Blistered cherry tomatoes collapse into a garlicky, smoky broth thick with creamy beans. Finish with lemon and a pile of soft herbs, and serve with torn bread.',
      null,
      10,
      25,
      4,
      'Easy',
      getMedId.id
    );

    insertRecipe.run(
      'Miso-Glazed Salmon with Sesame Greens',
      'miso-glazed-salmon',
      'A sweet-salty glaze that caramelises under the grill in minutes, with garlicky greens tossed in toasted sesame. Rice makes it dinner.',
      null,
      10,
      15,
      2,
      'Easy',
      getAsianId.id
    );

    insertRecipe.run(
      'Brown Butter Banana Bread',
      'brown-butter-banana-bread',
      'Nutty brown butter and very ripe bananas make a loaf that stays moist for days. A crackly demerara top is non-negotiable.',
      null,
      15,
      55,
      8,
      'Easy',
      getBakingId.id
    );

    insertRecipe.run(
      'Lemony Orzo with Peas & Ricotta',
      'lemony-orzo-peas-ricotta',
      'One pot, twenty minutes, and the kind of bright, creamy comfort that works straight from the freezer aisle.',
      null,
      5,
      20,
      3,
      'Easy',
      getQuickId.id
    );

    // Get recipe IDs
    const getStewId = db.prepare('SELECT id FROM recipes WHERE slug = ?').get('charred-tomato-butter-bean-stew');
    const getSalmonId = db.prepare('SELECT id FROM recipes WHERE slug = ?').get('miso-glazed-salmon');

    // Insert ingredients for stew
    const insertIng = db.prepare('INSERT INTO ingredients (name, quantity, unit, sort_order, recipe_id) VALUES (?, ?, ?, ?, ?)');
    insertIng.run('olive oil', '2', 'tbsp', 0, getStewId.id);
    insertIng.run('garlic, thinly sliced', '4', 'cloves', 1, getStewId.id);
    insertIng.run('cherry tomatoes', '500', 'g', 2, getStewId.id);
    insertIng.run('smoked paprika', '1', 'tsp', 3, getStewId.id);
    insertIng.run('butter beans (400g cans, drained)', '2', 'cans', 4, getStewId.id);
    insertIng.run('vegetable stock', '250', 'ml', 5, getStewId.id);
    insertIng.run('lemon, juiced', '0.5', '', 6, getStewId.id);
    insertIng.run('parsley & dill, roughly chopped', '1', 'handful', 7, getStewId.id);

    // Insert instructions for stew
    const insertInst = db.prepare('INSERT INTO instructions (step_number, content, recipe_id) VALUES (?, ?, ?)');
    insertInst.run(1, 'Warm the oil in a wide, heavy pan over medium heat. Add the garlic and cook until just golden at the edges, about 2 minutes.', getStewId.id);
    insertInst.run(2, 'Add the tomatoes in a single layer. Leave them untouched until they blister and char in spots, then give the pan a shake, about 8 minutes.', getStewId.id);
    insertInst.run(3, 'Stir in the paprika for 30 seconds, then add the beans and stock. Press some of the tomatoes with a spoon so they burst.', getStewId.id);
    insertInst.run(4, 'Simmer until the broth thickens and turns glossy, stirring now and then so nothing catches, about 12 minutes.', getStewId.id);
    insertInst.run(5, 'Take off the heat, add the lemon juice and herbs, and season generously. Serve with bread for dragging through the pan.', getStewId.id);

    // Insert ingredients for salmon
    insertIng.run('salmon fillets (skin on)', '2', '', 0, getSalmonId.id);
    insertIng.run('white miso', '2', 'tbsp', 1, getSalmonId.id);
    insertIng.run('mirin', '1', 'tbsp', 2, getSalmonId.id);
    insertIng.run('honey', '1', 'tsp', 3, getSalmonId.id);
    insertIng.run('tenderstem broccoli', '200', 'g', 4, getSalmonId.id);
    insertIng.run('toasted sesame oil', '1', 'tbsp', 5, getSalmonId.id);
    insertIng.run('sesame seeds', '1', 'tsp', 6, getSalmonId.id);

    // Insert instructions for salmon
    insertInst.run(1, 'Heat the grill to high. Whisk the miso, mirin and honey into a thick glaze.', getSalmonId.id);
    insertInst.run(2, 'Pat the salmon dry, set skin-side down on a lined tray and spread over the glaze.', getSalmonId.id);
    insertInst.run(3, 'Grill until the glaze is bubbling and charred at the edges and the fish flakes, about 8 minutes.', getSalmonId.id);
    insertInst.run(4, 'Meanwhile, stir-fry the broccoli in sesame oil with a splash of water until bright and just tender, about 4 minutes.', getSalmonId.id);
    insertInst.run(5, 'Plate the greens, top with salmon and scatter with sesame seeds.', getSalmonId.id);
  }

  return db;
}

// Every caller that does CRUD MUST branch on this — never hardcode it to `false`
// or gate it behind any other flag. It must always mirror getDb()'s own check.
export function isSupabase(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}
