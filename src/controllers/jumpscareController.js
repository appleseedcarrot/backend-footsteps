const { acceptsEncoding } = require('express/lib/request');
const supabase = require('../config/supabase');

const jumpscareController = {
  async sendJumpscare(req, res) {
    const userId = req.user.id;

    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required' });
    }

    const { error: insertError } = await supabase
      .from('jumpscares')
      .insert([{ sender_id: userId, recipient_id: recipientId, timestamp: new Date() }]);

    if (insertError) {
      console.error('Jumpscare error:', insertError);
      return res.status(500).json({ error: 'Failed to send jumpscare' });
    }

    res.status(200).json({ message: 'Jumpscare sent!' });
  },

  async getPendingJumpscares(req, res) {
    const userId = req.user.id;

    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
    
    try {
      const { data, error: fetchError } = await supabase
      .from('jumpscares')
      .select('*')
      .eq('recipient_id', userId)
      .gt('timestamp', tenSecondsAgo) // past 10 sec
      .order('timestamp', { ascending: true })
      .limit(1)

      console.log(data);
  
      if (fetchError) return res.status(500).json({ error: 'Failed to fetch' });
      res.json(data);
    }
    catch (err) {
      console.error('jumpscare retrieve failed', err);
      res.status(404).json({ error: 'Jumpscare getting failed' });
    }
  }
};

module.exports = jumpscareController;