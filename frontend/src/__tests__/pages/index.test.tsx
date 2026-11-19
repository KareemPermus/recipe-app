import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Home from '../index';
import apiClient from '@/lib/api';

// Mock the API client
jest.mock('@/lib/api');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Heart: () => <div data-testid="heart-icon" />,
  ChevronLeft: () => <div data-testid="chevron-left-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
  Check: () => <div data-testid="check-icon" />,
  ChefHat: () => <div data-testid="chef-hat-icon" />,
}));

describe('Home Page', () => {
  const mockRecipes = [
    {
      id: 1,
      title: 'Test Recipe 1',
      description: 'Test description 1',
      imageUrl: null,
      prepTime: 10,
      cookTime: 20,
      servings: 4,
      difficulty: 'Easy',
      categoryId: 1,
      category: {
        id: 1,
        name: 'Mediterranean',
        color: '#4A6638',
      },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: 2,
      title: 'Test Recipe 2',
      description: 'Test description 2',
      imageUrl: null,
      prepTime: 15,
      cookTime: 25,
      servings: 6,
      difficulty: 'Medium',
      categoryId: 2,
      category: {
        id: 2,
        name: 'Asian',
        color: '#B83F25',
      },
      createdAt: '2024-01-02',
      updatedAt: '2024-01-02',
    },
  ];

  const mockRecipeDetail = {
    ...mockRecipes[0],
    ingredients: [
      {
        id: 1,
        name: 'Tomatoes',
        quantity: '500',
        unit: 'g',
        sortOrder: 0,
      },
      {
        id: 2,
        name: 'Olive oil',
        quantity: '2',
        unit: 'tbsp',
        sortOrder: 1,
      },
    ],
    instructions: [
      {
        id: 1,
        stepNumber: 1,
        content: 'Heat the oil in a pan.',
      },
      {
        id: 2,
        stepNumber: 2,
        content: 'Add the tomatoes and cook.',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient.get.mockImplementation((url: string) => {
      if (url === '/api/recipes') {
        return Promise.resolve({ data: mockRecipes });
      }
      if (url.startsWith('/api/recipes/')) {
        return Promise.resolve({ data: mockRecipeDetail });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('should render the page and load recipes', async () => {
    render(<Home />);

    // Wait for recipes to load
    await waitFor(() => {
      expect(screen.getByText('Test Recipe 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Recipe 2')).toBeInTheDocument();
    expect(screen.getByText('Recipe box')).toBeInTheDocument();
  });

  it('should display recipe detail when a recipe is loaded', async () => {
    render(<Home />);

    // Wait for recipe detail to load
    await waitFor(() => {
      expect(screen.getByText('Heat the oil in a pan.')).toBeInTheDocument();
    });

    expect(screen.getByText('Ingredients')).toBeInTheDocument();
    expect(screen.getByText('Method')).toBeInTheDocument();
    expect(screen.getByText('Tomatoes')).toBeInTheDocument();
  });

  it('should filter recipes by search query', async () => {
    render(<Home />);

    // Wait for recipes to load
    await waitFor(() => {
      expect(screen.getByText('Test Recipe 1')).toBeInTheDocument();
    });

    // Type in search box
    const searchInput = screen.getByPlaceholderText('Search recipes or ingredients');
    fireEvent.change(searchInput, { target: { value: 'Recipe 2' } });

    // Recipe 1 should be hidden, Recipe 2 should be visible
    expect(screen.queryByText('Test Recipe 1')).not.toBeInTheDocument();
    expect(screen.getByText('Test Recipe 2')).toBeInTheDocument();
  });

  it('should filter recipes by category', async () => {
    render(<Home />);

    // Wait for recipes to load
    await waitFor(() => {
      expect(screen.getByText('Test Recipe 1')).toBeInTheDocument();
    });

    // Click Mediterranean filter
    const mediterraneanButton = screen.getByRole('button', { name: 'Mediterranean' });
    fireEvent.click(mediterraneanButton);

    // Only Mediterranean recipe should be visible
    expect(screen.getByText('Test Recipe 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Recipe 2')).not.toBeInTheDocument();
  });

  it('should change servings when plus/minus buttons are clicked', async () => {
    render(<Home />);

    // Wait for recipe detail to load
    await waitFor(() => {
      expect(screen.getByText('4 servings')).toBeInTheDocument();
    });

    // Click plus button
    const plusButtons = screen.getAllByLabelText('More servings');
    fireEvent.click(plusButtons[0]);

    // Servings should increase
    await waitFor(() => {
      expect(screen.getByText('5 servings')).toBeInTheDocument();
    });

    // Click minus button
    const minusButtons = screen.getAllByLabelText('Fewer servings');
    fireEvent.click(minusButtons[0]);

    // Servings should decrease back to 4
    await waitFor(() => {
      expect(screen.getByText('4 servings')).toBeInTheDocument();
    });
  });

  it('should toggle ingredient checkbox', async () => {
    render(<Home />);

    // Wait for ingredients to load
    await waitFor(() => {
      expect(screen.getByText('Tomatoes')).toBeInTheDocument();
    });

    // Find and click the first checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Verify the checked count increased
    expect(screen.getByText(/1 of 2 on hand/)).toBeInTheDocument();
  });

  it('should toggle step completion', async () => {
    render(<Home />);

    // Wait for instructions to load
    await waitFor(() => {
      expect(screen.getByText('Heat the oil in a pan.')).toBeInTheDocument();
    });

    // Find and click step 1 button
    const stepButtons = screen.getAllByRole('button', { pressed: false });
    const step1Button = stepButtons.find((btn) => btn.getAttribute('aria-label')?.includes('Step 1'));

    if (step1Button) {
      fireEvent.click(step1Button);
      expect(step1Button).toHaveAttribute('aria-pressed', 'true');
    }
  });
});
