import * as v from 'valibot';
import { SignInSchema, SignUpSchema } from './schema';

export type SignUpData = v.InferInput<typeof SignUpSchema>;
export type SignInData = v.InferInput<typeof SignInSchema>;

export type FeatureData = {
  title: string;
  description: string;
}

export type Coordinates = {
  latitude: number;
  longitude: number;
}

export type ChatHistory = {
  user: string;
  bot: string;
}

export type CaseTabs = 'chatbot' | 'gis' | 'documents';

export type CaseData = {
  meta: CaseResponse;
  summary: CaseSummary;
}

export type CaseMetaResponse = {
  cases: CaseResponse[];
  status: string;
  success: string;
  reason: string | null;
}

export type CaseResponse = {
  case_id: string;
  title: string;
  status: string;
  created_at: string;
}

export type CaseSummary = {
  case_id: string;
  valid: boolean;
  legitimate: boolean;
  case_type: string;
  entity: Entity[] | null;
  asset: Asset[] | null;
  document: string;
  supporting_documents: string[] | null;
  summary: string;
  recommendations: string[] | null;
  references: string[] | null;
  remarks: string | null;
}

export type Entity = {
  name: string;
  entity_type: string;
  valid: boolean;
}

export type Asset = {
  name: string;
  location: string | null;
  asset_type: string;
  net_worth: string | null;
  coordinates: string | null;
}

export type GISResponse = {
  property_buying_risk: number;
  property_renting_risk: number;
  flood_risk: number;
  crime_rate: number;
  air_quality_index: number;
  proximity_to_amenities: number;
  transportation_score: number;
  neighborhood_rating: number;
  environmental_hazards: number;
  economic_growth_potential: number;
};
