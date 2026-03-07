import { describe, expect, it } from 'vitest';
import { buildSystemPrompt } from '../src/services/chat/system-prompt';

describe('buildSystemPrompt', () => {
  it('builds four layers with provided data', () => {
    const prompt = buildSystemPrompt({
      assistantName: '小助',
      globalPersonaPrompt: '严格督促我完成学习计划',
      memoryPrompt: '用户习惯在晚间学习。',
      skillPrompt: '你是英语学习教练。',
      pageContext: {
        current_page: 'vocabulary_list',
        user_action: 'viewing_word_detail',
      },
    });

    expect(prompt).toContain('【第一层：全局人设】');
    expect(prompt).toContain('【第二层：全局记忆】');
    expect(prompt).toContain('【第三层：当前技能 Prompt】');
    expect(prompt).toContain('【第四层：页面上下文】');
    expect(prompt).toContain('严格督促我完成学习计划');
    expect(prompt).toContain('用户习惯在晚间学习。');
    expect(prompt).toContain('你是英语学习教练。');
    expect(prompt).toContain('"current_page": "vocabulary_list"');
  });

  it('keeps memory layer placeholder as empty string when no memory exists', () => {
    const prompt = buildSystemPrompt({
      assistantName: '小助',
      memoryPrompt: '',
    });

    expect(prompt).toContain('【第二层：全局记忆】\n');
    expect(prompt).toContain('用户自定义人设：无。');
    expect(prompt).toContain('"current_page": "unknown"');
  });
});
