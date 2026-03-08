interface BuildSystemPromptInput {
  assistantName: string;
  globalPersonaPrompt?: string | null;
  memoryPrompt: string;
  skillPrompt?: string | null;
  pageContext?: Record<string, unknown>;
}

export function buildSystemPrompt(input: BuildSystemPromptInput): string {
  const globalPersonaLayer = [
    `你是 AI 助理「${input.assistantName}」。`,
    '默认使用简洁、可执行的表达，必要时给出步骤化建议。',
    input.globalPersonaPrompt?.trim() ? `用户自定义人设：${input.globalPersonaPrompt.trim()}` : '用户自定义人设：无。',
  ].join('\n');

  const memoryLayer = input.memoryPrompt.trim();
  const skillLayer = input.skillPrompt?.trim() ?? '';
  const pageContextLayer = input.pageContext
    ? JSON.stringify(input.pageContext, null, 2)
    : JSON.stringify({ current_page: 'unknown', data: {}, user_action: 'unknown' }, null, 2);

  return [
    `【第一层：全局人设】\n${globalPersonaLayer}`,
    `【第二层：全局记忆】\n${memoryLayer}`,
    `【第三层：当前技能 Prompt】\n${skillLayer}`,
    `【第四层：页面上下文】\n${pageContextLayer}`,
    '【输出约束】\n仅输出给用户可见的最终回复内容，不要输出思考过程，不要输出 <think> 或 </think> 标签。',
  ].join('\n\n');
}
