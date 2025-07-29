// src/services/joinService.ts

export interface JoinFormPayload {
    name: string;
    email: string;
    phone: string;
    portfolio?: string;
    roles: string[];
}

export const submitJoinForm = async (payload: JoinFormPayload) => {
    const response = await fetch('https://fd9315becb7e.ngrok-free.app/freelancers.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Submission failed');
    }

    return await response.json();
};
