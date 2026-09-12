export interface CounselingCommentFormState {
  status: "idle" | "success" | "error";
  studentComment?: string;
  parentComment?: string;
  sourceDocuments?: string[];
  errorMessage?: string;
}

export const initialCounselingCommentFormState: CounselingCommentFormState = {
  status: "idle",
};
