interface BuildSystemPromptInput {
  assistantName: string;
  globalPersonaPrompt?: string | null;
  memoryPrompt: string;
  skillPrompt?: string | null;
  pageContext?: Record<string, unknown>;
}

export function buildSystemPrompt(input: BuildSystemPromptInput): string {
  const normalizedGlobalPersona =
    typeof input.globalPersonaPrompt === 'string' ? input.globalPersonaPrompt.trim() : '';
  const normalizedMemoryPrompt =
    typeof input.memoryPrompt === 'string' ? input.memoryPrompt.trim() : '';
  const normalizedSkillPrompt =
    typeof input.skillPrompt === 'string' ? input.skillPrompt.trim() : '';

  const globalPersonaLayer = [
    `你是 AI 助理「${input.assistantName}」。`,
    '默认使用简洁、可执行的表达，必要时给出步骤化建议。',
    normalizedGlobalPersona ? `用户自定义人设：${normalizedGlobalPersona}` : '用户自定义人设：无。',
  ].join('\n');

  const memoryLayer = normalizedMemoryPrompt;
  const skillLayer = normalizedSkillPrompt;
  const pageContextLayer = input.pageContext
    ? JSON.stringify(input.pageContext, null, 2)
    : JSON.stringify({ current_page: 'unknown', data: {}, user_action: 'unknown' }, null, 2);

  return [
    `【第一层：全局人设】\n${globalPersonaLayer}`,
    `【第二层：全局记忆】\n${memoryLayer}`,
    `【第三层：当前技能 Prompt】\n${skillLayer}`,
    `【第四层：页面上下文】\n${pageContextLayer}`,
    '【记忆使用约束】\n如果第二层包含与用户问题相关的记忆，必须优先基于这些记忆回答；不要回答“我不知道”或“我不保存偏好”。只有在第二层为空或与问题明显无关时，才说明信息不足。',
    '【输出约束】\n仅输出给用户可见的最终回复内容，不要输出思考过程，不要输出 <think> 或 </think> 标签。',
  ].join('\n\n');
}
