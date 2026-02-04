// Wait, I just removed node-fetch. Using native fetch here too.
export const spotifyAuthRoutes = async (app) => {
    const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/auth/spotify/callback';
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
    /**
     * GET /auth/spotify/login
     * Redirect user to Spotify Authorization page.
     */
    app.get('/login', async (req, reply) => {
        const scope = 'user-read-private user-read-email playlist-read-private';
        const state = 'random_state_string'; // Should be generated and verified
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: CLIENT_ID,
            scope: scope,
            redirect_uri: REDIRECT_URI,
            state: state
        });
        return reply.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
    });
    /**
     * GET /auth/spotify/callback
     * Handle the callback from Spotify and exchange code for tokens.
     */
    app.get('/callback', async (req, reply) => {
        const { code, state } = req.query;
        if (!code) {
            return reply.status(400).send({ message: 'Missing authorization code' });
        }
        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: REDIRECT_URI
                })
            });
            const data = await response.json();
            if (data.error) {
                return reply.status(500).send(data);
            }
            // In a real app, we'd store these tokens in the user's sessions or DB
            // For now, redirecting back to the FE with the token in query (NOT SECURE, just for dev/test)
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
            return reply.redirect(`${frontendUrl}/import?spotify_token=${data.access_token}&refresh_token=${data.refresh_token}`);
        }
        catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    });
    /**
     * POST /auth/spotify/refresh
     * Refresh the access token using the refresh token.
     */
    app.post('/refresh', async (req, reply) => {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            return reply.status(400).send({ message: 'Missing refresh token' });
        }
        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refresh_token
                })
            });
            const data = await response.json();
            return data;
        }
        catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    });
};
