const express = require('express');
const Agent = require('../models/Agent');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// Create agent
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

    // Check if agent already exists
    const existingAgent = await Agent.findOne({ email });
    if (existingAgent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Agent with this email already exists' 
      });
    }

    // Create new agent
    const agent = new Agent({ name, email, mobile, password });
    await agent.save();

    // Remove password from response
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

// Get all agents
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

// Delete agent
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