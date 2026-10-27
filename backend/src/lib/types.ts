export const AUTH_ROLES = ["super_admin", "designer", "user"] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

export type Permission =
  | "users:read"
  | "users:create"
  | "users:update"
  | "users:delete"
  | "roles:read"
  | "roles:update"
  | "designer:dashboard"
  | "user:dashboard"
  | "vendors:manage"
  | "product_templates:manage";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  roles: AuthRole[];
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
};

export type LoginResponse = {
  user: AuthUser;
  redirectTo: string;
};

export type UserPayload = {
  email: string;
  name: string;
  role: AuthRole;
  password?: string;
  isActive?: boolean;
};

export type ProductOrientation = "landscape" | "portrait" | "square";

export type ProductTemplateImageModel = {
  id: number;
  templateId: number;
  imageUrl: string;
  imageName?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  title?: string | null;
  imageType?: string;
  isActive?: boolean;
};
export type ProductImageModel = ProductTemplateImageModel;

export type ProductTemplateModel = {
  id: number;
  name: string;
  description: string | null;
  widthPx: number;
  heightPx: number;
  dimensionsLabel: string | null;
  orientation: ProductOrientation;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fields?: ProductTemplateFieldModel[];
  images?: ProductTemplateImageModel[];
};

export type ProductTemplateFieldModel = {
  id: number;
  templateId: number;
  label: string;
  fieldLabel?: string;
  fieldKey?: string;
  fieldType: string;
  placeholder?: string | null;
  options?: string[] | null;
  isRequired: boolean;
  isEditable: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductCustomizationModel = {
  id: number;
  templateId: number;
  userId: number;
  quantity?: number;
  customizationValues: Record<string, any>;
  status?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductSubmissionStatus =
  | "Pending"
  | "In Review"
  | "Changes Requested"
  | "Approved"
  | "Rejected"
  | "Completed";

export type ProductSubmissionFileModel = {
  id: number;
  submissionId: number;
  version: number;
  fileUrl: string;
  fileName?: string | null;
  uploadedBy: number;
  uploadedByName?: string | null;
  sortOrder: number;
  replacedFileId?: number | null;
  createdAt: string;
  isReplaced?: boolean;
  history?: ProductSubmissionFileModel[];
};

export type ProductSubmissionMessageModel = {
  id: number;
  submissionId: number;
  imageId?: number | null;
  senderUserId: number;
  senderRole: string;
  senderName?: string | null;
  message: string;
  createdAt: string;
};

export type ProductSubmissionThreadModel = {
  submission: ProductSubmissionDetailModel;
  files: ProductSubmissionFileModel[];
  messages: ProductSubmissionMessageModel[];
};

export type ProductSubmissionDetailModel = {
  id: number;
  templateId: number;
  templateName: string;
  widthPx: number;
  heightPx: number;
  dimensionsLabel?: string;
  previewImageUrl?: string | null;
  images?: ProductTemplateImageModel[];
  quantity?: number;
  userId: number;
  userName: string;
  userEmail: string;
  status: ProductSubmissionStatus | string;
  customizationValues: Record<string, any>;
  submittedFields: Array<{
    id: number | string;
    label: string;
    fieldType: string;
    value: any;
  }>;
  createdAt: string;
  updatedAt: string;
};
