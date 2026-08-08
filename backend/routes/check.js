const express = require('express');
const Qan = require('../models/Qan');
const { MAX_SERIALS, MAX_SERIAL_LENGTH, parseSerials } = require('../utils/serials');

const router = express.Router();

async function checkOne(serial, qanFilter) {
  const query = {
    active: true,
    serialNumbers: serial,
    ...qanFilter,
  };

  const matches = await Qan.find(query).select('qanNumber title description');

  if (matches.length > 0) {
    return {
      serial,
      affected: true,
      status: 'do_not_ship',
      message: "Please don't ship this unit. Just send it back to CM.",
      qans: matches,
    };
  }

  return {
    serial,
    affected: false,
    status: 'good_to_ship',
    message: 'Good to ship.',
    qans: [],
  };
}

router.get('/qans', async (_req, res) => {
  try {
    const qans = await Qan.find({ active: true })
      .select('qanNumber title')
      .sort({ createdAt: -1 });

    res.json(
      qans.map((q) => ({
        id: q._id,
        qanNumber: q.qanNumber,
        title: q.title,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: 'Failed to load QANs' });
  }
});

router.post('/', async (req, res) => {
  try {
    const raw = req.body.serialNumbers ?? req.body.serials ?? req.body.serialNumber ?? req.body.serial;
    const { serials } = parseSerials(raw);

    if (serials.length === 0) {
      return res.status(400).json({ message: 'At least one serial number is required' });
    }

    const tooLong = serials.filter((s) => s.length > MAX_SERIAL_LENGTH);
    if (tooLong.length > 0) {
      return res.status(400).json({
        message: `Each serial must be ${MAX_SERIAL_LENGTH} digits or fewer. Longer values are not allowed.`,
        maxLength: MAX_SERIAL_LENGTH,
        invalid: tooLong.slice(0, 5),
      });
    }

    if (serials.length > MAX_SERIALS) {
      return res.status(400).json({
        message: `You can check up to ${MAX_SERIALS} serial numbers at a time`,
        max: MAX_SERIALS,
        provided: serials.length,
      });
    }

    const qanId = req.body.qanId ? String(req.body.qanId).trim() : '';
    let qanFilter = {};
    let selectedQan = null;

    if (qanId && qanId !== 'all') {
      selectedQan = await Qan.findOne({ _id: qanId, active: true }).select('qanNumber title');
      if (!selectedQan) {
        return res.status(404).json({ message: 'Selected QAN not found or inactive' });
      }
      qanFilter = { _id: selectedQan._id };
    }

    const results = [];
    for (const serial of serials) {
      results.push(await checkOne(serial, qanFilter));
    }

    const blocked = results.filter((r) => r.affected);
    const clear = results.filter((r) => !r.affected);
    const scopeLabel = selectedQan
      ? `${selectedQan.qanNumber}${selectedQan.title ? ` — ${selectedQan.title}` : ''}`
      : 'all active QANs';

    return res.json({
      total: results.length,
      blockedCount: blocked.length,
      clearCount: clear.length,
      max: MAX_SERIALS,
      maxLength: MAX_SERIAL_LENGTH,
      qanId: selectedQan ? String(selectedQan._id) : 'all',
      qanLabel: scopeLabel,
      results,
      summary: {
        message:
          blocked.length === 0
            ? `All ${results.length} unit(s) are clear for ${scopeLabel}.`
            : `${blocked.length} of ${results.length} unit(s) match ${scopeLabel} — do not ship, send back to CM.`,
        status: blocked.length === 0 ? 'all_clear' : 'has_blocks',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check serial number(s)' });
  }
});

module.exports = router;
