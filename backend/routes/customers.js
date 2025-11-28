const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const Customer = require('../models/Customer');
const Agent = require('../models/Agent');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, XLSX, and XLS files are allowed.'));
    }
  }
});

// Protect all routes
router.use(authMiddleware);

// Upload and distribute customers
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    // Parse Excel/CSV file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Validate data
    if (!data || data.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'File is empty or invalid' 
      });
    }

    // Check for required fields
    const requiredFields = ['FirstName', 'Phone'];
    const hasRequiredFields = requiredFields.every(field => 
      data[0].hasOwnProperty(field) || data[0].hasOwnProperty(field.toLowerCase())
    );

    if (!hasRequiredFields) {
      return res.status(400).json({ 
        success: false, 
        message: 'File must contain FirstName and Phone columns' 
      });
    }

    // Get all active agents (limit to 5)
    const agents = await Agent.find({ isActive: true }).limit(5);
    if (agents.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No active agents available. Please create agents first.' 
      });
    }

    // Clear existing customers and agent assignments
    await Customer.deleteMany({});
    agents.forEach(agent => agent.assignedCustomers = []);

    // Distribute customers equally among agents
    const customers = [];
    const agentCount = agents.length;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const agentIndex = i % agentCount;
      const assignedAgent = agents[agentIndex];

      const customer = new Customer({
        firstName: row.FirstName || row.firstname || '',
        phone: row.Phone || row.phone || '',
        notes: row.Notes || row.notes || '',
        assignedAgent: assignedAgent._id
      });

      const savedCustomer = await customer.save();
      customers.push(savedCustomer);
      assignedAgent.assignedCustomers.push(savedCustomer._id);
    }

    // Save all agent updates
    await Promise.all(agents.map(agent => agent.save()));

    // Get agents with populated customers
    const agentsWithCustomers = await Agent.find()
      .select('-password')
      .populate('assignedCustomers');

    res.json({
      success: true,
      message: `Successfully uploaded and distributed ${customers.length} customers`,
      distribution: agentsWithCustomers.map(agent => ({
        agentName: agent.name,
        email: agent.email,
        customersCount: agent.assignedCustomers.length,
        customers: agent.assignedCustomers
      }))
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get customer distribution
router.get('/distribution', async (req, res) => {
  try {
    const agents = await Agent.find()
      .select('-password')
      .populate('assignedCustomers');

    res.json({
      success: true,
      distribution: agents.map(agent => ({
        agentId: agent._id,
        agentName: agent.name,
        email: agent.email,
        mobile: agent.mobile,
        customersCount: agent.assignedCustomers.length,
        customers: agent.assignedCustomers
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;