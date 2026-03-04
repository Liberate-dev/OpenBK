import { apiClient } from "~lib/apiClient";

export interface StudentHistoryEntry {
    [key: string]: unknown;
}

export async function getStudentHistory(): Promise<StudentHistoryEntry[]> {
    return apiClient<StudentHistoryEntry[]>("/messages/history", {
        method: "GET",
    });
}
