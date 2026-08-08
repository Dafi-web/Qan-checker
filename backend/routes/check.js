const express = require('express');
const Qan = require('../models/Qan');

const router = express.Router();

function normalizeSerial(value) {
  return String(value || '').trim().toUpperCase();
}

router.post('/', async (req, res) => {
  try {
    const serial = normalizeSerial(req.body.serialNumber ?? req.body.serial);
    if (!serial) {
      return res.status(400).json({ message: 'Serial number is required' });
    }

    const matches = await Qan.find({
      active: true,
      serialNumbers: serial,
    }).select('qanNumber title description');

    if (matches.length > 0) {
      return res.json({
        serial,
        affected: true,
        status: 'do_not_ship',
        message: "Please don't ship this unit. Just send it back to CM.",
        qans: matches,
      });
    }

    return res.json({
      serial,
      affected: false,
      status: 'good_to_ship',
      message: 'Good to ship.',
      qans: [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check serial number' });
  }
});

module.exports = router;
