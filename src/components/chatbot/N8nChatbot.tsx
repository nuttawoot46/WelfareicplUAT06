import { useEffect, useRef } from 'react';

interface N8nChatbotProps {
    webhookUrl?: string;
}

const N8nChatbot: React.FC<N8nChatbotProps> = ({
    webhookUrl = 'https://n8n.icpladda.com/webhook/f3fe133a-dc33-42df-8135-11962a4a2f31/chat'
}) => {
    const chatInitialized = useRef(false);

    useEffect(() => {
        // Prevent multiple initializations
        if (chatInitialized.current) return;

        // Load CSS
        const link = document.createElement('link');
        link.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css';
        link.rel = 'stylesheet';
        
        // Check if CSS is already loaded
        const existingLink = document.querySelector(`link[href="${link.href}"]`);
        if (!existingLink) {
            document.head.appendChild(link);
        }

        // Add custom CSS variables
        const customStyle = document.createElement('style');
        customStyle.id = 'n8n-chat-custom-styles';
        customStyle.textContent = `
            :root {
                --chat--color-primary: #e74266;
                --chat--color-primary-shade-50: #db4061;
                --chat--color-primary-shade-100: #cf3c5c;
                --chat--color-secondary: #20b69e;
                --chat--color-secondary-shade-50: #1ca08a;
                --chat--color-white: #ffffff;
                --chat--color-light: #f2f4f8;
                --chat--color-light-shade-50: #e6e9f1;
                --chat--color-light-shade-100: #c2c5cc;
                --chat--color-medium: #d2d4d9;
                --chat--color-dark: #101330;
                --chat--color-disabled: #777980;
                --chat--color-typing: #404040;
                --chat--spacing: 1rem;
                --chat--border-radius: 0.25rem;
                --chat--transition-duration: 0.15s;
                --chat--window--width: 400px;
                --chat--window--height: 600px;
                --chat--header-height: auto;
                --chat--header--padding: var(--chat--spacing);
                --chat--header--background: var(--chat--color-dark);
                --chat--header--color: var(--chat--color-light);
                --chat--header--border-top: none;
                --chat--header--border-bottom: none;
                --chat--heading--font-size: 2em;
                --chat--subtitle--font-size: inherit;
                --chat--subtitle--line-height: 1.8;
                --chat--textarea--height: 50px;
                --chat--message--font-size: 1rem;
                --chat--message--padding: var(--chat--spacing);
                --chat--message--border-radius: var(--chat--border-radius);
                --chat--message-line-height: 1.8;
                --chat--message--bot--background: var(--chat--color-white);
                --chat--message--bot--color: var(--chat--color-dark);
                --chat--message--bot--border: none;
                --chat--message--user--background: var(--chat--color-secondary);
                --chat--message--user--color: var(--chat--color-white);
                --chat--message--user--border: none;
                --chat--message--pre--background: rgba(0, 0, 0, 0.05);
                --chat--toggle--background: var(--chat--color-primary);
                --chat--toggle--hover--background: var(--chat--color-primary-shade-50);
                --chat--toggle--active--background: var(--chat--color-primary-shade-100);
                --chat--toggle--color: var(--chat--color-white);
                --chat--toggle--size: 64px;
            }
        `;
        
        // Check if custom styles are already added
        const existingCustomStyle = document.getElementById('n8n-chat-custom-styles');
        if (!existingCustomStyle) {
            document.head.appendChild(customStyle);
        }

        // Load and initialize chat
        const loadChat = async () => {
            try {
                // @ts-ignore - Dynamic import from CDN
                const { createChat } = await import('https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js');
                createChat({
                    webhookUrl: webhookUrl,
                    webhookConfig: {
                        method: 'POST',
                        headers: {}
                    },
                    target: '#n8n-chat',
                    mode: 'window',
                    chatInputKey: 'chatInput',
                    chatSessionKey: 'sessionId',
                    loadPreviousSession: true,
                    metadata: {},
                    showWelcomeScreen: false,
                    defaultLanguage: 'en',
                    initialMessages: [
                        'สวัสดี',
                        'ฉันชื่อ จินนี่ สามารถสอบถามข้อมูลสวัสดิการได้ 24 ชม.'
                    ],
                    i18n: {
                        en: {
                            title: 'สวัสดีชาว ICPLadda',
                            subtitle: "คุณสามารถคุยกับฉันได้ 24 ชม.",
                            footer: '',
                            getStarted: 'New Conversation',
                            inputPlaceholder: 'Type your question..',
                        },
                    },
                    enableStreaming: false,
                });
                chatInitialized.current = true;
            } catch (error) {
                console.error('Failed to load n8n chat:', error);
            }
        };

        // Add a small delay to ensure DOM is ready
        const timer = setTimeout(loadChat, 100);

        // Cleanup function
        return () => {
            clearTimeout(timer);
        };
    }, [webhookUrl]);

    return <div id="n8n-chat"></div>; // Provide target element for the chat widget
};

export default N8nChatbot;