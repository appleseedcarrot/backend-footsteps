const supabase = require('../config/supabase');

const friendController = {
  async sendFriendRequest(req, res) {
    const userId = req.user.id;
    const { friendEmail } = req.body;

    const { data: friendUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', friendEmail)
      .single();

    if (userError || !friendUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (friendUser.id === userId) {
      return res.status(400).json({ error: 'You cannot add yourself.' });
    }

    const { error } = await supabase.from('friends').insert([
      {
        user_id: userId,
        friend_id: friendUser.id,
        status: 'pending',
      },
    ]);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: 'Friend request sent' });
  },

  async acceptFriendRequest(req, res) {
    const userId = req.user.id;
    const { friendId } = req.body;

    const { error } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .match({ user_id: friendId, friend_id: userId });

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: 'Friend request accepted' });
  },

  async removeFriend(req, res) {
    const userId = req.user.id;
    const { friendId } = req.body;

    const { error } = await supabase
      .from('friends')
      .delete()
      .or(
        `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`
      );

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: 'Friend removed' });
  },

  async getFriendList(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
  
    const {
      data: { user },
      error: supaError,
    } = await supabase.auth.getUser(token);
  
    if (supaError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  
    const email = user.email;
  
    const { data: appUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
  
    if (userError || !appUser) {
      return res.status(404).json({ error: 'User not found in app database' });
    }
  
    const { data: friends, error: friendError } = await supabase
      .from('friends')
      .select(`
        id,
        status,
        user_id,
        friend_id,
        requester:user_id (username, email),
        recipient:friend_id (username, email)
      `)
      .or(`user_id.eq.${appUser.id},friend_id.eq.${appUser.id}`);

    console.log(friends);
  
    if (friendError) {
      return res.status(500).json({ error: 'Failed to fetch friends' });
    }
  
    res.status(200).json(friends);
  }
}

module.exports = friendController;