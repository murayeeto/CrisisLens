"""
HTML test page served by FastAPI.
This provides a simple UI to test the backend without needing the full frontend.
"""

HTML_CONTENT = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CrisisLens Backend Test</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section h2 {
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        
        .controls {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin-bottom: 20px;
        }
        
        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1em;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        button:hover {
            background: #764ba2;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        button:active {
            transform: translateY(0);
        }
        
        .output {
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            max-height: 400px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-word;
        }
        
        .loading {
            color: #667eea;
            font-weight: 600;
        }
        
        .error {
            color: #e74c3c;
            background: #fadbd8;
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
        }
        
        .success {
            color: #27ae60;
            background: #d5f4e6;
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
        }
        
        .event-card {
            background: #f9f9f9;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .event-card:hover {
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            border-color: #667eea;
        }
        
        .event-card h3 {
            color: #333;
            margin-bottom: 8px;
        }
        
        .event-card p {
            color: #666;
            font-size: 0.9em;
            line-height: 1.5;
        }
        
        .event-meta {
            display: flex;
            gap: 15px;
            margin-top: 10px;
            font-size: 0.85em;
            color: #999;
        }
        
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 5px;
        }
        
        .status-ok {
            background: #27ae60;
        }
        
        .status-error {
            background: #e74c3c;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 CrisisLens Backend</h1>
            <p>Test Dashboard for Crisis Intelligence API</p>
        </div>
        
        <div class="content">
            <!-- Status -->
            <div class="section">
                <h2>Backend Status</h2>
                <div class="controls">
                    <button onclick="checkHealth()">Check Health</button>
                    <button onclick="checkAuth()">Check Auth</button>
                </div>
                <div id="statusOutput" class="output"></div>
            </div>
            
            <!-- News & Events -->
            <div class="section">
                <h2>News & Events</h2>
                <div class="controls">
                    <button onclick="getTrendingNews()">Fetch Trending News</button>
                    <button onclick="generateEvents()">Generate Events</button>
                    <button onclick="listEvents()">List All Events</button>
                </div>
                <div id="newsOutput" class="output"></div>
            </div>
            
            <!-- Events List -->
            <div class="section">
                <h2>Events</h2>
                <div id="eventsList"></div>
            </div>
            
            <!-- User -->
            <div class="section">
                <h2>Saved Events</h2>
                <div class="controls">
                    <button onclick="getSavedEvents()">Load Saved Events</button>
                </div>
                <div id="savedOutput" class="output"></div>
            </div>
        </div>
    </div>

    <script>
        const API_BASE = "http://localhost:8000";
        
        function log(element, text, isJson = false) {
            const el = document.getElementById(element);
            if (isJson) {
                el.textContent = JSON.stringify(text, null, 2);
            } else {
                el.textContent = text;
            }
        }
        
        function appendLog(element, text) {
            const el = document.getElementById(element);
            el.textContent += "\n" + text;
        }
        
        async function checkHealth() {
            log('statusOutput', 'Checking backend health...');
            try {
                const res = await fetch(`${API_BASE}/health`);
                const data = await res.json();
                log('statusOutput', data, true);
            } catch (e) {
                log('statusOutput', `Error: ${e.message}`, false);
            }
        }
        
        async function checkAuth() {
            log('statusOutput', 'Checking authentication...');
            try {
                const res = await fetch(`${API_BASE}/api/auth/me`);
                const data = await res.json();
                log('statusOutput', data, true);
            } catch (e) {
                log('statusOutput', `Error: ${e.message}`, false);
            }
        }
        
        async function getTrendingNews() {
            log('newsOutput', 'Fetching trending news...');
            try {
                const res = await fetch(`${API_BASE}/api/news/trending`);
                const articles = await res.json();
                
                let output = `Found ${articles.length} articles:\n\n`;
                articles.forEach((art, i) => {
                    output += `${i+1}. ${art.title}\n`;
                    output += `   Source: ${art.source_name}\n`;
                    output += `   ${art.description.substring(0, 80)}...\n\n`;
                });
                
                log('newsOutput', output);
            } catch (e) {
                log('newsOutput', `Error: ${e.message}`);
            }
        }
        
        async function generateEvents() {
            log('newsOutput', 'Generating events from trending news...');
            try {
                const res = await fetch(`${API_BASE}/api/events/generate?limit=3`, { method: 'POST' });
                const events = await res.json();
                
                log('newsOutput', events, true);
                displayEvents(events);
            } catch (e) {
                log('newsOutput', `Error: ${e.message}`);
            }
        }
        
        async function listEvents() {
            log('newsOutput', 'Loading events...');
            try {
                const res = await fetch(`${API_BASE}/api/events`);
                const events = await res.json();
                
                log('newsOutput', `Found ${events.length} events`);
                displayEvents(events);
            } catch (e) {
                log('newsOutput', `Error: ${e.message}`);
            }
        }
        
        function displayEvents(events) {
            const container = document.getElementById('eventsList');
            container.innerHTML = '';
            
            if (events.length === 0) {
                container.innerHTML = '<p style="color: #999;">No events yet. Generate some!</p>';
                return;
            }
            
            events.forEach(event => {
                const card = document.createElement('div');
                card.className = 'event-card';
                card.onclick = () => viewEvent(event.id);
                
                const category = event.ai_analysis ? event.ai_analysis.category : 'unknown';
                const summary = event.ai_analysis ? event.ai_analysis.summary : event.description;
                
                card.innerHTML = `
                    <h3>${event.title}</h3>
                    <p>${summary.substring(0, 100)}...</p>
                    <div class="event-meta">
                        <span>📍 ${event.location.name}</span>
                        <span>🏷️ ${category}</span>
                        <span>📰 ${event.source_articles.length} articles</span>
                    </div>
                `;
                
                container.appendChild(card);
            });
        }
        
        async function viewEvent(eventId) {
            try {
                const res = await fetch(`${API_BASE}/api/events/${eventId}`);
                const event = await res.json();
                
                log('newsOutput', event, true);
            } catch (e) {
                alert(`Error: ${e.message}`);
            }
        }
        
        async function getSavedEvents() {
            log('savedOutput', 'Loading saved events...');
            try {
                const res = await fetch(`${API_BASE}/api/users/saved-events`);
                const events = await res.json();
                
                log('savedOutput', `Found ${events.length} saved events:\n\n`);
                events.forEach((event, i) => {
                    appendLog('savedOutput', `${i+1}. ${event.title} (${event.id})`);
                });
            } catch (e) {
                log('savedOutput', `Error: ${e.message}`);
            }
        }
    </script>
</body>
</html>
"""

def get_test_page_html():
    return HTML_CONTENT
