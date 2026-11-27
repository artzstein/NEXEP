import { recordSkillViewLocal } from "../utils/localStore";

export function trackSkillView(skillId) {
  try {
    recordSkillViewLocal(skillId);
  } catch {
    // ignore tracking failures
  }
}