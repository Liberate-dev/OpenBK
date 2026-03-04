export async function apiClient<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    const defaultHeaders: Record<string, string> = {
        "Accept": "application/json",
    };

    if (!isFormData) {
        defaultHeaders["Content-Type"] = "application/json";
    }

    // If it's a student route, use student token.
    // If it's an admin route, use admin token.
    let token = null;

    // We can import services conditionally or use a simple regex approach based on the URL.
    if (endpoint.startsWith("/admin/")) {
        const adminSessionStr = localStorage.getItem("openbk_admin_session");
        if (adminSessionStr) {
            try {
                const adminSession = JSON.parse(adminSessionStr);
                token = adminSession.token;
            } catch {
                token = null;
            }
        }
    } else {
        const studentSessionStr = localStorage.getItem("openbk_student_session");
        if (studentSessionStr) {
            try {
                const studentSession = JSON.parse(studentSessionStr);
                token = studentSession.token;
            } catch {
                token = null;
            }
        }
    }

    if (token) {
        defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    const baseUrl = import.meta.env.DEV ? "http://localhost:8000" : "";
    const response = await fetch(`${baseUrl}/api/v1${endpoint}`, config);

    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error(`Terjadi kesalahan server (${response.status}).`);
    }

    if (!response.ok) {
        // Handle Laravel validation errors specifically
        if (response.status === 422 && data.errors) {
            const firstError = Object.values(data.errors).flat()[0];
            throw new Error(firstError as string || "Data yang dikirim tidak valid.");
        }

        throw new Error(data.message || `Terjadi kesalahan pada server (${response.status}).`);
    }

    return data;
}
