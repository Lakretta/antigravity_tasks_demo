export default function TagFilters({
  allTagsInList,
  selectedTagFilter,
  setSelectedTagFilter,
  getTagColor
}) {
  if (allTagsInList.length === 0) return null;

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '20px',
        overflowX: 'auto',
        paddingBottom: '6px',
        flexWrap: 'wrap'
      }} 
      className="scroller"
    >
      <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Filter by tag:</span>
      <button
        data-testid="tag-filter-All"
        onClick={() => setSelectedTagFilter(null)}
        style={{
          fontSize: '12px',
          padding: '4px 12px',
          borderRadius: '16px',
          backgroundColor: selectedTagFilter === null ? 'var(--color-brand)' : 'var(--bg-tertiary)',
          color: selectedTagFilter === null ? '#fff' : 'var(--text-primary)',
          fontWeight: '500',
          border: '1px solid ' + (selectedTagFilter === null ? 'var(--color-brand)' : 'var(--border-color)'),
          cursor: 'pointer'
        }}
      >
        All
      </button>
      {allTagsInList.map(tag => {
        const colors = getTagColor(tag);
        const isSelected = selectedTagFilter === tag;
        return (
          <button
            key={tag}
            data-testid={`tag-filter-${tag}`}
            onClick={() => setSelectedTagFilter(isSelected ? null : tag)}
            style={{
              fontSize: '12px',
              padding: '4px 12px',
              borderRadius: '16px',
              backgroundColor: isSelected ? 'var(--color-brand)' : colors.bg,
              color: isSelected ? '#fff' : colors.text,
              border: '1px solid ' + (isSelected ? 'var(--color-brand)' : colors.border),
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
