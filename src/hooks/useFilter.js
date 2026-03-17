import { useMemo } from 'react';

export function useFilter(locations, filter, query, sort) {
  return useMemo(() => {
    return locations
      .filter(loc => {
        const matchFilter =
          filter === 'all' ||
          loc.filter === filter ||
          (filter === 'open' && loc.status === 'open');
        const q = query.toLowerCase().trim();
        const matchQuery =
          !q ||
          (loc.name || '').toLowerCase().includes(q) ||
          (loc.type || '').toLowerCase().includes(q) ||
          (Array.isArray(loc.tags) &&
            loc.tags.some(t => String(t).toLowerCase().includes(q))) ||
          (loc.address || '').toLowerCase().includes(q);
        return matchFilter && matchQuery;
      })
      .sort((a, b) =>
        sort === 'name'
          ? (a.name || '').localeCompare(b.name || '')
          : (a.dist ?? Number.MAX_SAFE_INTEGER) - (b.dist ?? Number.MAX_SAFE_INTEGER)
      );
  }, [locations, filter, query, sort]);
}
