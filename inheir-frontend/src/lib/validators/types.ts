import * as v from 'valibot';
import { SignInSchema, SignUpSchema } from './schema';

export type SignUpData = v.InferInput<typeof SignUpSchema>;
export type SignInData = v.InferInput<typeof SignInSchema>;

export type FeatureData = {
  title: string;
  description: string;
}
