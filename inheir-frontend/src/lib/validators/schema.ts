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
  v.minLength(8, 'Password must be at least 8 characters'),
  v.maxLength(12, 'Password must be less than 12 characters'),
);

const nameValidator = v.pipe(
  v.string(),
  v.nonEmpty('Name shouldn\'t be empty'),
  v.maxLength(20, 'Name must be less than 20 characters'),
);

export const SignUpSchema = v.object({
  full_name: v.pipe(
    nameValidator,
    v.regex(/^[A-Za-z ]+$/, "Full name must contain only alphanumeric characters"),
  ),
  username: v.pipe(
    nameValidator,
    v.regex(/^\w+$/, "Username must contain only alphanumeric characters"),
  ),
  email: emailValidator,
  password: passwordValidator,
});

export const SignInSchema = v.object({
  username: v.pipe(
    nameValidator,
    v.regex(/^\w+$/, "Username must contain only alphanumeric characters"),
  ),
  password: v.pipe(
    passwordRequiredValidator,
    passwordValidator
  ),
});
