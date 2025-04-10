const { acceptsEncoding } = require('express/lib/request');
const supabase = require('../config/supabase');

const jumpscareController = {
  async sendJumpscare(req, res) {
    const userId = req.user.id;

    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required' });
    }

    const { data, error: insertError } = await supabase
      .from('jumpscares')
      .insert([{ sender_id: userId, recipient_id: recipientId, timestamp: new Date() }])
      .select()
      .single();

    if (insertError) {
      console.error('Jumpscare error:', insertError);
      return res.status(500).json({ error: 'Failed to send jumpscare' });
    }

    res.status(200).json(data);
  },
}

module.exports = jumpscareController;