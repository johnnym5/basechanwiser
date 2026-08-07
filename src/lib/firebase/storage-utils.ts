import { storage } from "./config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadPackFile(studentId: string, fieldId: string, file: File) {
  const fileExtension = file.name.split('.').pop();
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
