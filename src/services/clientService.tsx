import AsyncStorage from '@react-native-async-storage/async-storage';

export const getClients = async () => {
    const token = await AsyncStorage.getItem('userToken');

    const response = await fetch('https://fd9315becb7e.ngrok-free.app/get_clients.php', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch clients');
    }

    const data = await response.json();
    return data;
};

// services/clientService.tsx

export const updateClient = async ({
    client_id,
    company_name,
    phone,
    status,
    client_type,
    logo_url,
}: {
    client_id: number;
    company_name: string;
    phone: string;
    status: string;
    client_type: string;
    logo_url: string | null;
}) => {
    try {
        const response = await fetch('https://fd9315becb7e.ngrok-free.app/update_client.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id,
                company_name,
                phone,
                status,
                client_type,
                logo_url,
            }),
        });

        const data = await response.json();
        return data; // data.success / data.error
    } catch (error) {
        console.log('Error:', error);
        return { success: false, error: 'Server error' };
    }
};

export const approveClient = async (client_id: number) => {
    try {
        const response = await fetch('https://fd9315becb7e.ngrok-free.app/approve_client.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.log('Error:', error);
        return { success: false, error: 'Server error' };
    }
};
