import { storage } from "./config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Uploads a student pack file to the fresh Firebase Storage bucket.
 */
export async function uploadPackFile(studentId: string, fieldId: string, file: File) {
  const timestamp = Date.now();
  const filePath = `student_packs/${studentId}/${fieldId}/${timestamp}_${file.name}`;
  const fileRef = ref(storage, filePath);

  const snapshot = await uploadBytes(fileRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);

  return {
    fileUrl: downloadUrl,
    fileName: file.name
  };
}

/**
 * Uploads a mock interview video blob to the fresh Firebase Storage bucket.
 */
export async function uploadMockVideo(studentId: string, blob: Blob) {
  const timestamp = Date.now();
  const filePath = `mock_interviews/${studentId}/${timestamp}.webm`;
  const fileRef = ref(storage, filePath);

  const snapshot = await uploadBytes(fileRef, blob);
  const downloadUrl = await getDownloadURL(snapshot.ref);

  return downloadUrl;
}
