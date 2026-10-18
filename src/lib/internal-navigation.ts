let started = false;
let previousPath: string | null = null;
let currentPath: string | null = null;

/** 同一タブ内の画面遷移だけを覚える。再読み込みや直接アクセスではリセットされる。 */
export function trackInternalNavigation(path: string) {
  if (!path) return;
  if (!started) {
    started = true;
    currentPath = path;
    previousPath = null;
    return;
  }
  if (currentPath && currentPath !== path) {
    previousPath = currentPath;
  }
  currentPath = path;
}

export function hasInternalPreviousPage() {
  return previousPath !== null;
}
