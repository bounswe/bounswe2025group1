import axios from 'axios';
import { API_URL } from '../constants/Config';

export type ReportReason = 'abuse' | 'spam' | 'illegal' | 'other';

export type ContentType = 'forumpost' | 'comment';

export interface Report {
  id: number;
  reporter: number;
  content_type: string;
  object_id: number;
  reason: ReportReason;
  description: string;
  created_at: string;
  reviewed: boolean;
  is_valid: boolean | null;
}

export interface CreateReportPayload {
  content_type: ContentType;
  object_id: number;
  reason: ReportReason;
  description: string;
}

export interface ReviewReportPayload {
  is_valid: boolean;
}

/**
 * Creates a new report for a forum post or comment
 * @param payload - Report details including content type, object ID, reason, and description
 * @param token - Authentication token
 * @returns Promise with success message
 */
export const createReport = async (
  payload: CreateReportPayload,
  token: string
): Promise<{ detail: string }> => {
  const response = await axios.post(`${API_URL}/reports/`, payload, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

/**
 * Fetches all reports (admin/moderator only)
 * @param token - Authentication token
 * @returns Promise with array of reports
 */
export const fetchReports = async (token: string): Promise<Report[]> => {
  const response = await axios.get(`${API_URL}/admin/reports/`, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

/**
 * Reviews a report and optionally deletes the reported content
 * @param reportId - ID of the report to review
 * @param payload - Review decision (is_valid: true to delete content, false to dismiss)
 * @param token - Authentication token
 * @returns Promise with success message
 */
export const reviewReport = async (
  reportId: number,
  payload: ReviewReportPayload,
  token: string
): Promise<{ detail: string }> => {
  const response = await axios.post(
    `${API_URL}/admin/reports/${reportId}/review/`,
    payload,
    {
      headers: { Authorization: `Token ${token}` },
    }
  );
  return response.data;
};

/**
 * Fetches a specific report by ID (admin/moderator only)
 * @param reportId - ID of the report
 * @param token - Authentication token
 * @returns Promise with report details
 */
export const fetchReportById = async (
  reportId: number,
  token: string
): Promise<Report> => {
  const response = await axios.get(`${API_URL}/admin/reports/${reportId}/`, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};
