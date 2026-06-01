export interface InviteListItem {
  id: string;
  email: string;
  fullName?: string;
  roles: string[];
  department?: string;
  position?: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  invitedBy?: string;
  expiresAt: string;
  createdAt: string;
}

export interface InviteListFilters {
  page: number;
  pageSize: number;
  status?: string;
  search?: string;
}

export interface CreateInvitePayload {
  email: string;
  roles: string[];
  departmentId?: string;
  departmentName?: string;
  fullName?: string;
  position?: string;
}

export interface BulkInviteItem {
  email: string;
  roles: string[];
  departmentId?: string;
  departmentName?: string;
  fullName?: string;
  position?: string;
}

export interface ValidateFileRowResult {
  row: number;
  email: string;
  fullName?: string;
  roles: string[];
  department?: string;
  position?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface ValidateFileResult {
  valid: ValidateFileRowResult[];
  invalid: ValidateFileRowResult[];
  total: number;
}

export interface PaginatedInvites {
  data: InviteListItem[];
  total: number;
  page: number;
  pageSize: number;
}
