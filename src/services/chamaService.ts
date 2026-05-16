import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { ChamaBylaws, DisputeCase, Ruling } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const chamaService = {
  // Bylaws
  async saveBylaws(bylaws: ChamaBylaws[]) {
    try {
      const metadataRef = doc(db, 'chama', 'metadata');
      const bylawsCol = collection(metadataRef, 'bylaws');
      
      for (const law of bylaws) {
        await setDoc(doc(bylawsCol, law.id), {
          ...law,
          updatedAt: serverTimestamp()
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'chama/metadata/bylaws');
    }
  },

  async getBylaws(): Promise<ChamaBylaws[]> {
    try {
      const bylawsCol = collection(db, 'chama', 'metadata', 'bylaws');
      const snapshot = await getDocs(bylawsCol);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChamaBylaws));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'chama/metadata/bylaws');
      return [];
    }
  },

  // Disputes
  async createDispute(claim: string, evidence: string, language: string, memberId: string) {
    try {
      const disputeCol = collection(db, 'disputes');
      const docRef = await addDoc(disputeCol, {
        memberId,
        claim,
        evidence,
        language,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'disputes');
    }
  },

  async getDisputes(): Promise<DisputeCase[]> {
    try {
      const disputeCol = collection(db, 'disputes');
      const q = query(disputeCol, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
        } as DisputeCase;
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'disputes');
      return [];
    }
  },

  // Statements
  async uploadStatementEntries(entries: any[]) {
    try {
      const statementsCol = collection(db, 'statements');
      // Batch would be better, but let's do parallel for now
      await Promise.all(entries.map(entry => 
        setDoc(doc(statementsCol, entry.receiptNo), {
          ...entry,
          uploadedAt: serverTimestamp()
        })
      ));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'statements');
    }
  }
};
