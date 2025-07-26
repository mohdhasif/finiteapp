const BASE_URL = 'https://your-backend-url.com/api'; // ganti dengan URL sebenar

export const getClients = async () => {
    try {
        const response = await fetch(`${BASE_URL}/clients`);
        if (!response.ok) throw new Error('Gagal dapatkan data client');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

export const createClient = async (payload: any) => {
    try {
        const response = await fetch(`${BASE_URL}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
