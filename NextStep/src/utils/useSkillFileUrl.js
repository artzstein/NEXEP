import { useEffect, useState } from "react";
import { getSkillFileBlob } from "./localStore";

export function useSkillFileUrl(skillId, kind, enabled = true) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!enabled || !skillId) {
      return;
    }

    let cancelled = false;
    let objectUrl = null;

    getSkillFileBlob(skillId, kind)
      .then((blob) => {
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [skillId, kind, enabled]);

  return enabled && skillId ? url : null;
}
