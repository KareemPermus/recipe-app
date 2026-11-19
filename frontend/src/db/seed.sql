-- Insert categories with natural key (name is unique)
INSERT INTO categories (name, description, color)
VALUES ('Mediterranean', 'Fresh and healthy Mediterranean dishes', '#4A6638')
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, color)
VALUES ('Asian', 'Flavors from across Asia', '#B83F25')
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, color)
VALUES ('Baking', 'Breads, cakes, and pastries', '#E5B443')
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, color)
VALUES ('Quick & Easy', 'Weeknight dinners under 30 minutes', '#6F6052')
ON CONFLICT (name) DO NOTHING;

-- Insert recipes with natural key (slug is unique)
INSERT INTO recipes (title, slug, description, image_url, prep_time, cook_time, servings, difficulty, category_id)
VALUES (
  'Charred Tomato & Butter Bean Stew',
  'charred-tomato-butter-bean-stew',
  'Blistered cherry tomatoes collapse into a garlicky, smoky broth thick with creamy beans. Finish with lemon and a pile of soft herbs, and serve with torn bread.',
  NULL,
  10,
  25,
  4,
  'Easy',
  (SELECT id FROM categories WHERE name = 'Mediterranean' LIMIT 1)
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO recipes (title, slug, description, image_url, prep_time, cook_time, servings, difficulty, category_id)
VALUES (
  'Miso-Glazed Salmon with Sesame Greens',
  'miso-glazed-salmon',
  'A sweet-salty glaze that caramelises under the grill in minutes, with garlicky greens tossed in toasted sesame. Rice makes it dinner.',
  NULL,
  10,
  15,
  2,
  'Easy',
  (SELECT id FROM categories WHERE name = 'Asian' LIMIT 1)
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO recipes (title, slug, description, image_url, prep_time, cook_time, servings, difficulty, category_id)
VALUES (
  'Brown Butter Banana Bread',
  'brown-butter-banana-bread',
  'Nutty brown butter and very ripe bananas make a loaf that stays moist for days. A crackly demerara top is non-negotiable.',
  NULL,
  15,
  55,
  8,
  'Easy',
  (SELECT id FROM categories WHERE name = 'Baking' LIMIT 1)
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO recipes (title, slug, description, image_url, prep_time, cook_time, servings, difficulty, category_id)
VALUES (
  'Lemony Orzo with Peas & Ricotta',
  'lemony-orzo-peas-ricotta',
  'One pot, twenty minutes, and the kind of bright, creamy comfort that works straight from the freezer aisle.',
  NULL,
  5,
  20,
  3,
  'Easy',
  (SELECT id FROM categories WHERE name = 'Quick & Easy' LIMIT 1)
)
ON CONFLICT (slug) DO NOTHING;

-- Insert ingredients for Charred Tomato & Butter Bean Stew
INSERT INTO ingredients (name, quantity, unit, sort_order, recipe_id)
SELECT 'olive oil', '2', 'tbsp', 0, id FROM recipes WHERE slug = 'charred-tomato-butter-bean-stew'
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (name, quantity, unit, sort_order, recipe_id)
SELECT 'garlic, thinly sliced', '4', 'cloves', 1, id FROM recipes WHERE slug = 'charred-tomato-butter-bean-stew'
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (name, quantity, unit, sort_order, recipe_id)
SELECT 'cherry tomatoes', '500', 'g', 2, id FROM recipes WHERE slug = 'charred-tomato-butter-bean-stew'
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (name, quantity, unit, sort_order, recipe_id)
SELECT 'smoked paprika', '1', 'tsp', 3, id FROM recipes WHERE slug = 'charred-tomato-butter-bean-stew'
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (name, quantity, unit, sort_order, recipe_id)
SELECT 'butter beans (400g cans, drained)', '2', 'cans', 4, id FROM recipes WHERE slug = 'charred-tomato-butter-bean-stew'
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (name, quantity, unit, sort_order, recipe_id)
SELECT 'vegetable stock', '250', 'ml', 5, id FROM recipes WHERE slug = 'charred-tomato-butter-bean-stew'
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (name, quantity, unit, sort_order, recipe_id)
SELECT 'lemon, juiced', '0.5', '', 6, id FROM recipes WHERE slug = 'charred-tomato-butter-bean-stew'
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (name, quantity, unit, sort_order, recipe_id)
SELECT 'parsley & dill, roughly chopped', '1', 'handful', 7, id FROM recipes WHERE slug = 'charred-tomato-butter-bean-stew'
ON CONFLICT DO NOTHING;

-- Insert instructions for Charred Tomato & Butter Bean Stew
INSERT INTO instructions (step_number, content, recipe_id)
SELECT 1, 'Warm the oil in a wide, heavy pan over medium heat. Add the garlic and cook until just golden at the edges, about 2 minutes.', id FROM recipes WHERE slug = 'charred-tomato-butter-bean-stew'
ON CONFLICT DO NOTHING;

INSERT INTO instructions (step_number, content, recipe_id)
SELECT 2, 'Add the tomatoes in a single layer. Leave them untouched until they blister and char in spots, then give the pan a shake, about 8 minutes.', id FROM recipes WHERE slug = 'charred-tomato-butter-bean-stew'
ON CONFLICT DO NOTHING;

INSERT INTO instructions (step_number, content, recipe_id)
SELECT 3, 'Stir in the paprika for 30 seconds, then add the beans and stock. Press some of the tomatoes with a spoon so they burst.', id FROM recipes WHERE slug = 'charred-tomato-butter-bean-stew'
ON CONFLICT DO NOTHING;

INSERT INTO instructions (step_number, content, recipe_id)
SELECT 4, 'Simmer until the broth thickens and turns glossy, stirring now and then so nothing catches, about 12 minutes.', id FROM recipes WHERE slug = 'charred-tomato-butter-bean-stew'
ON CONFLICT DO NOTHING;

INSERT INTO instructions (step_number, content, recipe_id)
SELECT 5, 'Take off the heat, add the lemon juice and herbs, and season generously. Serve with bread for dragging through the pan.', id FROM recipes WHERE slug = 'charred-tomato-butter-bean-stew'
ON CONFLICT DO NOTHING;

-- Insert ingredients for Miso-Glazed Salmon
INSERT INTO ingredients (name, quantity, unit, sort_order, recipe_id)
SELECT 'salmon fillets (skin on)', '2', '', 0, id FROM recipes WHERE slug = 'miso-glazed-salmon'
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (name, quantity, unit, sort_order, recipe_id)
SELECT 'white miso', '2', 'tbsp', 1, id FROM recipes WHERE slug = 'miso-glazed-salmon'
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (name, quantity, unit, sort_order, recipe_id)
SELECT 'mirin', '1', 'tbsp', 2, id FROM recipes WHERE slug = 'miso-glazed-salmon'
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (name, quantity, unit, sort_order, recipe_id)
SELECT 'honey', '1', 'tsp', 3, id FROM recipes WHERE slug = 'miso-glazed-salmon'
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (name, quantity, unit, sort_order, recipe_id)
SELECT 'tenderstem broccoli', '200', 'g', 4, id FROM recipes WHERE slug = 'miso-glazed-salmon'
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (name, quantity, unit, sort_order, recipe_id)
SELECT 'toasted sesame oil', '1', 'tbsp', 5, id FROM recipes WHERE slug = 'miso-glazed-salmon'
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (name, quantity, unit, sort_order, recipe_id)
SELECT 'sesame seeds', '1', 'tsp', 6, id FROM recipes WHERE slug = 'miso-glazed-salmon'
ON CONFLICT DO NOTHING;

-- Insert instructions for Miso-Glazed Salmon
INSERT INTO instructions (step_number, content, recipe_id)
SELECT 1, 'Heat the grill to high. Whisk the miso, mirin and honey into a thick glaze.', id FROM recipes WHERE slug = 'miso-glazed-salmon'
ON CONFLICT DO NOTHING;

INSERT INTO instructions (step_number, content, recipe_id)
SELECT 2, 'Pat the salmon dry, set skin-side down on a lined tray and spread over the glaze.', id FROM recipes WHERE slug = 'miso-glazed-salmon'
ON CONFLICT DO NOTHING;

INSERT INTO instructions (step_number, content, recipe_id)
SELECT 3, 'Grill until the glaze is bubbling and charred at the edges and the fish flakes, about 8 minutes.', id FROM recipes WHERE slug = 'miso-glazed-salmon'
ON CONFLICT DO NOTHING;

INSERT INTO instructions (step_number, content, recipe_id)
SELECT 4, 'Meanwhile, stir-fry the broccoli in sesame oil with a splash of water until bright and just tender, about 4 minutes.', id FROM recipes WHERE slug = 'miso-glazed-salmon'
ON CONFLICT DO NOTHING;

INSERT INTO instructions (step_number, content, recipe_id)
SELECT 5, 'Plate the greens, top with salmon and scatter with sesame seeds.', id FROM recipes WHERE slug = 'miso-glazed-salmon'
ON CONFLICT DO NOTHING;
