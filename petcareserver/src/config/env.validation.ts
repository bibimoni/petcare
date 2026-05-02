import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(8080),

  POSTGRES_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().default('your-secret-key'),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  CLD_CLOUD_NAME: Joi.string().required(),
  CLD_API_KEY: Joi.string().required(),
  CLD_API_SECRET: Joi.string().required(),

  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().required(),
  EMAIL_USER: Joi.string().required(),
  GOOGLE_APP_PASSWORD: Joi.string().required(),

  FRONTEND_URL: Joi.string().required(),

  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_PUBLIC_KEY: Joi.string().required(),
});
