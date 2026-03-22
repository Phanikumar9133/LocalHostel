// routes/hostelRoutes.js
const express = require('express');
const { protect, ownerOnly } = require('../middleware/authMiddleware');
const {
  getAllHostels,
  getHostelById,
  createHostel,
  updateHostel,
  deleteHostel
} = require('../controllers/hostelController');
const uploadHostelImages = require('../middleware/upload');

const router = express.Router();

// ────────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (no auth)
// ────────────────────────────────────────────────────────────────────────────────
router.get('/', getAllHostels);                    // GET /api/hostels

// ────────────────────────────────────────────────────────────────────────────────
// PROTECTED OWNER ROUTES (specific before parameterized)
// ────────────────────────────────────────────────────────────────────────────────
router.get('/my-hostels', protect, ownerOnly, async (req, res) => {
  try {
    const ownerId = req.user._id;
    console.log('[MY-HOSTELS] Querying for owner:', ownerId.toString());

    const hostels = await Hostel.find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .lean();

    console.log('[MY-HOSTELS] Found:', hostels.length, 'hostels');

    res.status(200).json({
      success: true,
      count: hostels.length,
      hostels
    });
  } catch (error) {
    console.error('[MY-HOSTELS ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your hostels',
      error: error.message
    });
  }
});

router.get('/:id', getHostelById);                 // GET /api/hostels/:id  ← AFTER /my-hostels

router.post('/', protect, ownerOnly, uploadHostelImages, createHostel);
router.put('/:id', protect, ownerOnly, uploadHostelImages, updateHostel);
router.delete('/:id', protect, ownerOnly, deleteHostel);

module.exports = router;