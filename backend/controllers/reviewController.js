const Review = require('../models/Review');
const Hostel = require('../models/Hostel');

exports.createReview = async (req, res) => {
  const { hostelId, rating, comment } = req.body;
  try {
    const review = await Review.create({
      user: req.user._id,
      hostel: hostelId,
      rating,
      comment,
    });

    // Update hostel average rating
    const reviews = await Review.find({ hostel: hostelId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Hostel.findByIdAndUpdate(hostelId, { rating: avgRating });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getHostelReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ hostel: req.params.hostelId }).populate('user', 'name');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};