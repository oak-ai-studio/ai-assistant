/**
 * 页面上下文 JSON 结构（发送给对话系统）
 *
 * {
 *   "current_page": "vocabulary_list",
 *   "skill": "english_learning",
 *   "data": {
 *     "current_word": {
 *       "word": "albeit",
 *       "pos": "conj."
 *     }
 *   }
 * }
 */
export type PageContextPayload = {
  current_page: string;
  skill: string;
  data: Record<string, unknown>;
};

export const HOME_PAGE_CONTEXT: PageContextPayload = {
  current_page: 'home_dashboard',
  skill: 'assistant_hub',
  data: {},
};

export const VOCABULARY_LIST_PAGE_CONTEXT: PageContextPayload = {
  current_page: 'vocabulary_list',
  skill: 'english_learning',
  data: {
    current_word: {
      word: 'albeit',
      pos: 'conj.',
    },
  },
};

export const VOCABULARY_SETTINGS_PAGE_CONTEXT: PageContextPayload = {
  current_page: 'vocabulary_settings',
  skill: 'english_learning',
  data: {
    frequency: 'daily',
    target_per_day: 20,
  },
};

export function getPageContextForPathname(pathname: string): PageContextPayload {
  if (pathname.includes('vocabulary/settings')) {
    return VOCABULARY_SETTINGS_PAGE_CONTEXT;
  }

  if (pathname.includes('vocabulary')) {
    return VOCABULARY_LIST_PAGE_CONTEXT;
  }

  return HOME_PAGE_CONTEXT;
}
