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
    const userId = req.user.id;

    console.log("grabbing friend's list with userid: ", userId);

    const { data, error } = await supabase
      .from('friends')
      .select(
        `id, friend_id, status, users:friend_id (username, email)`
      )
      .eq('user_id', userId);

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
  },
};

module.exports = friendController;