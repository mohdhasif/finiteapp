// src/api/authApi.ts

export const login = async (email: string, password: string) => {
    try {
        const response = await fetch('https://f57d73d76263.ngrok-free.app/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Login failed');
        return data;
    } catch (error: any) {
        throw new Error(error.message || 'Network error');
    }
};
