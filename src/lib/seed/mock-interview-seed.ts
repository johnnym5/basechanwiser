import { db } from "@/lib/firebase/config";
import { doc, setDoc, getDoc } from "firebase/firestore";

const DEFAULT_QUESTIONS = [
  "Why did you choose this university specifically?",
  "How will you fund your studies and living expenses in the UK?",
  "What are your career plans after you finish your degree in the UK?",
  "Why did you choose to study in the UK instead of your home country or another English-speaking nation?",
  "How does this course relate to your previous academic or professional background?",
  "What do you know about the city where your university is located?",
  "Can you name some of the modules you will be studying?",
  "What is your target RQF level for this course?",
  "Where do you plan to live while studying?",
  "How much is your tuition fee, and how much have you paid so far?"
];

export async function seedDefaultMockConfig() {
  const configRef = doc(db, "mock_interview_configs", "default");
  const snap = await getDoc(configRef);

  if (!snap.exists()) {
    await setDoc(configRef, {
      durationMinutes: 20,
      questions: DEFAULT_QUESTIONS.map((text, index) => ({
        id: `q_${index + 1}`,
        text
      }))
    });
    console.log("Default mock interview config seeded.");
  }
}
