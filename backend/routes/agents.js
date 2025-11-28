const express = require('express');
const Agent = require('../models/Agent');
const authMiddleware = require('../middleware/auth');
const router = express.Router();


router.use(authMiddleware);


router.post('/', async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Validate required fields
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    const existingAgent = await Agent.findOne({ email });
    if (existingAgent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Agent with this email already exists' 
      });
    }

    const agent = new Agent({ name, email, mobile, password });
    await agent.save();


    const agentData = agent.toObject();
    delete agentData.password;

    res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      agent: agentData
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});


router.get('/', async (req, res) => {
  try {
    const agents = await Agent.find()
      .select('-password')
      .populate('assignedCustomers');
    
    res.json({ success: true, agents });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const agent = await Agent.findByIdAndDelete(req.params.id);
    if (!agent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Agent not found' 
      });
    }
    res.json({ 
      success: true, 
      message: 'Agent deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;
