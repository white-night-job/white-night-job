const SHOP_JOB_FORM_DRAFT_KEY = "wnj-shop-job-form-draft";
const ADMIN_JOB_FORM_DRAFT_KEY = "wnj-admin-job-form-draft";

export type ShopJobFormDraft = {
  form: Record<string, unknown>;
  isFormOpen: boolean;
  showPreview: boolean;
  savedAt: number;
};

export type AdminJobFormDraft = {
  form: Record<string, unknown>;
  editingId: string | null;
  draftJobId: string;
  isAddFormOpen: boolean;
  editingListingStatus: string;
  showPreview: boolean;
  previewKind: "publish" | "draft";
  savedAt: number;
};

function writeDraft<T>(key: string, draft: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // ignore quota / private mode
  }
}

function readDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function removeDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function saveShopJobFormDraft(draft: ShopJobFormDraft): void {
  writeDraft(SHOP_JOB_FORM_DRAFT_KEY, draft);
}

export function loadShopJobFormDraft(): ShopJobFormDraft | null {
  return readDraft<ShopJobFormDraft>(SHOP_JOB_FORM_DRAFT_KEY);
}

export function clearShopJobFormDraft(): void {
  removeDraft(SHOP_JOB_FORM_DRAFT_KEY);
}

export function saveAdminJobFormDraft(draft: AdminJobFormDraft): void {
  writeDraft(ADMIN_JOB_FORM_DRAFT_KEY, draft);
}

export function loadAdminJobFormDraft(): AdminJobFormDraft | null {
  return readDraft<AdminJobFormDraft>(ADMIN_JOB_FORM_DRAFT_KEY);
}

export function clearAdminJobFormDraft(): void {
  removeDraft(ADMIN_JOB_FORM_DRAFT_KEY);
}
