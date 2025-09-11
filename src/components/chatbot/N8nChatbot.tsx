import { useEffect } from 'react';

interface N8nChatbotProps {
    webhookUrl?: string;
}

const N8nChatbot: React.FC<N8nChatbotProps> = ({
    webhookUrl = 'https://n8n.icpladda.com/webhook/f3fe133a-dc33-42df-8135-11962a4a2f31/chat'
}) => {
    useEffect(() => {
        // Load CSS
        const link = document.createElement('link');
        link.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Load and initialize chat
        const loadChat = async () => {
            try {
                const { createChat } = await import('https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js');
                createChat({
                    webhookUrl: webhookUrl
                });
            } catch (error) {
                console.error('Failed to load n8n chat:', error);
            }
        };

        loadChat();

        // Cleanup function
        return () => {
            // Remove the CSS link when component unmounts
            const existingLink = document.querySelector(`link[href="${link.href}"]`);
            if (existingLink) {
                document.head.removeChild(existingLink);
            }
        };
    }, [webhookUrl]);

    return null; // The chat widget is injected by the n8n script
};

export default N8nChatbot;