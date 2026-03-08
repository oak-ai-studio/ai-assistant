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

type PageUiElement = {
  id: string;
  type: 'button' | 'input' | 'list' | 'filter' | 'menu' | 'card' | 'toggle';
  label: string;
  action: string;
};

function withUiElements(
  context: PageContextPayload,
  uiElements: PageUiElement[]
): PageContextPayload {
  return {
    ...context,
    data: {
      ...context.data,
      ui_elements: uiElements,
    },
  };
}

export const HOME_PAGE_CONTEXT: PageContextPayload = {
  current_page: 'home_dashboard',
  skill: 'assistant_hub',
  data: {
    ui_elements: [
      { id: 'home-skill-cards', type: 'list', label: '技能卡片网格', action: 'open_skill' },
      { id: 'home-top-menu', type: 'menu', label: '右上角菜单', action: 'open_settings_menu' },
      { id: 'home-chat-fab', type: 'button', label: '全局聊天入口', action: 'open_chat_drawer' },
    ],
  },
};

export const VOCABULARY_LIST_PAGE_CONTEXT: PageContextPayload = {
  current_page: 'vocabulary_list',
  skill: 'english_learning',
  data: {
    current_word: {
      word: 'albeit',
      pos: 'conj.',
    },
    ui_elements: [
      { id: 'vocab-word-list', type: 'list', label: '单词列表', action: 'select_word' },
      { id: 'vocab-top-menu', type: 'menu', label: '技能菜单', action: 'open_skill_menu' },
      { id: 'vocab-chat-fab', type: 'button', label: '全局聊天入口', action: 'open_chat_drawer' },
    ],
  },
};

export const VOCABULARY_SETTINGS_PAGE_CONTEXT: PageContextPayload = {
  current_page: 'vocabulary_settings',
  skill: 'english_learning',
  data: {
    frequency: 'daily',
    target_per_day: 20,
    ui_elements: [
      { id: 'vocab-disable-skill', type: 'button', label: '停用技能按钮', action: 'disable_skill' },
      { id: 'vocab-back', type: 'button', label: '返回按钮', action: 'go_back' },
    ],
  },
};

export const MEMORY_PAGE_CONTEXT: PageContextPayload = {
  current_page: 'memory_list',
  skill: 'memory_management',
  data: {
    ui_elements: [
      { id: 'memory-create', type: 'button', label: '创建记忆按钮', action: 'create_memory' },
      { id: 'memory-filter-tabs', type: 'filter', label: '记忆类型筛选', action: 'filter_memories' },
      { id: 'memory-list', type: 'list', label: '记忆列表', action: 'open_memory_detail' },
    ],
  },
};

export const SKILL_PAGE_CONTEXT: PageContextPayload = {
  current_page: 'skill_page',
  skill: 'skill_assistant',
  data: {
    ui_elements: [],
  },
};

export const COOKING_PAGE_CONTEXT: PageContextPayload = {
  current_page: 'cooking_home',
  skill: 'cooking',
  data: {
    ui_elements: [
      { id: 'cooking-back', type: 'button', label: '返回首页', action: 'go_back' },
      { id: 'cooking-card', type: 'card', label: '做饭助理卡片', action: 'view_skill_placeholder' },
    ],
  },
};

export const NOTES_LIST_PAGE_CONTEXT: PageContextPayload = {
  current_page: 'notes_list',
  skill: 'notes',
  data: {
    ui_elements: [
      { id: 'notes-create', type: 'button', label: '新建笔记按钮', action: 'create_note' },
      { id: 'notes-list', type: 'list', label: '笔记列表', action: 'open_note_detail' },
      { id: 'notes-back', type: 'button', label: '返回按钮', action: 'go_back' },
    ],
  },
};

export const NOTE_CREATE_PAGE_CONTEXT: PageContextPayload = {
  current_page: 'note_create',
  skill: 'notes',
  data: {
    ui_elements: [
      { id: 'note-create-title', type: 'input', label: '标题输入框', action: 'edit_note_title' },
      { id: 'note-create-content', type: 'input', label: '内容输入框', action: 'edit_note_content' },
      { id: 'note-create-save', type: 'button', label: '保存按钮', action: 'save_note' },
    ],
  },
};

export const NOTE_EDIT_PAGE_CONTEXT: PageContextPayload = {
  current_page: 'note_edit',
  skill: 'notes',
  data: {
    ui_elements: [
      { id: 'note-edit-title', type: 'input', label: '标题输入框', action: 'edit_note_title' },
      { id: 'note-edit-content', type: 'input', label: '内容输入框', action: 'edit_note_content' },
      { id: 'note-edit-save', type: 'button', label: '保存按钮', action: 'save_note' },
      { id: 'note-edit-delete', type: 'button', label: '删除按钮', action: 'delete_note' },
    ],
  },
};

export const MEMORY_CREATE_PAGE_CONTEXT: PageContextPayload = {
  current_page: 'memory_create',
  skill: 'memory_management',
  data: {
    ui_elements: [
      { id: 'memory-create-content', type: 'input', label: '记忆内容输入框', action: 'edit_memory_content' },
      { id: 'memory-create-type', type: 'filter', label: '记忆类型选择', action: 'select_memory_type' },
      { id: 'memory-create-save', type: 'button', label: '保存按钮', action: 'save_memory' },
    ],
  },
};

export const MEMORY_EDIT_PAGE_CONTEXT: PageContextPayload = {
  current_page: 'memory_edit',
  skill: 'memory_management',
  data: {
    ui_elements: [
      { id: 'memory-edit-content', type: 'input', label: '记忆内容输入框', action: 'edit_memory_content' },
      { id: 'memory-edit-type', type: 'filter', label: '记忆类型选择', action: 'select_memory_type' },
      { id: 'memory-edit-save', type: 'button', label: '保存按钮', action: 'save_memory' },
      { id: 'memory-edit-delete', type: 'button', label: '删除按钮', action: 'delete_memory' },
    ],
  },
};

export const ASSISTANT_SETTINGS_PAGE_CONTEXT: PageContextPayload = {
  current_page: 'assistant_settings',
  skill: 'assistant_hub',
  data: {
    ui_elements: [
      { id: 'assistant-name', type: 'input', label: '助理称呼输入框', action: 'edit_assistant_name' },
      { id: 'assistant-role', type: 'input', label: '助理角色输入框', action: 'edit_assistant_role' },
      { id: 'assistant-skill-order', type: 'list', label: '技能排序列表', action: 'reorder_skills' },
      { id: 'assistant-save', type: 'button', label: '完成按钮', action: 'save_assistant_settings' },
    ],
  },
};

export function getOpeningLineForPathname(pathname: string): string {
  if (pathname.includes('memory')) {
    return '要不要我帮你整理一下记忆？';
  }

  if (pathname.includes('skills') || pathname.includes('vocabulary') || pathname.includes('cooking')) {
    return '想聊聊这个技能吗？';
  }

  return '有什么可以帮你的？';
}

export function getPageContextForPathname(pathname: string): PageContextPayload {
  if (pathname.includes('notes/create')) {
    return NOTE_CREATE_PAGE_CONTEXT;
  }

  if (pathname.includes('notes/')) {
    return NOTE_EDIT_PAGE_CONTEXT;
  }

  if (pathname.includes('notes')) {
    return NOTES_LIST_PAGE_CONTEXT;
  }

  if (pathname.includes('memory/create')) {
    return MEMORY_CREATE_PAGE_CONTEXT;
  }

  if (pathname.includes('memory/')) {
    return MEMORY_EDIT_PAGE_CONTEXT;
  }

  if (pathname.includes('memory')) {
    return MEMORY_PAGE_CONTEXT;
  }

  if (pathname.includes('settings/assistant')) {
    return ASSISTANT_SETTINGS_PAGE_CONTEXT;
  }

  if (pathname.includes('vocabulary/settings')) {
    return VOCABULARY_SETTINGS_PAGE_CONTEXT;
  }

  if (pathname.includes('vocabulary')) {
    return VOCABULARY_LIST_PAGE_CONTEXT;
  }

  if (pathname.includes('cooking')) {
    return COOKING_PAGE_CONTEXT;
  }

  if (pathname.includes('skills')) {
    return SKILL_PAGE_CONTEXT;
  }

  return withUiElements(HOME_PAGE_CONTEXT, [
    { id: 'home-skill-cards', type: 'list', label: '技能卡片网格', action: 'open_skill' },
    { id: 'home-top-menu', type: 'menu', label: '右上角菜单', action: 'open_settings_menu' },
    { id: 'home-chat-fab', type: 'button', label: '全局聊天入口', action: 'open_chat_drawer' },
  ]);
}
