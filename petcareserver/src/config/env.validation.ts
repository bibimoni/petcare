import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(8080),

  POSTGRES_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().default('your-secret-key'),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
});
