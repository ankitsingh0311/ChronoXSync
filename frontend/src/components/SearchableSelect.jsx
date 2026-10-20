import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Check, X, Sparkles, Plus } from 'lucide-react';

/**
 * SearchableSelect
 * Ultra-luxury, fully interactive searchable dropdown / combobox component.
 * Supports:
 *  - Categorized or flat options
 *  - Real-time search filtering across title & category
 *  - Category tab filtering pills
 *  - Custom option write-in fallback
 *  - Clear button
 *  - Smooth Framer Motion animations & theme-colored glowing borders
 */
export default function SearchableSelect({
  value,
  onChange,
  placeholder = 'Select or search...',
  label,
  icon: IconComponent,
  accentColor = '#f59e0b',
  categories = [],
  flatOptions = [],
  helperText,
  required = false,
  emptyMessage = 'No matching options found'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Flatten options if categorized
  const allItems = useMemo(() => {
    if (categories && categories.length > 0) {
      const items = [];
      categories.forEach((cat) => {
        cat.items.forEach((item) => {
          items.push({
            name: typeof item === 'string' ? item : item.name,
            category: cat.name,
            badge: cat.badge || cat.name
          });
        });
      });
      return items;
    }
    return (flatOptions || []).map((opt) => ({
      name: opt,
      category: 'General',
      badge: 'General'
    }));
  }, [categories, flatOptions]);

  // Extract unique category names
  const categoryNames = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    return categories.map((c) => c.name);
  }, [categories]);

  // Filtered items based on search query & active category tab
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchesCategory =
        activeCategory === 'ALL' || item.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [allItems, searchQuery, activeCategory]);

  // Check if current search query already matches an existing option exactly
  const hasExactMatch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return allItems.some((item) => item.name.toLowerCase() === q);
  }, [allItems, searchQuery]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
      setActiveCategory('ALL');
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelect = (selectedName) => {
    onChange(selectedName);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '10.5px',
            fontWeight: 600,
            color: '#94a3b8',
            marginBottom: '5px',
            letterSpacing: '0.02em'
          }}
        >
          <span>{label}</span>
          {value && (
            <span
              style={{
                fontSize: '9.5px',
                color: accentColor,
                fontWeight: 600
              }}
            >
              Selected
            </span>
          )}
        </label>
      )}

      {/* Main Select Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '11px 14px',
          borderRadius: '10px',
          background: 'rgba(15,23,42,0.85)',
          border: `1px solid ${
            isOpen ? accentColor : 'rgba(255,255,255,0.12)'
          }`,
          boxShadow: isOpen
            ? `0 0 16px ${accentColor}33, inset 0 1px 2px rgba(0,0,0,0.5)`
            : 'inset 0 1px 2px rgba(0,0,0,0.4)',
          color: value ? '#f8fafc' : '#64748b',
          fontSize: '12px',
          fontWeight: value ? 600 : 400,
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          backdropFilter: 'blur(12px)',
          outline: 'none',
          position: 'relative'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: 0,
            flex: 1,
            paddingRight: '6px'
          }}
        >
          {IconComponent && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: `${accentColor}18`,
                color: accentColor,
                flexShrink: 0
              }}
            >
              <IconComponent size={13} />
            </div>
          )}
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: value ? '#f1f5f9' : '#64748b',
              fontSize: '12px',
              fontFamily: 'inherit'
            }}
          >
            {value || placeholder}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {value && (
            <div
              onClick={handleClear}
              role="button"
              tabIndex={0}
              title="Clear selection"
              style={{
                padding: '2px',
                borderRadius: '4px',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              <X size={13} />
            </div>
          )}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}
          >
            <ChevronDown size={14} />
          </motion.div>
        </div>
      </button>

      {/* Helper text if closed */}
      {helperText && !isOpen && (
        <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
          {helperText}
        </div>
      )}

      {/* Floating Interactive Search & Options Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 9999,
              marginTop: '4px',
              borderRadius: '14px',
              background: 'rgba(10,13,24,0.98)',
              backdropFilter: 'blur(24px)',
              border: `1px solid ${accentColor}44`,
              boxShadow: `0 20px 50px rgba(0,0,0,0.85), 0 0 25px ${accentColor}22`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '360px'
            }}
          >
            {/* Pinned Search Input Header */}
            <div
              style={{
                padding: '10px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)'
              }}
            >
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    color: accentColor,
                    pointerEvents: 'none'
                  }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${allItems.length} options...`}
                  style={{
                    width: '100%',
                    padding: '8px 30px 8px 32px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f8fafc',
                    fontSize: '11.5px',
                    outline: 'none',
                    transition: 'border-color 0.15s'
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = `${accentColor}88`)
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = 'rgba(255,255,255,0.1)')
                  }
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Category Filter Pills (if multiple categories available) */}
              {categoryNames.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '8px',
                    overflowX: 'auto',
                    paddingBottom: '2px',
                    scrollbarWidth: 'none'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveCategory('ALL')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '9.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background:
                        activeCategory === 'ALL'
                          ? accentColor
                          : 'rgba(255,255,255,0.06)',
                      color:
                        activeCategory === 'ALL' ? '#0f172a' : '#94a3b8',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s'
                    }}
                  >
                    All ({allItems.length})
                  </button>
                  {categoryNames.map((cat) => {
                    const count = allItems.filter(
                      (i) => i.category === cat
                    ).length;
                    const isActive = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '9.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: 'none',
                          background: isActive
                            ? accentColor
                            : 'rgba(255,255,255,0.06)',
                          color: isActive ? '#0f172a' : '#94a3b8',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s'
                        }}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Results Counter Sub-header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 12px',
                fontSize: '9px',
                color: '#64748b',
                background: 'rgba(0,0,0,0.2)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              <span>{filteredItems.length} Available Options</span>
              {activeCategory !== 'ALL' && (
                <span style={{ color: accentColor }}>{activeCategory}</span>
              )}
            </div>

            {/* Scrollable Option List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                maxHeight: '230px'
              }}
            >
              {/* Custom Write-In Fallback Button */}
              {searchQuery.trim() && !hasExactMatch && (
                <button
                  type="button"
                  onClick={() => handleSelect(searchQuery.trim())}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: `${accentColor}15`,
                    border: `1px dashed ${accentColor}55`,
                    color: accentColor,
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginBottom: '4px'
                  }}
                >
                  <Plus size={13} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, wordBreak: 'break-word' }}>
                    Use custom: <strong>"{searchQuery.trim()}"</strong>
                  </span>
                  <span
                    style={{
                      fontSize: '8.5px',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      background: accentColor,
                      color: '#0f172a',
                      fontWeight: 700
                    }}
                  >
                    Custom
                  </span>
                </button>
              )}

              {filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => {
                  const isSelected = value === item.name;
                  return (
                    <button
                      key={`${item.name}-${idx}`}
                      type="button"
                      onClick={() => handleSelect(item.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: isSelected
                          ? `${accentColor}22`
                          : 'transparent',
                        border: isSelected
                          ? `1px solid ${accentColor}55`
                          : '1px solid transparent',
                        color: isSelected ? '#f8fafc' : '#cbd5e1',
                        fontSize: '11.5px',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.12s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background =
                            'rgba(255,255,255,0.06)';
                          e.currentTarget.style.color = '#ffffff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#cbd5e1';
                        }
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          minWidth: 0,
                          flex: 1
                        }}
                      >
                        {isSelected && (
                          <Check
                            size={13}
                            style={{ color: accentColor, flexShrink: 0 }}
                          />
                        )}
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.name}
                        </span>
                      </div>

                      {item.badge && (
                        <span
                          style={{
                            fontSize: '8.5px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isSelected
                              ? `${accentColor}33`
                              : 'rgba(255,255,255,0.06)',
                            color: isSelected ? accentColor : '#94a3b8',
                            flexShrink: 0,
                            marginLeft: '8px'
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div
                  style={{
                    padding: '20px 12px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '11px'
                  }}
                >
                  <p style={{ margin: 0 }}>{emptyMessage}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '9.5px', color: '#94a3b8' }}>
                    Type your specific program or subject above to add it.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
