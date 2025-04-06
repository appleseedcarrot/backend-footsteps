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
    const tenSecondsAgo = new Date(Date.now() - 2000).toISOString(); // last 2s window
  
    try {
      const { data: pendingScare, error } = await supabase
        .from('jumpscares')
        .select('*')
        .eq('recipient_id', userId)
        .eq('result', 'pending') // only fetch if not already marked
        .gt('timestamp', tenSecondsAgo)
        .order('timestamp', { ascending: true })
        .limit(1)
      
      console.log(pendingScare);
      if (error) return res.status(500).json({ error: 'Failed to fetch jumpscare' });
      if (pendingScare.length <= 0) console.log('return'); 
      // return res.status(200).json(null);

      await supabase
        .from('jumpscares')
        .update({ result: 'received' })
        .eq('id', pendingScare.id);
  
      res.json(pendingScare);
    } catch (err) {
      console.error('jumpscare retrieve failed', err);
      res.status(500).json({ error: 'Jumpscare retrieval failed' });
    }
  }
};

module.exports = jumpscareController;