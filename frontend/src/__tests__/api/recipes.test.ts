import { createMocks } from 'node-mocks-http';
import handler from '../index';
import { getDb, isSupabase } from '@/lib/db';

// Mock the database
jest.mock('@/lib/db');

const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockIsSupabase = isSupabase as jest.MockedFunction<typeof isSupabase>;

describe('/api/recipes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return list of recipes', async () => {
      // Mock SQLite behavior
      mockIsSupabase.mockReturnValue(false);

      const mockRecipes = [
        {
          id: 1,
          title: 'Test Recipe',
          description: 'Test description',
          image_url: null,
          prep_time: 10,
          cook_time: 20,
          servings: 4,
          difficulty: 'Easy',
          category_id: 1,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          cat_id: 1,
          cat_name: 'Mediterranean',
          cat_color: '#4A6638',
        },
      ];

      const mockDb = {
        prepare: jest.fn().mockReturnValue({
          all: jest.fn().mockReturnValue(mockRecipes),
        }),
      };

      mockGetDb.mockReturnValue(mockDb);

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toHaveLength(1);
      expect(data[0].title).toBe('Test Recipe');
      expect(data[0].category.name).toBe('Mediterranean');
    });

    it('should filter recipes by search query', async () => {
      mockIsSupabase.mockReturnValue(false);

      const mockRecipes = [
        {
          id: 1,
          title: 'Tomato Stew',
          description: 'A tomato-based stew',
          image_url: null,
          prep_time: 10,
          cook_time: 20,
          servings: 4,
          difficulty: 'Easy',
          category_id: 1,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          cat_id: 1,
          cat_name: 'Mediterranean',
          cat_color: '#4A6638',
        },
      ];

      const mockDb = {
        prepare: jest.fn().mockReturnValue({
          all: jest.fn().mockReturnValue(mockRecipes),
        }),
      };

      mockGetDb.mockReturnValue(mockDb);

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: 'tomato' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toHaveLength(1);
    });
  });

  describe('POST', () => {
    it('should create a new recipe', async () => {
      mockIsSupabase.mockReturnValue(false);

      const newRecipe = {
        title: 'New Recipe',
        description: 'New description',
        prepTime: 15,
        cookTime: 30,
        servings: 6,
        difficulty: 'Medium',
        categoryId: 2,
        ingredients: [
          { name: 'Ingredient 1', quantity: '100', unit: 'g', sortOrder: 0 },
        ],
        instructions: [
          { stepNumber: 1, content: 'Step 1 content' },
        ],
      };

      const mockDb = {
        prepare: jest.fn().mockImplementation((sql: string) => {
          if (sql.includes('INSERT INTO recipes')) {
            return {
              run: jest.fn().mockReturnValue({ lastInsertRowid: 1 }),
            };
          }
          if (sql.includes('INSERT INTO ingredients')) {
            return {
              run: jest.fn(),
            };
          }
          if (sql.includes('INSERT INTO instructions')) {
            return {
              run: jest.fn(),
            };
          }
          if (sql.includes('SELECT * FROM recipes WHERE id')) {
            return {
              get: jest.fn().mockReturnValue({
                id: 1,
                title: 'New Recipe',
                description: 'New description',
                image_url: null,
                prep_time: 15,
                cook_time: 30,
                servings: 6,
                difficulty: 'Medium',
                category_id: 2,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
              }),
            };
          }
          if (sql.includes('SELECT * FROM ingredients')) {
            return {
              all: jest.fn().mockReturnValue([
                {
                  id: 1,
                  name: 'Ingredient 1',
                  quantity: '100',
                  unit: 'g',
                  sort_order: 0,
                },
              ]),
            };
          }
          if (sql.includes('SELECT * FROM instructions')) {
            return {
              all: jest.fn().mockReturnValue([
                {
                  id: 1,
                  step_number: 1,
                  content: 'Step 1 content',
                },
              ]),
            };
          }
          return { run: jest.fn(), get: jest.fn(), all: jest.fn() };
        }),
      };

      mockGetDb.mockReturnValue(mockDb);

      const { req, res } = createMocks({
        method: 'POST',
        body: newRecipe,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.title).toBe('New Recipe');
      expect(data.ingredients).toHaveLength(1);
      expect(data.instructions).toHaveLength(1);
    });

    it('should return 400 for invalid data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          // Missing required title field
          description: 'Test',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });
  });

  describe('Invalid method', () => {
    it('should return 405 for unsupported methods', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });
  });
});
