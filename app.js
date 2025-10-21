// VirolaWeb - Lightweight Virola Client
class VirolaClient {
    constructor() {
        this.ws = null;
        this.config = {
            serverUrl: '',
            username: '',
            password: ''
        };
        this.currentChannel = null;
        this.channels = new Map();
        this.users = new Map();
        this.messages = new Map(); // channelId -> messages array
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        
        this.initializeUI();
        this.loadSavedConfig();
    }

    initializeUI() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Message form
        document.getElementById('messageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // File attachment
        document.getElementById('attachFileBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        // Channel management
        document.getElementById('addChannelBtn').addEventListener('click', () => {
            this.showChannelModal();
        });

        document.getElementById('confirmChannelBtn').addEventListener('click', () => {
            this.handleChannelAction();
        });

        document.getElementById('cancelChannelBtn').addEventListener('click', () => {
            this.hideChannelModal();
        });

        document.querySelector('.modal-close').addEventListener('click', () => {
            this.hideChannelModal();
        });

        // Disconnect
        document.getElementById('disconnectBtn').addEventListener('click', () => {
            this.disconnect();
        });

        // Channel info
        document.getElementById('channelInfoBtn').addEventListener('click', () => {
            this.showChannelInfo();
        });
    }

    loadSavedConfig() {
        try {
            const saved = localStorage.getItem('virolaConfig');
            if (saved) {
                const config = JSON.parse(saved);
                document.getElementById('serverUrl').value = config.serverUrl || '';
                document.getElementById('username').value = config.username || '';
            }
        } catch (e) {
            console.error('Failed to load saved config:', e);
        }
    }

    saveConfig() {
        try {
            localStorage.setItem('virolaConfig', JSON.stringify({
                serverUrl: this.config.serverUrl,
                username: this.config.username
            }));
        } catch (e) {
            console.error('Failed to save config:', e);
        }
    }

    handleLogin() {
        const serverUrl = document.getElementById('serverUrl').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!serverUrl || !username) {
            this.showStatus('Please fill in required fields', 'error');
            return;
        }

        this.config = { serverUrl, username, password };
        this.saveConfig();
        this.connect();
    }

    connect() {
        this.showStatus('Connecting...', 'info');

        try {
            // Ensure WebSocket URL format
            let wsUrl = this.config.serverUrl;
            if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
                wsUrl = 'wss://' + wsUrl.replace(/^https?:\/\//, '');
            }

            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => this.handleOpen();
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onerror = (error) => this.handleError(error);
            this.ws.onclose = (event) => this.handleClose(event);

        } catch (error) {
            this.showStatus('Connection failed: ' + error.message, 'error');
            console.error('Connection error:', error);
        }
    }

    handleOpen() {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
        this.showStatus('Connected! Authenticating...', 'success');

        // Send authentication
        this.sendToServer({
            type: 'auth',
            username: this.config.username,
            password: this.config.password
        });
    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('Received:', data);

            switch (data.type) {
                case 'auth_success':
                    this.handleAuthSuccess();
                    break;
                case 'auth_failed':
                    this.handleAuthFailed(data.message);
                    break;
                case 'channel_list':
                    this.handleChannelList(data.channels);
                    break;
                case 'channel_joined':
                    this.handleChannelJoined(data.channel);
                    break;
                case 'user_list':
                    this.handleUserList(data.users);
                    break;
                case 'message':
                    this.handleIncomingMessage(data);
                    break;
                case 'user_joined':
                    this.handleUserJoined(data);
                    break;
                case 'user_left':
                    this.handleUserLeft(data);
                    break;
                case 'error':
                    this.showSystemMessage(data.message, 'error');
                    break;
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    }

    handleError(error) {
        console.error('WebSocket error:', error);
        this.showStatus('Connection error occurred', 'error');
    }

    handleClose(event) {
        console.log('WebSocket connection closed:', event.code, event.reason);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.showStatus(`Connection lost. Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`, 'info');
            setTimeout(() => this.connect(), this.reconnectDelay);
        } else {
            this.showStatus('Connection lost. Please reconnect manually.', 'error');
            this.disconnect();
        }
    }

    sendToServer(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.error('WebSocket is not connected');
        }
    }

    handleAuthSuccess() {
        this.showStatus('Authentication successful!', 'success');
        setTimeout(() => {
            this.switchToChat();
        }, 500);

        // Request channel list
        this.sendToServer({ type: 'get_channels' });
    }

    handleAuthFailed(message) {
        this.showStatus('Authentication failed: ' + (message || 'Invalid credentials'), 'error');
    }

    switchToChat() {
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('chatScreen').classList.add('active');
        document.getElementById('currentUser').textContent = this.config.username;
        
        // Enable message input
        document.getElementById('messageInput').disabled = false;
        document.getElementById('attachFileBtn').disabled = false;
        document.querySelector('.btn-send').disabled = false;
    }

    handleChannelList(channels) {
        const channelList = document.getElementById('channelList');
        channelList.innerHTML = '';

        channels.forEach(channel => {
            this.channels.set(channel.id, channel);
            this.addChannelToUI(channel);
        });

        // Auto-join first channel if available
        if (channels.length > 0 && !this.currentChannel) {
            this.joinChannel(channels[0].id);
        }
    }

    addChannelToUI(channel) {
        const channelList = document.getElementById('channelList');
        const channelItem = document.createElement('div');
        channelItem.className = 'channel-item';
        channelItem.textContent = channel.name;
        channelItem.dataset.channelId = channel.id;
        channelItem.addEventListener('click', () => this.joinChannel(channel.id));
        channelList.appendChild(channelItem);
    }

    joinChannel(channelId) {
        if (this.currentChannel === channelId) return;

        this.currentChannel = channelId;
        const channel = this.channels.get(channelId);
        
        if (!channel) return;

        // Update UI
        document.getElementById('currentChannel').textContent = '# ' + channel.name;
        
        // Update active channel
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.channelId === channelId) {
                item.classList.add('active');
            }
        });

        // Load messages for this channel
        this.loadChannelMessages(channelId);

        // Request user list
        this.sendToServer({
            type: 'get_users',
            channelId: channelId
        });

        // Notify server we joined the channel
        this.sendToServer({
            type: 'join_channel',
            channelId: channelId
        });
    }

    handleChannelJoined(channel) {
        this.channels.set(channel.id, channel);
        this.addChannelToUI(channel);
        this.joinChannel(channel.id);
    }

    loadChannelMessages(channelId) {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';

        const messages = this.messages.get(channelId) || [];
        messages.forEach(msg => this.displayMessage(msg));

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    handleIncomingMessage(data) {
        const channelId = data.channelId || this.currentChannel;
        
        // Store message
        if (!this.messages.has(channelId)) {
            this.messages.set(channelId, []);
        }
        this.messages.get(channelId).push(data);

        // Display if current channel
        if (channelId === this.currentChannel) {
            this.displayMessage(data);
        }
    }

    displayMessage(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';

        const timestamp = new Date(message.timestamp || Date.now()).toLocaleTimeString();

        let content = `
            <div class="message-header">
                <span class="message-author">${this.escapeHtml(message.author || message.username || 'Unknown')}</span>
                <span class="message-timestamp">${timestamp}</span>
            </div>
            <div class="message-content">${this.escapeHtml(message.content || message.text || '')}</div>
        `;

        if (message.file) {
            content += `
                <div class="message-file">
                    📎 <a href="${message.file.url}" target="_blank">${this.escapeHtml(message.file.name)}</a>
                </div>
            `;
        }

        messageDiv.innerHTML = content;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showSystemMessage(text, type = 'info') {
        const messagesContainer = document.getElementById('messagesContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'system-message';
        messageDiv.textContent = text;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();

        if (!content || !this.currentChannel) return;

        const message = {
            type: 'message',
            channelId: this.currentChannel,
            content: content,
            timestamp: Date.now()
        };

        this.sendToServer(message);
        input.value = '';
    }

    handleFileUpload(files) {
        if (!files || files.length === 0 || !this.currentChannel) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const message = {
                    type: 'file',
                    channelId: this.currentChannel,
                    file: {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        data: e.target.result
                    },
                    timestamp: Date.now()
                };
                this.sendToServer(message);
            };
            reader.readAsDataURL(file);
        });

        document.getElementById('fileInput').value = '';
    }

    handleUserList(users) {
        this.users.clear();
        const userList = document.getElementById('userList');
        userList.innerHTML = '';

        users.forEach(user => {
            this.users.set(user.id || user.username, user);
            this.addUserToUI(user);
        });
    }

    addUserToUI(user) {
        const userList = document.getElementById('userList');
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <span class="user-status ${user.status || 'online'}"></span>
            <span>${this.escapeHtml(user.username || user.name)}</span>
        `;
        userList.appendChild(userItem);
    }

    handleUserJoined(data) {
        const user = data.user || { username: data.username };
        this.users.set(user.id || user.username, user);
        this.addUserToUI(user);
        this.showSystemMessage(`${user.username} joined the channel`);
    }

    handleUserLeft(data) {
        const userId = data.userId || data.username;
        this.users.delete(userId);
        // Refresh user list
        if (data.users) {
            this.handleUserList(data.users);
        }
        this.showSystemMessage(`${data.username} left the channel`);
    }

    showChannelModal() {
        document.getElementById('channelModal').classList.add('active');
        document.getElementById('channelName').value = '';
        document.getElementById('createChannel').checked = true;
    }

    hideChannelModal() {
        document.getElementById('channelModal').classList.remove('active');
    }

    handleChannelAction() {
        const channelName = document.getElementById('channelName').value.trim();
        const create = document.getElementById('createChannel').checked;

        if (!channelName) return;

        this.sendToServer({
            type: create ? 'create_channel' : 'join_channel',
            name: channelName
        });

        this.hideChannelModal();
    }

    showChannelInfo() {
        if (!this.currentChannel) return;
        
        const channel = this.channels.get(this.currentChannel);
        if (channel) {
            alert(`Channel: ${channel.name}\nID: ${channel.id}\nUsers: ${this.users.size}`);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        // Reset state
        this.currentChannel = null;
        this.channels.clear();
        this.users.clear();
        this.messages.clear();

        // Switch back to login
        document.getElementById('chatScreen').classList.remove('active');
        document.getElementById('loginScreen').classList.add('active');
        
        // Disable inputs
        document.getElementById('messageInput').disabled = true;
        document.getElementById('attachFileBtn').disabled = true;
        document.querySelector('.btn-send').disabled = true;
    }

    showStatus(message, type) {
        const statusDiv = document.getElementById('connectionStatus');
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;
        
        if (type === 'success') {
            setTimeout(() => {
                statusDiv.textContent = '';
                statusDiv.className = 'status-message';
            }, 3000);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the client when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.virolaClient = new VirolaClient();
});
