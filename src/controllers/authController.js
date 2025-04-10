const supabase = require('../config/supabase');

const authController = {
  async signup(req, res) {
    try {
      const { email, password, username, firstname, lastname } = req.body;

      if (!email || !password || !username) {
        return res.status(400).json({
          error: 'Email, password, and username are required',
        });
      }

      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return res.status(400).json({ error: authError.message });
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          {
            username,
            email,
            firstname: firstname || null,
            lastname: lastname || null,
          },
        ])
        .select()
        .single();

      if (userError) {
        return res.status(400).json({ error: userError.message });
      }

      res.status(201).json({
        message: 'User created successfully',
        user: userData,
      });
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
        });
      }
      console.log('Got email and passwordHash', email, password);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password,
      });

      if (error) {
        return res.status(401).json({
          error: 'Invalid credentials',
        });
      }
      res.cookie('session', data.session.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 3600 * 1000,
        path: '/',
      });

      res.status(200).json({
        message: 'Login successful',
        token: data.session.access_token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  },

  async getMe(req, res) {
    try {
      const token =
        req.cookies.session || req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser(token);

      if (userError || !user) {
        return res.status(401).json({ error: 'Authentication failed' });
      }

      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('id, username, email, firstname, lastname')
        .eq('email', user.email)
        .single();

      if (userData && !dbError) {
        return res.json(userData);
      }
      return res.json({
        id: user.id,
        email: user.email,
        username: user.email.split('@')[0],
      });
    } catch (error) {
      console.error('ME endpoint error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  },

  async logout(req, res) {
    res.clearCookie('session');
    await supabase.auth.signOut();
    res.json({ message: 'Logged out successfully' });
  },

  async verifyEmail(req, res) {
    try {
      const { token_hash, type } = req.query;

      if (!token_hash || type !== 'signup') {
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/callback?error=invalid_verification`
        );
      }

      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'signup',
      });

      if (error) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/callback?error=${encodeURIComponent(
            error.message
          )}`
        );
      }

      const queryParams = new URLSearchParams({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        type: 'signup',
      });

      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?${queryParams.toString()}`
      );
    } catch (error) {
      console.error('Email verification error:', error);
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?error=server_error`
      );
    }
  },

  async ping(req, res) {
    const userId = req.user.id;

    const { error } = await supabase
      .from('users')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', userId);
  
    if (error) {
      console.error('Ping error:', error);
      return res.status(500).json({ error: 'Failed to update activity' });
    }
  
    res.status(200).json({ message: 'Pong' });
  },
};

module.exports = authController;
