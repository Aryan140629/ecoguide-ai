import { describe, it, expect } from 'vitest';
import { SYSTEM_PROMPT } from '../../services/systemPrompt';

describe('System Prompt Evaluation Suite', () => {
  it('should explicitly forbid the AI from hallucinating calculations', () => {
    const lowerPrompt = SYSTEM_PROMPT.toLowerCase();
    
    // Key rules the prompt MUST contain to prevent hallucinations
    expect(lowerPrompt).toMatch(/do not calculate|never calculate|do not invent|never invent/);
    expect(lowerPrompt).toMatch(/engine truth|truth source/);
  });

  it('should explicitly require referencing the existing recommendations', () => {
    const lowerPrompt = SYSTEM_PROMPT.toLowerCase();
    
    // Key rules the prompt MUST contain to force referencing recommendations
    expect(lowerPrompt).toMatch(/only suggest actions from "top recommendations"|only from engine-provided recommendations/);
  });

  it('should forbid overriding deterministic logic', () => {
    const lowerPrompt = SYSTEM_PROMPT.toLowerCase();
    
    // Key rules to prevent overriding
    expect(lowerPrompt).toMatch(/do not override|never override/);
  });
});
