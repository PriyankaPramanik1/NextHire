const Joi = require('joi');


const validateRegistration = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().optional()
  });

  return schema.validate(data);
};
const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  return schema.validate(data, { stripUnknown: true });
};
const validateProfile = (data) => {
  const schema = Joi.object({
    name: Joi.string().trim().min(2).max(50),

    profile: Joi.object({
      title: Joi.string().max(100),
      skills: Joi.array().items(Joi.string().max(50)),
      experience: Joi.string().valid('entry', 'mid', 'senior', 'executive'),

      education: Joi.array().items(
        Joi.object({
          institution: Joi.string().max(100),
          degree: Joi.string().max(100),
          field: Joi.string().max(100),
          year: Joi.number().integer().min(1900).max(new Date().getFullYear())
        })
      ),

      resume: Joi.object({
        url: Joi.string().uri().allow(''),
        publicId: Joi.string().allow('')
      }).default(() => ({ url: '', publicId: '' })),

      profilePicture: Joi.object({
        url: Joi.string().uri().allow(''),
        publicId: Joi.string().allow('')
      }).default(() => ({ url: '', publicId: '' })),

      bio: Joi.string().max(1000),
      location: Joi.string().max(100),
      phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).allow('')
    }),

    company: Joi.object({
      name: Joi.string().max(100),
      description: Joi.string().max(1000),
      website: Joi.string().uri().allow(''),

      logo: Joi.object({
        url: Joi.string().uri().allow(''),
        publicId: Joi.string().allow('')
      }).default(() => ({ url: '', publicId: '' })),

      size: Joi.string().valid(
        '1-10',
        '11-50',
        '51-200',
        '201-500',
        '501-1000',
        '1000+'
      ),

      industry: Joi.string().max(100),
      founded: Joi.number().integer().min(1800).max(new Date().getFullYear())
    })
  });

  return schema.validate(data, { stripUnknown: true });
};

module.exports = {
  
  validateRegistration,
  validateLogin,
  validateProfile
};
