/**
 * 상담 멘트 생성 유스케이스의 입력 모델. 교사가 상담 준비 화면에서 자유 텍스트로
 * 입력하는 학생 정보를 표현한다. 영속화된 Student 엔티티(entities/student.ts)와는
 * 별개로, 단발성 상담 멘트 생성 요청 하나에 대응하는 값 객체다.
 */
export interface CounselingIntake {
  studentName: string;
  grade: number;
  className: string;
  academicSummary: string;
  relationshipSummary: string;
  careerSummary: string;
}
