# VirolaWeb 🦠

A lightweight, self-hostable web client for [Virola](https://virola.io/) servers.

## Features

✨ **Core Features:**
- 💬 Real-time messaging via WebSocket
- 👥 User presence and management
- 📁 Channel organization
- 📎 File upload support
- 🔄 Automatic reconnection
- 💾 Configuration persistence
- 🎨 Modern, responsive UI

🚀 **Technical Highlights:**
- Pure JavaScript (no frameworks required)
- Lightweight (~30KB total)
- Self-contained single-page application
- Easy Docker deployment
- No build process needed

## Quick Start

### Option 1: Direct Usage (Simplest)

1. Clone the repository:
```bash
git clone https://github.com/QuizzityMC/VirolaWeb.git
cd VirolaWeb
```

2. Serve the files with any HTTP server:
```bash
# Using Python 3
python -m http.server 8080

# Using Python 2
python -m SimpleHTTPServer 8080

# Using Node.js (if you have http-server installed)
npx http-server -p 8080
```

3. Open your browser to `http://localhost:8080`

### Option 2: Docker Deployment

1. Build and run with Docker Compose:
```bash
docker-compose up -d
```

2. Access at `http://localhost:8080`

Or build manually:
```bash
docker build -t virolaweb .
docker run -d -p 8080:80 virolaweb
```

### Option 3: Static File Hosting

Simply upload `index.html`, `styles.css`, and `app.js` to any static file hosting service:
- GitHub Pages
- Netlify
- Vercel
- AWS S3
- Any web server

## Usage

1. **Connect to Server:**
   - Enter your Virola server WebSocket URL (e.g., `wss://virola.io`)
   - Enter your username
   - (Optional) Enter password if required
   - Click "Connect"

2. **Join/Create Channels:**
   - Click the "+" button in the sidebar
   - Enter channel name
   - Choose to create new or join existing
   - Click "Confirm"

3. **Send Messages:**
   - Type in the message input at the bottom
   - Press Enter or click "Send"

4. **Upload Files:**
   - Click the 📎 attachment button
   - Select file(s) to upload
   - Files will be sent to the current channel

## Configuration

Edit `config.json` to customize default settings:

```json
{
  "serverUrl": "wss://your-server.com",
  "reconnect": {
    "enabled": true,
    "maxAttempts": 5,
    "delay": 3000
  },
  "features": {
    "fileUpload": true,
    "markdown": false,
    "emojis": true
  }
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

WebSocket support is required.

## Architecture

```
VirolaWeb/
├── index.html       # Main HTML structure
├── styles.css       # Styling and theme
├── app.js           # Client logic and WebSocket handling
├── config.json      # Configuration file
├── Dockerfile       # Docker container definition
├── docker-compose.yml  # Docker Compose configuration
└── nginx.conf       # Nginx server configuration
```

## Security Considerations

- Always use `wss://` (secure WebSocket) in production
- Credentials are stored locally in browser localStorage
- No server-side processing - all logic runs in browser
- Consider using HTTPS when self-hosting

## Development

The client is built with vanilla JavaScript and requires no build process. Simply edit the files and refresh your browser.

### Key Components:

**VirolaClient Class** (`app.js`):
- Handles WebSocket connection
- Manages authentication
- Processes incoming/outgoing messages
- Maintains channel and user state

**Message Protocol**:
The client supports the following message types:
- `auth` - Authentication request
- `message` - Text message
- `file` - File upload
- `join_channel` - Join/create channel
- `get_channels` - Request channel list
- `get_users` - Request user list

## Customization

### Changing Theme Colors

Edit CSS variables in `styles.css`:

```css
:root {
    --primary-color: #5865F2;
    --background-dark: #36393f;
    /* ... more variables */
}
```

### Adding Custom Features

Extend the `VirolaClient` class in `app.js`:

```javascript
class VirolaClient {
    // Add your custom methods here
}
```

## Troubleshooting

**Connection Issues:**
- Verify the server URL format (must start with `ws://` or `wss://`)
- Check if the Virola server is running and accessible
- Look at browser console for error messages

**Messages Not Appearing:**
- Ensure you've joined a channel
- Check WebSocket connection status
- Verify message format matches server expectations

**File Upload Problems:**
- Check file size limits
- Ensure file upload is enabled on server
- Verify browser supports FileReader API

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - feel free to use, modify, and distribute.

## Acknowledgments

Built for the Virola communication platform: https://virola.io/

---

Made with ❤️ for the Virola community