import * as v from 'valibot';

const emailValidator = v.pipe(
  v.string(),
  v.nonEmpty('Email is required'),
  v.email('Invalid email format'),
);

const passwordValidator = v.pipe(
  v.string(),
  v.nonEmpty('Password is required'),
  v.minLength(8, 'Password must be at least 8 characters'),
  v.maxLength(20, 'Password must be less than 20 characters'),
);

const passwordRequiredValidator = v.pipe(
  v.string(),
  v.nonEmpty('Password is required'),
);

const nameValidator = v.pipe(
  v.string(),
  v.nonEmpty('Name is required'),
  v.maxLength(20, 'Name must be less than 20 characters'),
);

export const SignUpSchema = v.object({
  name: nameValidator,
  email: emailValidator,
  password: passwordValidator,
});

export const SignInSchema = v.object({
  email: emailValidator,
  password: v.pipe(
    passwordRequiredValidator,
    passwordValidator
  ),
});
