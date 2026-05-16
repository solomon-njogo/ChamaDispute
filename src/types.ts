export interface ChamaBylaws {
  id: string;
  name: string;
  content: string;
  article?: string;
}

export interface DisputeCase {
  id: string;
  createdAt: string;
  memberId: string;
  claim: string;
  evidenceText?: string;
  language: string;
  ruling?: Ruling;
  status: 'pending' | 'resolved';
}

export interface Ruling {
  caseSummary: string;
  relevantBylaws: string[];
  evidenceAnalysis: string;
  ruling: string;
  recommendedAction: string;
  preventiveMeasure: string;
}
