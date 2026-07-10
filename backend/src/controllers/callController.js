const { Call, User } = require('../models');
const { Op } = require('sequelize');

// POST /api/calls
const createCallRecord = async (req, res) => {
  try {
    const { receiverId, type, status, startTime, endTime } = req.body;
    const callerId = req.user.id;

    if (!receiverId || !type) {
      return res.status(400).json({ success: false, message: 'Receiver ID and call type are required' });
    }

    let duration = null;
    if (startTime && endTime) {
      duration = Math.round((new Date(endTime) - new Date(startTime)) / 1000); // duration in seconds
    }

    const call = await Call.create({
      callerId,
      receiverId,
      type,
      status: status || 'missed',
      startTime,
      endTime,
      duration
    });

    res.status(201).json({ success: true, call });
  } catch (error) {
    console.error('Create call record error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/calls/history
const getCallHistory = async (req, res) => {
  try {
    const myId = req.user.id;
    const calls = await Call.findAll({
      where: {
        [Op.or]: [{ callerId: myId }, { receiverId: myId }]
      },
      order: [['createdAt', 'DESC']],
      limit: 50,
      include: [
        {
          model: User,
          as: 'caller',
          attributes: ['id', 'username']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'username']
        }
      ]
    });

    res.json({ success: true, calls });
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createCallRecord, getCallHistory };
