const mongoose = require('mongoose');
const Review = mongoose.model('Review');
const Store = mongoose.model('Store');

exports.addReview = async (req, res) => {
  // 1. Create review
  req.body.author = req.user._id;
  req.body.store = req.params.id;
  const review = await Review.create(req.body);
  // 2. Add review to store
  const store = await Store
    .findByIdAndUpdate(req.params.id,
      { $addToSet: { reviews: review._id } },
      { new: true })
    .populate('reviews');
  req.flash('success', 'Successfully created review.')
  res.redirect('back');
}