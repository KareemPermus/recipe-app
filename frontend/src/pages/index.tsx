import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Search, Clock, Heart, ChevronLeft, ChevronRight, Plus, Minus, Check } from 'lucide-react';
import TopBar from '@/components/TopBar';
import RecipeArt from '@/components/RecipeArt';
import apiClient from '@/lib/api';
import styles from './index.module.css';

interface Category {
  id: number;
  name: string;
  color: string | null;
}

interface Recipe {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  difficulty: string | null;
  categoryId: number | null;
  category: Category | null;
  createdAt: string;
  updatedAt: string;
}

interface RecipeDetail extends Recipe {
  ingredients: Array<{
    id: number;
    name: string;
    quantity: string | null;
    unit: string | null;
    sortOrder: number;
  }>;
  instructions: Array<{
    id: number;
    stepNumber: number;
    content: string;
  }>;
}

// Generate color palette for recipe illustrations
function getPalette(categoryColor: string | null): string[] {
  const palettes: { [key: string]: string[] } = {
    '#4A6638': ['#EED3B4', '#C2462A', '#F5E6C8', '#4E6A3B'], // Mediterranean
    '#B83F25': ['#E6DCC8', '#E07B4C', '#F6EBD9', '#3F6B45'], // Asian
    '#E5B443': ['#F1DDB5', '#A8662E', '#F7EBD3', '#E5B443'], // Baking
    '#6F6052': ['#E3E6C6', '#F1D97A', '#FAF2DC', '#6E8F3E'], // Quick & Easy
  };

  return palettes[categoryColor || '#6F6052'] || palettes['#6F6052'];
}

// Format time helper
function formatTime(minutes: number | null): string {
  if (!minutes) return '0 min';
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
  }
  return `${minutes} min`;
}

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [servings, setServings] = useState<number>(4);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());

  const filters = ['All', 'Mediterranean', 'Asian', 'Baking', 'Quick & Easy'];

  // Fetch recipes on mount
  useEffect(() => {
    fetchRecipes();
  }, []);

  async function fetchRecipes() {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/recipes');
      setRecipes(response.data);

      // Auto-select first recipe
      if (response.data.length > 0) {
        fetchRecipeDetail(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecipeDetail(id: number) {
    try {
      setDetailLoading(true);
      const response = await apiClient.get(`/api/recipes/${id}`);
      setSelectedRecipe(response.data);
      setServings(response.data.servings || 4);
      setCheckedIngredients(new Set());
      setDoneSteps(new Set());
    } catch (error) {
      console.error('Error fetching recipe detail:', error);
    } finally {
      setDetailLoading(false);
    }
  }

  // Filter recipes
  const filteredRecipes = recipes.filter((recipe) => {
    if (selectedFilter !== 'All' && recipe.category?.name !== selectedFilter) {
      return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        recipe.title.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  function handleRecipeSelect(id: number) {
    fetchRecipeDetail(id);
  }

  function toggleIngredient(id: number) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleStep(index: number) {
    setDoneSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function scaleQuantity(quantity: string | null, unit: string | null, scale: number): string {
    if (!quantity) return '';

    const num = parseFloat(quantity);
    if (isNaN(num)) return quantity;

    const scaled = num * scale;

    // Format based on unit
    if (unit === 'g' || unit === 'ml') {
      const val = scaled >= 100 ? Math.round(scaled / 5) * 5 : Math.round(scaled);
      if (val >= 1000) {
        return `${(val / 1000).toFixed(2)} ${unit === 'ml' ? 'l' : 'kg'}`;
      }
      return `${val} ${unit}`;
    }

    if (unit === 'kg') {
      return `${scaled.toFixed(2)} kg`;
    }

    // For other units, use fractions
    const whole = Math.floor(scaled);
    const frac = scaled - whole;

    const fractions: { [key: number]: string } = {
      0.125: '⅛',
      0.25: '¼',
      0.375: '⅜',
      0.5: '½',
      0.625: '⅝',
      0.75: '¾',
      0.875: '⅞',
    };

    let fracStr = '';
    if (Math.abs(frac - 1 / 3) < 0.04) fracStr = '⅓';
    else if (Math.abs(frac - 2 / 3) < 0.04) fracStr = '⅔';
    else {
      const rounded = Math.round(frac * 8) / 8;
      fracStr = fractions[rounded] || '';
    }

    const result = (whole ? whole : '') + fracStr;
    return result ? `${result}${unit ? ' ' + unit : ''}` : '⅛' + (unit ? ' ' + unit : '');
  }

  const scale = selectedRecipe ? servings / (selectedRecipe.servings || 4) : 1;

  return (
    <>
      <Head>
        <title>Larder · Recipe Box</title>
      </Head>
      <TopBar />
      <div className={styles.shell}>
        {/* Recipe Library Sidebar */}
        <aside className={styles.library} aria-label="Recipe box">
          <div className={styles.libHead}>
            <h2>Recipe box</h2>
            <span>{filteredRecipes.length} of {recipes.length}</span>
          </div>

          <label className={styles.search}>
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Search recipes</span>
            <input
              type="search"
              placeholder="Search recipes or ingredients"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </label>

          <div className={styles.chips} role="group" aria-label="Filter recipes">
            {filters.map((filter) => (
              <button
                key={filter}
                className={styles.chip}
                aria-pressed={selectedFilter === filter}
                onClick={() => setSelectedFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <ul className={styles.list} aria-label="Recipes">
            {filteredRecipes.map((recipe) => (
              <li key={recipe.id}>
                <button
                  className={styles.item}
                  aria-current={selectedRecipe?.id === recipe.id}
                  onClick={() => handleRecipeSelect(recipe.id)}
                >
                  <span className={styles.thumb}>
                    <RecipeArt palette={getPalette(recipe.category?.color || null)} />
                  </span>
                  <span className={styles.itemBody}>
                    <span className={styles.itemTitle}>{recipe.title}</span>
                    <span className={styles.itemMeta}>
                      <span className={styles.metaItem}>
                        <Clock size={13} aria-hidden="true" />
                        {formatTime((recipe.prepTime || 0) + (recipe.cookTime || 0))}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {filteredRecipes.length === 0 && !loading && (
            <div className={styles.empty}>
              <strong>Nothing in the box</strong>
              No saved recipes match that.{' '}
              <button
                className={styles.linkBtn}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFilter('All');
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </aside>

        {/* Recipe Detail */}
        <main className={styles.recipe}>
          {detailLoading ? (
            <div className={styles.skeleton} aria-busy="true">
              <span className="sr-only" role="status">
                Loading recipe…
              </span>
              <div className={styles.skeletonHero}>
                <div>
                  <div className={styles.sk} style={{ width: '160px', height: '14px' }} />
                  <div className={styles.sk} style={{ width: '80%', height: '46px', margin: '16px 0 10px' }} />
                  <div className={styles.sk} style={{ width: '60%', height: '46px', marginBottom: '18px' }} />
                  <div className={styles.sk} style={{ width: '90%', height: '16px', marginBottom: '8px' }} />
                  <div className={styles.sk} style={{ width: '70%', height: '16px', marginBottom: '22px' }} />
                </div>
                <div className={`${styles.sk} ${styles.artSk}`} />
              </div>
            </div>
          ) : selectedRecipe ? (
            <article>
              <header className={styles.hero}>
                <div>
                  <div className={styles.kicker}>
                    <span>{selectedRecipe.category?.name || 'Recipe'}</span>
                  </div>
                  <h1 tabIndex={-1}>{selectedRecipe.title}</h1>
                  <p className={styles.dek}>{selectedRecipe.description}</p>

                  <dl className={styles.facts}>
                    <div className={styles.fact}>
                      <dt>Prep</dt>
                      <dd>{formatTime(selectedRecipe.prepTime)}</dd>
                    </div>
                    <div className={styles.fact}>
                      <dt>Cook</dt>
                      <dd>{formatTime(selectedRecipe.cookTime)}</dd>
                    </div>
                    <div className={styles.fact}>
                      <dt>Total</dt>
                      <dd>{formatTime((selectedRecipe.prepTime || 0) + (selectedRecipe.cookTime || 0))}</dd>
                    </div>
                    <div className={styles.fact}>
                      <dt>Level</dt>
                      <dd>{selectedRecipe.difficulty || 'Easy'}</dd>
                    </div>
                  </dl>

                  <div className={styles.actions}>
                    <button className={`${styles.btn} ${styles.btnPrimary}`}>
                      <Heart size={18} />
                      <span>Save</span>
                    </button>
                  </div>
                </div>

                <div className={styles.art}>
                  <RecipeArt palette={getPalette(selectedRecipe.category?.color || null)} />
                </div>
              </header>

              <div className={styles.body}>
                {/* Ingredients Card */}
                <section className={styles.ingCard} aria-labelledby="ingH">
                  <div className={styles.secHead}>
                    <h2 id="ingH">Ingredients</h2>
                    <div className={styles.stepper} role="group" aria-label="Servings">
                      <button
                        aria-label="Fewer servings"
                        disabled={servings <= 1}
                        onClick={() => setServings(Math.max(1, servings - 1))}
                      >
                        <Minus size={18} />
                      </button>
                      <output aria-live="polite">
                        {servings} serving{servings > 1 ? 's' : ''}
                      </output>
                      <button
                        aria-label="More servings"
                        disabled={servings >= 24}
                        onClick={() => setServings(Math.min(24, servings + 1))}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>

                  {servings !== selectedRecipe.servings && (
                    <div className={styles.scaledNote}>
                      Scaled from {selectedRecipe.servings} servings ·{' '}
                      <button
                        className={styles.linkBtn}
                        style={{ color: 'inherit', padding: 0 }}
                        onClick={() => setServings(selectedRecipe.servings || 4)}
                      >
                        Reset
                      </button>
                    </div>
                  )}

                  <ul className={styles.ingList}>
                    {selectedRecipe.ingredients.map((ing) => (
                      <li key={ing.id}>
                        <label className={styles.ing}>
                          <input
                            type="checkbox"
                            checked={checkedIngredients.has(ing.id)}
                            onChange={() => toggleIngredient(ing.id)}
                          />
                          <span className={styles.box} aria-hidden="true">
                            <Check size={14} />
                          </span>
                          <span className={styles.ingText}>
                            <span className={styles.qty}>
                              {scaleQuantity(ing.quantity, ing.unit, scale)}
                            </span>{' '}
                            {ing.name}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>

                  <div className={styles.ingFoot}>
                    <span>
                      {checkedIngredients.size} of {selectedRecipe.ingredients.length} on hand
                    </span>
                    <button className={styles.linkBtn} onClick={() => setCheckedIngredients(new Set())}>
                      Uncheck all
                    </button>
                  </div>
                </section>

                {/* Method */}
                <section aria-labelledby="methH">
                  <div className={styles.secHead}>
                    <h2 id="methH">Method</h2>
                    <span className={styles.hint}>Tap a number to mark a step done</span>
                  </div>

                  <ol className={styles.steps}>
                    {selectedRecipe.instructions.map((inst, idx) => (
                      <li key={inst.id} className={`${styles.step} ${doneSteps.has(idx) ? styles.done : ''}`}>
                        <button
                          className={styles.stepNum}
                          aria-pressed={doneSteps.has(idx)}
                          aria-label={`Step ${inst.stepNumber} done`}
                          onClick={() => toggleStep(idx)}
                        >
                          {doneSteps.has(idx) ? <Check size={18} /> : inst.stepNumber}
                        </button>
                        <div>
                          <p className={styles.stepText}>{inst.content}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
            </article>
          ) : (
            <div className={styles.empty}>
              <strong>No recipe selected</strong>
              Select a recipe from the box to view details.
            </div>
          )}
        </main>
      </div>
    </>
  );
}
