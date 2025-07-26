export const submitDiscoveryForm = async (formData: {
    clientType: string
    name: string;
    email: string;
    phone: string;
    message: string;
    selectedServices: string[];
}) => {
    try {
        const response = await fetch('https://f57d73d76263.ngrok-free.app/send_email.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const text = await response.text();
        console.log('RAW RESPONSE:', text); // ✅ Tengok sama ada JSON atau HTML

        // Cuba parse sebagai JSON
        let json: any = null;
        try {
            json = JSON.parse(text);
        } catch (err) {
            // Kalau bukan JSON, stop dan tunjuk error kepada user
            throw new Error('Server replied with invalid JSON: ' + text);
        }

        // Semak status HTTP
        if (!response.ok) {
            throw new Error(json.message || 'Something went wrong');
        }

        return json;
    } catch (error: any) {
        console.error('API Error:', error);
        throw new Error(error.message || 'Unknown error');
    }
};
