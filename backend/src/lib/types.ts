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
  | "banner_templates:manage";

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

export type BannerOrientation = "landscape" | "portrait" | "square";

export type BannerTemplateImageModel = {
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

export type BannerImageModel = BannerTemplateImageModel;

export type BannerTemplateModel = {
  id: number;
  name: string;
  description: string | null;
  widthPx: number;
  heightPx: number;
  dimensionsLabel: string | null;
  orientation: BannerOrientation;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fields?: BannerTemplateFieldModel[];
  images?: BannerTemplateImageModel[];
};

export type BannerTemplateFieldModel = {
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

export type BannerCustomizationModel = {
  id: number;
  templateId: number;
  userId: number;
  quantity?: number;
  customizationValues: Record<string, any>;
  status?: string;
  createdAt: string;
  updatedAt: string;
};

export type BannerSubmissionStatus =
  | "Pending"
  | "In Review"
  | "Changes Requested"
  | "Approved"
  | "Rejected"
  | "Completed";

export type BannerSubmissionFileModel = {
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
  history?: BannerSubmissionFileModel[];
};

export type BannerSubmissionMessageModel = {
  id: number;
  submissionId: number;
  imageId?: number | null;
  senderUserId: number;
  senderRole: string;
  senderName?: string | null;
  message: string;
  createdAt: string;
};

export type BannerSubmissionThreadModel = {
  submission: BannerSubmissionDetailModel;
  files: BannerSubmissionFileModel[];
  messages: BannerSubmissionMessageModel[];
};

export type BannerSubmissionDetailModel = {
  id: number;
  templateId: number;
  templateName: string;
  widthPx: number;
  heightPx: number;
  dimensionsLabel?: string;
  previewImageUrl?: string | null;
  images?: BannerTemplateImageModel[];
  quantity?: number;
  userId: number;
  userName: string;
  userEmail: string;
  status: BannerSubmissionStatus | string;
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

