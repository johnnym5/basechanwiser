"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  X,
  Timer,
  Lightbulb,
  HelpCircle,
  ArrowRight,
  Loader2,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { shuffleArray } from "@/lib/utils/shuffle";
import { AskedQuestion, TestQuestionSet } from "@/types/academy";

const BASE_POINTS = 1;
const TIME_BONUS_MULTIPLIER = 1;

interface QuizExecutionProps {
  testSet: TestQuestionSet;
  onFinish: (results: {
    askedQuestions: AskedQuestion[];
    studentAnswers: (number | null)[];
    correctCount: number;
    gamifiedScore: number;
    totalTimeSpent: number;
  }) => void;
}

/**
 * QuizExecution: Handles the high-stakes timed quiz arena.
 * Pattern: Per-Question Micro-Timer with Auto-Advance logic.
 */
export default function QuizExecution({ testSet, onFinish }: QuizExecutionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15); // Forced to 15s as per requirements
  const [showHint, setShowHint] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Prep randomized questions and track their correct indices
  const [preparedQuestions, setPreparedQuestions] = useState<AskedQuestion[]>([]);
  const [studentAnswers, setStudentAnswers] = useState<(number | null)[]>([]);

  // Stats accumulation
  const [correctCount, setCorrectCount] = useState(0);
  const [gamifiedScore, setGamifiedScore] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Initialization & Randomization ──
  // Rule: If isRandomized is true, shuffle questions AND options exactly ONCE.
  // NEW: Only pick 10 random questions from the pool.
  useEffect(() => {
    let rawQuestions = [...testSet.questions];
    if (testSet.isRandomized) {
      rawQuestions = shuffleArray(rawQuestions).slice(0, 10);
    } else {
      rawQuestions = rawQuestions.slice(0, 10);
    }

    const prepped = rawQuestions.map(q => {
      let shuffledOptions = [...q.options];
      if (testSet.isRandomized) {
        shuffledOptions = shuffleArray(shuffledOptions);
      }

      const correctText = q.options.find(o => o.id === q.correctOptionId)?.text || "";
      const newCorrectIndex = shuffledOptions.findIndex(o => o.text === correctText);

      return {
        prompt: q.prompt,
        shuffledOptions: shuffledOptions.map(o => o.text),
        correctAnswerIndex: newCorrectIndex,
        explanation: q.explanation || null // ── FIX: Ensure undefined is never passed to Firestore ──
      } as AskedQuestion;
    });

    setPreparedQuestions(prepped);
  }, [testSet]);

  // ── Auto-Advance Micro-Timer ──
  useEffect(() => {
    if (!isAnswering && !isFinalizing && preparedQuestions.length > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAnswerSelect(null); // Auto-advance on 0
            return 15; // Reset to 15s
          }
          if (prev <= 5) setShowHint(true);
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAnswering, isFinalizing, currentQuestionIndex, preparedQuestions]); // Removed testSet dependency for fixed timer

  const handleAnswerSelect = (index: number | null) => {
    if (isAnswering || isFinalizing) return;
    setIsAnswering(true);
    setSelectedOptionIndex(index);

    const currentQ = preparedQuestions[currentQuestionIndex];
    const timeSpent = 15 - timeLeft; // Using 15s base
    setTotalTimeSpent(prev => prev + timeSpent);

    const isCorrect = index === currentQ.correctAnswerIndex;

    // Calculate Score Contribution
    let questionPoints = 0;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      questionPoints = BASE_POINTS + (timeLeft * TIME_BONUS_MULTIPLIER);
      setGamifiedScore(prev => prev + questionPoints);
    }

    const updatedAnswers = [...studentAnswers, index];
    setStudentAnswers(updatedAnswers);

    // Transition Delay
    setTimeout(() => {
      if (currentQuestionIndex < preparedQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setTimeLeft(15); // Reset to 15s
        setShowHint(false);
        setSelectedOptionIndex(null);
        setIsAnswering(false);
      } else {
        setIsFinalizing(true);
        onFinish({
          askedQuestions: preparedQuestions,
          studentAnswers: updatedAnswers,
          correctCount: isCorrect ? correctCount + 1 : correctCount,
          gamifiedScore: isCorrect ? gamifiedScore + questionPoints : gamifiedScore,
          totalTimeSpent: totalTimeSpent + timeSpent
        });
      }
    }, 800);
  };

  if (preparedQuestions.length === 0) return (
    <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>
  );

  const currentQ = preparedQuestions[currentQuestionIndex];
  const isLowTime = timeLeft <= 5;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Timer Bar */}
      <div className="relative h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
        <motion.div
          className={`h-full ${isLowTime ? 'bg-rose-500' : 'bg-blue-500'}`}
          initial={{ width: "100%" }}
          animate={{ width: `${(timeLeft / testSet.timePerQuestionSeconds) * 100}%` }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col">
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Question {currentQuestionIndex + 1} of {preparedQuestions.length}</span>
           <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter">{testSet.title}</h3>
        </div>
        <div className={`flex flex-col items-end transition-all ${isLowTime ? 'text-rose-500 animate-pulse' : 'text-blue-500'}`}>
           <span className="text-[10px] font-black uppercase tracking-widest">Time Remaining</span>
           <div className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              <span className="text-xl font-black">{timeLeft}s</span>
           </div>
        </div>
      </div>

      <div className={`bg-white dark:bg-slate-800 rounded-[40px] p-10 border border-gray-100 dark:border-slate-700 shadow-xl space-y-10 relative overflow-hidden transition-all ${isLowTime ? 'ring-2 ring-rose-500/20' : ''}`}>
        <div className="absolute top-0 right-0 p-8 text-blue-500/5"><HelpCircle size={120} /></div>

        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight relative z-10">
          {currentQ.prompt}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {currentQ.shuffledOptions.map((opt, idx) => {
            const isSelected = selectedOptionIndex === idx;
            const isCorrect = idx === currentQ.correctAnswerIndex;

            let style = "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 hover:border-blue-500/50";
            if (isAnswering) {
              if (isCorrect) style = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600";
              else if (isSelected) style = "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600";
              else style = "opacity-40 grayscale pointer-events-none";
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(idx)}
                disabled={isAnswering || isFinalizing}
                className={`p-6 rounded-3xl border-2 text-left transition-all flex items-center justify-between group ${style}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black uppercase transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-400 border border-inherit shadow-sm'}`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-sm font-bold">{opt}</span>
                </div>
                {isAnswering && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {isAnswering && isSelected && !isCorrect && <X className="w-5 h-5 text-rose-500" />}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {showHint && currentQ.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-3xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-start gap-4"
            >
              <Lightbulb className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Delayed Hint Active</p>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-300 leading-relaxed">{currentQ.explanation}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center px-4">
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
           {isAnswering ? "Verifying..." : "Select an answer to proceed"}
         </p>
         {!isAnswering && (
            <button
              onClick={() => handleAnswerSelect(null)}
              className="text-xs font-black uppercase tracking-widest text-blue-500 hover:underline flex items-center gap-2"
            >
               Skip to Next <ArrowRight size={14} />
            </button>
         )}
      </div>
    </div>
  );
}
