export interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  role: string;
  // password is not part of this type for security reasons
}

export enum ReportStatus {
  Draft = 'Rascunho',
  InReview = 'Em Revisão',
  Completed = 'Concluído',
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string; // ISO date string
}

export interface Attachment {
  id: string;
  name: string;
  size: number; // in bytes
  type: string; // MIME type
  url: string; // Data URL for the file content
  uploadedById: string;
  uploadedAt: string; // ISO date string
}

export interface Signature {
  memberId: string;
  signedAt: string; // ISO date string
}

export interface Tag {
  id: string;
  label: string;
  color: string;
}

/**
 * Defines the structured content of a report.
 * The `Report.content` field stores a JSON stringified version of this object.
 */
export interface ReportContent {
  assunto: string;
  processo: string; 
  interessado: string;
  ementa: string;
  relatorio: string;
  parecer: string;
}

/**
 * Represents a single version of the report's content in its history.
 */
export interface ContentHistory {
  content: string; // JSON string of ReportContent
  timestamp: string; // ISO date string
  editorId: string; // ID of the user who made the change
}

export interface Report {
  id: string;
  title: string;
  content: string; // Should be a JSON string of ReportContent
  authorId: string;
  team: TeamMember[];
  deadline: string; // YYYY-MM-DD
  status: ReportStatus;
  comments: Comment[];
  signatures: Signature[];
  acknowledgements: Signature[]; // To track who has "acatado"
  startedAt: string | null; // ISO date string
  tags?: Tag[];
  attachments: Attachment[];
  aiSummary: string | null;
  contentHistory: ContentHistory[];
}

export interface Notification {
  id: number;
  message: string;
  type: 'info' | 'success';
}
