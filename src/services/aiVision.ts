import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AIDetection, AIInspectionAnalysis } from '../types';

let modelPromise: Promise<cocoSsd.ObjectDetection> | null = null;

/**
 * Loads the pre-trained COCO-SSD MobileNetV2 model weights.
 * Cached as a singleton promise to avoid repeated weight downloads.
 */
export async function getLoadedVisionModel(): Promise<cocoSsd.ObjectDetection> {
  if (!modelPromise) {
    // Ensure WebGL or CPU backend is ready
    await tf.ready();
    modelPromise = cocoSsd.load({
      base: 'lite_mobilenet_v2', // Lightweight and fast inference in browser
    });
  }
  return modelPromise;
}

export interface RunInferenceOptions {
  minConfidence?: number;
  expectedAttendance?: number;
  centreId: string;
  centreName?: string;
  inspectionId?: string;
  imageUrl: string;
}

export interface InferenceResult {
  analysis: AIInspectionAnalysis;
  detections: AIDetection[];
  inferenceTimeMs: number;
  personCount: number;
  equipmentCounts: Record<string, number>;
}

/**
 * Executes REAL computer vision deep learning inference on an HTMLImageElement or Canvas.
 * No mock data, no simulated bounding boxes.
 */
export async function runRealAIVisionInference(
  element: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
  options: RunInferenceOptions
): Promise<InferenceResult> {
  const startTime = performance.now();
  const model = await getLoadedVisionModel();

  // Run real neural network forward pass
  const rawDetections = await model.detect(element);
  const inferenceTimeMs = Math.round(performance.now() - startTime);

  const minConfidence = options.minConfidence ?? 0.45;

  // Filter valid detections
  const filteredDetections: AIDetection[] = rawDetections
    .filter(d => d.score >= minConfidence)
    .map(d => ({
      bbox: [
        Math.round(d.bbox[0]),
        Math.round(d.bbox[1]),
        Math.round(d.bbox[2]),
        Math.round(d.bbox[3]),
      ] as [number, number, number, number],
      class: d.class,
      score: Math.round(d.score * 100) / 100,
    }));

  // Analyze headcount and classroom equipment
  let personCount = 0;
  const equipmentCounts: Record<string, number> = {};

  for (const det of filteredDetections) {
    if (det.class === 'person') {
      personCount++;
    } else {
      equipmentCounts[det.class] = (equipmentCounts[det.class] || 0) + 1;
    }
  }

  const expectedCount = options.expectedAttendance ?? 0;
  // Discrepancy flagged if expected count is known and difference is > 30%
  const discrepancyDetected =
    expectedCount > 0 && Math.abs(personCount - expectedCount) / expectedCount > 0.3;

  const analysis: AIInspectionAnalysis = {
    id: `ai-${Date.now()}`,
    inspection_id: options.inspectionId,
    centre_id: options.centreId,
    centre_name: options.centreName || 'Assigned Training Centre',
    image_url: options.imageUrl,
    inference_engine: 'TensorFlow.js COCO-SSD (MobileNetV2)',
    inference_time_ms: inferenceTimeMs,
    detected_person_count: personCount,
    expected_attendance_count: expectedCount,
    discrepancy_detected: discrepancyDetected,
    detections: filteredDetections,
    human_reviewed: false,
    created_at: new Date().toISOString(),
  };

  // Persist to Supabase if available
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('ai_inspection_analysis').insert({
        inspection_id: options.inspectionId || null,
        centre_id: options.centreId,
        image_url: options.imageUrl,
        inference_engine: analysis.inference_engine,
        inference_time_ms: inferenceTimeMs,
        detected_person_count: personCount,
        expected_attendance_count: expectedCount,
        discrepancy_detected: discrepancyDetected,
        raw_detections: filteredDetections,
        human_reviewed: false,
      });
    } catch (err) {
      console.warn('Supabase AI log notice:', err);
    }
  }

  // Also save to local storage for persistence across reloads
  saveLocalAIAnalysis(analysis);

  return {
    analysis,
    detections: filteredDetections,
    inferenceTimeMs,
    personCount,
    equipmentCounts,
  };
}

const LOCAL_AI_KEY = 'skillwatch_ai_analyses_v1';

export function getLocalAIAnalyses(): AIInspectionAnalysis[] {
  try {
    const raw = localStorage.getItem(LOCAL_AI_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalAIAnalysis(analysis: AIInspectionAnalysis) {
  const existing = getLocalAIAnalyses();
  localStorage.setItem(LOCAL_AI_KEY, JSON.stringify([analysis, ...existing]));
}

export async function submitHumanVerdict(
  analysisId: string,
  verdict: 'approved' | 'rejected' | 'reassessed',
  notes: string
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('ai_inspection_analysis')
        .update({
          human_reviewed: true,
          human_verdict: verdict,
          human_notes: notes,
        })
        .eq('id', analysisId);
    } catch (err) {
      console.warn('Supabase human review notice:', err);
    }
  }

  const existing = getLocalAIAnalyses();
  const updated = existing.map(a =>
    a.id === analysisId
      ? { ...a, human_reviewed: true, human_verdict: verdict, human_notes: notes }
      : a
  );
  localStorage.setItem(LOCAL_AI_KEY, JSON.stringify(updated));
}

