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
