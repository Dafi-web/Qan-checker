const express = require('express');
const Qan = require('../models/Qan');
const { protect, requireAdmin } = require('../middleware/auth');
const { MAX_SERIAL_LENGTH, parseSerials } = require('../utils/serials');

const router = express.Router();

function normalizeSerial(value) {
  return String(value).trim().toUpperCase();
}

function parseSerialList(input) {
  if (Array.isArray(input)) {
    const joined = input.join('\n');
    return parseSerials(joined).serials;
  }
  return parseSerials(input).serials;
}

function rejectTooLong(serials) {
  return serials.filter((s) => s.length > MAX_SERIAL_LENGTH);
}

router.use(protect, requireAdmin);

router.get('/', async (req, res) => {
  try {
    const qans = await Qan.find().sort({ createdAt: -1 });
    res.json(qans);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch QANs' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const qan = await Qan.findById(req.params.id);
    if (!qan) return res.status(404).json({ message: 'QAN not found' });
    res.json(qan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch QAN' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { qanNumber, title, description, serialNumbers, active } = req.body;
    if (!qanNumber || !title) {
      return res.status(400).json({ message: 'QAN number and title are required' });
    }

    const serials = [...new Set(parseSerialList(serialNumbers))];
    const tooLong = rejectTooLong(serials);
    if (tooLong.length) {
      return res.status(400).json({
        message: `Each serial must be ${MAX_SERIAL_LENGTH} characters or fewer`,
        invalid: tooLong.slice(0, 5),
      });
    }

    const qan = await Qan.create({
      qanNumber: String(qanNumber).trim().toUpperCase(),
      title: title.trim(),
      description: (description || '').trim(),
      serialNumbers: serials,
      active: active !== false,
      createdBy: req.user._id,
    });

    res.status(201).json(qan);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'QAN number already exists' });
    }
    res.status(500).json({ message: 'Failed to create QAN' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const qan = await Qan.findById(req.params.id);
    if (!qan) return res.status(404).json({ message: 'QAN not found' });

    const { qanNumber, title, description, active } = req.body;

    if (qanNumber) qan.qanNumber = normalizeSerial(qanNumber);
    if (title) qan.title = title.trim();
    if (description !== undefined) qan.description = String(description).trim();
    if (active !== undefined) qan.active = Boolean(active);

    await qan.save();
    res.json(qan);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'QAN number already exists' });
    }
    res.status(500).json({ message: 'Failed to update QAN' });
  }
});

router.post('/:id/serials', async (req, res) => {
  try {
    const qan = await Qan.findById(req.params.id);
    if (!qan) return res.status(404).json({ message: 'QAN not found' });

    const incoming = parseSerialList(req.body.serialNumbers ?? req.body.serials);
    if (!incoming.length) {
      return res.status(400).json({ message: 'Provide at least one serial number' });
    }

    const tooLong = rejectTooLong(incoming);
    if (tooLong.length) {
      return res.status(400).json({
        message: `Each serial must be ${MAX_SERIAL_LENGTH} characters or fewer`,
        invalid: tooLong.slice(0, 5),
      });
    }

    const existing = new Set(qan.serialNumbers.map(normalizeSerial));
    let added = 0;
    for (const serial of incoming) {
      if (!existing.has(serial)) {
        existing.add(serial);
        added += 1;
      }
    }

    qan.serialNumbers = [...existing];
    await qan.save();

    res.json({ qan, added, total: qan.serialNumbers.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add serial numbers' });
  }
});

router.delete('/:id/serials/:serial', async (req, res) => {
  try {
    const qan = await Qan.findById(req.params.id);
    if (!qan) return res.status(404).json({ message: 'QAN not found' });

    const target = normalizeSerial(req.params.serial);
    qan.serialNumbers = qan.serialNumbers.filter((s) => normalizeSerial(s) !== target);
    await qan.save();

    res.json(qan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove serial number' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const qan = await Qan.findByIdAndDelete(req.params.id);
    if (!qan) return res.status(404).json({ message: 'QAN not found' });
    res.json({ message: 'QAN deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete QAN' });
  }
});

module.exports = router;
