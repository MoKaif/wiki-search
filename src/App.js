import { useState, useEffect } from "react";
import { FiSearch, FiMoon, FiSun, FiZap, FiExternalLink } from "react-icons/fi";
import axios from "axios";

function App() {
  // State management
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searchInfo, setSearchInfo] = useState({});
  const [aiSummary, setAiSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [error, setError] = useState("");

  // Initialize app on component mount
  useEffect(() => {
    document.title = `${process.env.REACT_APP_APP_NAME} | AI-Powered Knowledge Search`;
    
    // Load saved theme preference
    const savedTheme = localStorage.getItem("nexawiki-theme");
    if (savedTheme) {
      setDarkMode(savedTheme === "dark");
    }
  }, []);

  // Apply theme to body when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove("light-mode");
      localStorage.setItem("nexawiki-theme", "dark");
    } else {
      document.body.classList.add("light-mode");
      localStorage.setItem("nexawiki-theme", "light");
    }
  }, [darkMode]);

  /**
   * Toggle between dark and light mode
   */
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  /**
   * Generate AI summary using Gemini 1.5 Flash API
   * @param {string} query - The search query
   */
  const getAiSummary = async (query) => {
    if (!query.trim()) return;
    
    setIsAiLoading(true);
    setError("");
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_GEMINI_API_URL}?key=${process.env.REACT_APP_GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: `Provide a concise, conversational summary about "${query}". Focus on the most important and interesting aspects. Keep it under 200 words and make it engaging like you're providing the first time information on the subject`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 300,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      if (response.data.candidates && response.data.candidates[0].content) {
        const summary = response.data.candidates[0].content.parts[0].text;
        setAiSummary(summary);
      } else {
        setError("Unable to generate AI summary at this time.");
      }
    } catch (error) {
      console.log(`${process.env.REACT_APP_GEMINI_API_URL}?key=${process.env.REACT_APP_GEMINI_API_KEY}`);
      console.error("AI Summary Error:", error);
      setError("AI summary service is temporarily unavailable.");
    } finally {
      setIsAiLoading(false);
    }
  };

  /**
   * Handle search form submission
   * @param {Event} e - Form submission event
   */
  const handleSearch = async (e) => {
    e.preventDefault();
    if (search.trim() === "") return;

    setIsLoading(true);
    setError("");
    setResults([]);
    setSearchInfo({});
    setAiSummary("");

    try {
      // Generate AI summary first
      getAiSummary(search);

      // Fetch Wikipedia results
      const endpoint = `${process.env.REACT_APP_WIKIPEDIA_API_URL}?action=query&list=search&prop=info&inprop=url&utf8=&format=json&origin=*&srlimit=${process.env.REACT_APP_MAX_SEARCH_RESULTS}&srsearch=${encodeURIComponent(search)}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();

      if (json.query && json.query.search) {
        setResults(json.query.search);
        setSearchInfo(json.query.searchinfo || {});
      } else {
        setError("No results found for your search.");
      }
    } catch (error) {
      console.error("Search Error:", error);
      setError("Failed to fetch search results. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle search input change
   * @param {Event} e - Input change event
   */
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    // Clear error when user starts typing
    if (error) setError("");
  };

  return (
    <div className="App">
      {/* Theme Toggle Button */}
      <button 
        className="theme-toggle" 
        onClick={toggleTheme} 
        aria-label="Toggle theme"
        title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
      </button>

      {/* Header Section */}
      <header>
        <h1 className="logo">{process.env.REACT_APP_APP_NAME}</h1>
        <p className="subtitle">
          {process.env.REACT_APP_APP_DESCRIPTION}
        </p>
      </header>

      {/* Search Form */}
      <div className="search-container">
        <form className="search-box" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="What would you like to know about?"
            value={search}
            onChange={handleSearchChange}
            disabled={isLoading}
            aria-label="Search query"
          />
          <button 
            type="submit" 
            className="search-button" 
            disabled={isLoading || !search.trim()}
            aria-label="Search"
          >
            {isLoading ? (
              <div className="spinner"></div>
            ) : (
              <>
                <FiSearch size={18} />
                Search
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message" style={{
          background: 'var(--surface-dark)',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '1rem',
          margin: '1rem auto',
          maxWidth: '600px',
          color: '#ef4444',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* Results Container */}
      {results.length > 0 && (
        <div className="results-container">
          {/* Results Header */}
          <div className="results-header">
            <h2>Search Results</h2>
            {searchInfo.totalhits && (
              <span className="results-count">
                {searchInfo.totalhits.toLocaleString()} results found
              </span>
            )}
          </div>

          {/* AI Summary Section */}
          {aiSummary && (
            <div className="ai-summary">
              <div className="ai-summary-header">
                <FiZap size={20} />
                AI Summary
              </div>
              <div className="ai-summary-content">
                {isAiLoading ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    Generating AI summary...
                  </div>
                ) : (
                  aiSummary
                )}
              </div>
            </div>
          )}

          {/* Wikipedia Results */}
          <div className="results">
            {results.map((result, i) => {
              const url = `https://en.wikipedia.org/?curid=${result.pageid}`;

              return (
                <div className="result" key={i}>
                  <h3>{result.title}</h3>
                  <p dangerouslySetInnerHTML={{ __html: result.snippet }}></p>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label={`Read more about ${result.title}`}
                  >
                    <FiExternalLink size={16} />
                    Read more
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && results.length === 0 && (
        <div className="loading">
          <div className="spinner"></div>
          Searching for results...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && results.length === 0 && search && !error && (
        <div className="empty-state" style={{
          textAlign: 'center',
          padding: '3rem',
          color: 'var(--text-secondary-dark)'
        }}>
          <FiSearch size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No results found</h3>
          <p>Try searching for something else or check your spelling.</p>
        </div>
      )}
    </div>
  );
}

export default App;
