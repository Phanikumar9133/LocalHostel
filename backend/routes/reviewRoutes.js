const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createReview, getHostelReviews } = require('../controllers/reviewController');

const router = express.Router();

router.post('/', protect, createReview);
router.get('/:hostelId', getHostelReviews);

module.exports = router;