const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name! 👮‍♂️👮‍♀️'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates! 👮‍♂️👮‍♀️'
    }],
    address: {
      type: String,
      required: 'You must supply and address! 👮‍♂️👮‍♀️'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Define our indexes
storeSchema.index({
  name: 'text',
  description: 'text'
});

storeSchema.index({location: '2dsphere'})

storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    return next(); // Skip it
  }
  this.slug = slug(this.name);
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
});

storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } }},
    { $sort: { count: -1 }}
  ]);
}

// find reviews where store _id property === review store property
storeSchema.virtual('reviews', {
  ref: 'Review', // which model
  localField: '_id', // which field on the store
  foreignField: 'store' // which field on the review
});

function autopopulate(next) {
  this.populate('reviews');
  next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

storeSchema.statics.getTopStores = function() {
  return this.aggregate([
    // Lookup stores and populate their reviews
    // ME: Por qué no se le indica un modelo en el atributo 'from' ?
    // - En realidad sí se le está indicando, para comparar modelos, MongoDB agarra los modelos existentes
    //   le pone minúscula a la primer letra y le agrega 's' al final, entonces: Review => reviews (que es
    //   justamente lo que está en el from). Re loco.
    { $lookup: { from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' } },

    // filter for only items that have 2 or more reviews
    // ME: Lo que hace acá es decir algo así como: fijate que el elemento 1 del array exista. Si existe por lo 
    // tanto el array tiene 2 elementos (la posición 0 y 1). Algo así como hacer: Boolean(reviews[1]).
    { $match: { 'reviews.1': { $exists: true } } },

    // Add the average reviews fields
    // ME: El $$ROOT es una referencia al documento original. Necesitamos espeficiar porque el project me limpia
    // todos los campos excepto los que especifiquemos. Entonces tenemos que volver a especificar los campos con
    // los valores originales. En las versiones más recientes de MongoDB supuestamente se puede configurar para
    // no lo haga.
    { $project: {
      photo: '$$ROOT.photo',
      name: '$$ROOT.name',
      reviews: '$$ROOT.reviews',
      slug: '$$ROOT.slug',
      averageRating: { $avg: '$reviews.stars' }
    }},

    // Sort it by our new field, highest reviews first
    { $sort: { averageRating: -1 }},

    // limit to at most 10
    { $limit: 10 }

  ]);
}

module.exports = mongoose.model('Store', storeSchema);