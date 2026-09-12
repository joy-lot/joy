export interface AcademicRecord {
  subject: string;
  score: number;
  semester: string;
}

export interface RelationshipNote {
  category: "친밀" | "갈등" | "소외" | "일반";
  note: string;
}

export interface CareerRecord {
  desiredPath: string;
  aptitudeResult?: string;
}

export interface Student {
  id: string;
  name: string;
  grade: number;
  className: string;
  academicRecords: AcademicRecord[];
  relationshipNotes: RelationshipNote[];
  careerRecord?: CareerRecord;
}
