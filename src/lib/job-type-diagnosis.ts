export {
  DIAGNOSIS_QUESTIONS,
  buildDiagnosisJobsUrl,
  buildDiagnosisTrialJobsUrl,
  buildResultSignature,
  calculateDiagnosisResult,
  formatDiagnosisDate,
  getSocialProofApplyRate,
  mapDiagnosisJobTypeToFilter,
} from "@/lib/job-type-diagnosis-engine";

export type {
  DiagnosisAnswers,
  DiagnosisJobType,
  DiagnosisPreferredArea,
  DiagnosisQuestion,
  DiagnosisResult,
  DiagnosisResultItem,
  RecommendedDiagnosisShop,
  SavedDiagnosisResult,
} from "@/lib/job-type-diagnosis-types";

export {
  DIAGNOSIS_JOB_TYPES,
  DIAGNOSIS_PREFERRED_AREA_OPTIONS,
} from "@/lib/job-type-diagnosis-types";

export {
  formatDiagnosisDistrictLabel,
  formatPreferredAreasLabel,
  parsePreferredAreasFromAnswers,
  pickRecommendedDiagnosisShops,
} from "@/lib/job-type-diagnosis-recommendations";
