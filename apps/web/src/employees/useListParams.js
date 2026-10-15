import { useSearchParams } from 'react-router-dom';

const DEFAULTS = { page: 1, pageSize: 25, sortBy: 'fullName', sortDir: 'asc' };
const KEYS = ['search', 'country', 'department', 'jobTitle', 'sortBy', 'sortDir', 'page'];

/**
 * List state (filters, sort, page) lives in the URL so views can be bookmarked,
 * shared, and navigated with the back button.
 */
export function useListParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = { ...DEFAULTS };
  for (const key of KEYS) {
    const value = searchParams.get(key);
    if (value) params[key] = key === 'page' ? Number(value) || 1 : value;
  }

  /** Merges changes; any change other than paging returns to page 1. */
  const update = (changes) => {
    const next = { ...params, ...changes };
    if (!('page' in changes)) next.page = 1;
    const query = {};
    for (const key of KEYS) {
      const value = next[key];
      if (value && value !== DEFAULTS[key]) query[key] = String(value);
    }
    setSearchParams(query, { replace: 'search' in changes });
  };

  return [params, update];
}
