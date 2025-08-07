import AsyncStorage from '@react-native-async-storage/async-storage';

export const getFreelancers = async () => {
    const token = await AsyncStorage.getItem('userToken');

    const response = await fetch('https://fd9315becb7e.ngrok-free.app/get_freelancers.php', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch freelancers');
    }

    const data = await response.json();
    return data;
};

export const updateFreelancer = async ({
    freelancer_id,
    name,
    email,
    skillset,
    avatar,
    availability,
    status,
}: {
    freelancer_id: number;
    name: string;
    email: string;
    skillset: string;
    avatar: string | null;
    availability: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'inactive';
}) => {
    try {
        const response = await fetch('https://fd9315becb7e.ngrok-free.app/update_freelancer.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                freelancer_id,
                name,
                email,
                skillset,
                avatar_url: avatar,
                availability: availability ? 1 : 0,
                status, // ✅ new field
            }),
        });

        const data = await response.json();
        return data; // { success: true/false, error: "" }
    } catch (error) {
        console.log('Error:', error);
        return { success: false, error: 'Server error' };
    }
};

export const approveFreelancer = async (freelancer_id: number) => {
    try {
        const response = await fetch('https://fd9315becb7e.ngrok-free.app/approve_freelancer.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ freelancer_id }),
        });

        const data = await response.json();
        return data; // { success: true/false, error: "" }
    } catch (error) {
        console.log('Error:', error);
        return { success: false, error: 'Server error' };
    }
};
