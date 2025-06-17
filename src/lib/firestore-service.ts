
'use server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, serverTimestamp, type Timestamp } from 'firebase/firestore';
import type { ContentRequest, FullSocialPostOutput } from '@/lib/types';

const CONTENT_REQUESTS_COLLECTION = 'contentRequests';

// Helper function to process a single request object's timestamps
function processRequestTimestamps(requestData: any): ContentRequest {
  const data = { ...requestData } as ContentRequest;

  // Convert createdAt if it's a Firestore Timestamp
  if (data.createdAt && typeof (data.createdAt as any).toDate === 'function') {
    data.createdAt = (data.createdAt as unknown as Timestamp).toDate().toISOString();
  } else if (data.createdAt && typeof data.createdAt === 'object' && 'seconds' in data.createdAt && 'nanoseconds' in data.createdAt) {
    const ts = data.createdAt as unknown as { seconds: number, nanoseconds: number };
    data.createdAt = new Date(ts.seconds * 1000 + ts.nanoseconds / 1000000).toISOString();
  } else if (typeof data.createdAt !== 'string' && data.createdAt) {
     try { data.createdAt = (data.createdAt as unknown as Date).toISOString(); }
     catch (e) { console.warn("Could not convert createdAt to ISOString", data.createdAt); data.createdAt = new Date().toISOString();}
  }


  // Convert updatedAt if it's a Firestore Timestamp
  if (data.updatedAt && typeof (data.updatedAt as any).toDate === 'function') {
    data.updatedAt = (data.updatedAt as unknown as Timestamp).toDate().toISOString();
  } else if (data.updatedAt && typeof data.updatedAt === 'object' && 'seconds' in data.updatedAt && 'nanoseconds' in data.updatedAt) {
    const ts = data.updatedAt as unknown as { seconds: number, nanoseconds: number };
    data.updatedAt = new Date(ts.seconds * 1000 + ts.nanoseconds / 1000000).toISOString();
  } else if (typeof data.updatedAt !== 'string' && data.updatedAt) {
     try { data.updatedAt = (data.updatedAt as unknown as Date).toISOString(); }
     catch (e) { console.warn("Could not convert updatedAt to ISOString", data.updatedAt); data.updatedAt = new Date().toISOString(); }
  }
  return data;
}


// Function to save or update a content request in Firestore
export async function saveContentRequest(requestData: ContentRequest): Promise<void> {
  try {
    const docRef = doc(db, CONTENT_REQUESTS_COLLECTION, requestData.id);
    // Create a deep copy for Firestore, ensuring no undefined fields are sent directly
    const dataToSave: any = JSON.parse(JSON.stringify({
      ...requestData,
      updatedAt: serverTimestamp(), // Always update with server timestamp
    }));
    
    const currentDocSnap = await getDoc(docRef);
    if (!currentDocSnap.exists()) { // Only set createdAt on initial document creation
        dataToSave.createdAt = serverTimestamp();
    } else {
        delete dataToSave.createdAt; // Don't overwrite createdAt if document exists
    }


    // Ensure socialPostOutput is a plain object for Firestore
    if (dataToSave.socialPostOutput) {
      dataToSave.socialPostOutput = { ...dataToSave.socialPostOutput };
      if (dataToSave.socialPostOutput.notes) {
         dataToSave.socialPostOutput.notes = { ...dataToSave.socialPostOutput.notes };
      }
    }
    
    // Remove any top-level undefined properties before saving to Firestore
    Object.keys(dataToSave).forEach(key => {
      if (dataToSave[key] === undefined) {
        delete dataToSave[key];
      }
    });
    
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error: any) {
    console.error('Firestore Save Error Details (server-side log):', error);
    let detailedMessage = 'Failed to save content request.';
    if (error.message && typeof error.message === 'string') {
      detailedMessage += ` Firebase: ${error.message}`;
    } else if (error.code && typeof error.code === 'string') {
      detailedMessage += ` Firebase Code: ${error.code}`;
    }
    throw new Error(detailedMessage);
  }
}

// Function to get a single content request from Firestore
export async function getContentRequest(id: string): Promise<ContentRequest | null> {
  try {
    const docRef = doc(db, CONTENT_REQUESTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const rawData = docSnap.data();
      return processRequestTimestamps({ id: docSnap.id, ...rawData } as ContentRequest);
    } else {
      console.log('No such document with ID:', id);
      return null;
    }
  } catch (error) {
    console.error('Error getting content request from Firestore:', error);
    throw error;
  }
}

// Function to get all content requests from Firestore, ordered by creation date
export async function getAllContentRequests(): Promise<ContentRequest[]> {
  try {
    const q = query(collection(db, CONTENT_REQUESTS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const requests: ContentRequest[] = [];
    querySnapshot.forEach((doc) => {
      const rawData = doc.data();
      requests.push(processRequestTimestamps({ id: doc.id, ...rawData } as ContentRequest));
    });
    return requests;
  } catch (error) {
    console.error('Error getting all content requests from Firestore:', error);
    throw error;
  }
}
