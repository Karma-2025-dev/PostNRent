const Joi = require("joi");

module.exports.listingschema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  image: Joi.string().allow("", null),
  price: Joi.number().required().min(0),
  location: Joi.string().required(),
  country: Joi.string().required()
});

module.exports.reviewschema = Joi.object({
  comment: Joi.string().required(),
  rating: Joi.number().required().min(1).max(5)
});
