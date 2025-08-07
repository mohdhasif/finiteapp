const BASE_URL = 'https://fd9315becb7e.ngrok-free.app'; // Gantikan dengan URL sebenar

export const fetchClients = async () => {
    
    try {
        const response = await fetch(`${BASE_URL}/get_clients.php`);
        if (!response.ok) throw new Error('Gagal fetch clients');
        return await response.json();
    } catch (error) {
        console.error('Fetch clients error:', error);
        return [];
    }
};

export const fetchFreelancers = async () => {
    try {
        const response = await fetch(`${BASE_URL}/get_freelancers.php`);
        if (!response.ok) throw new Error('Gagal fetch freelancers');
        return await response.json();
    } catch (error) {
        console.error('Fetch freelancers error:', error);
        return [];
    }
};
