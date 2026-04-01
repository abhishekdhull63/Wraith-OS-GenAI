import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import Webcam from 'react-webcam';

// Need to safely handle process.env for Vite vs CRA
const PUBLIC_URL = typeof process !== 'undefined' && process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '';

interface BiometricOverwatchProps {
  onEmergencyLock: () => void;
}

export default function BiometricOverwatch({ onEmergencyLock }: BiometricOverwatchProps) {
  const webcamRef = useRef<Webcam>(null);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const fearCounterRef = useRef<number>(0);
  const isPredictingRef = useRef<boolean>(false);

  // Load the model on mount
  useEffect(() => {
    let isMounted = true;

    async function loadModel() {
      try {
        await tf.ready();
        
        // As per instructions, load the custom converted model:
        const modelUrl = `${PUBLIC_URL}/tfjs_emotion_model/model.json`;
        console.log(`[BiometricOverwatch] Loading model from ${modelUrl}`);
        
        const loadedModel = await tf.loadLayersModel(modelUrl);
        
        // "Warm up" the model with a dummy tensor
        tf.tidy(() => {
          loadedModel.predict(tf.zeros([1, 224, 224, 3]));
        });

        if (isMounted) {
          console.log('[BiometricOverwatch] Model loaded successfully');
          setModel(loadedModel);
        }
      } catch (err) {
        console.error('[BiometricOverwatch] Error loading the model. Ensure the conversion script was run.', err);
      }
    }

    loadModel();

    return () => {
      isMounted = false;
    };
  }, []);

  // Inference loop every 500ms
  useEffect(() => {
    if (!model) return;

    const intervalId = setInterval(async () => {
      // Prevent overlapping predictions
      if (isPredictingRef.current) return;
      
      const imageElement = webcamRef.current?.video;
      if (!imageElement || imageElement.readyState !== 4) return;

      isPredictingRef.current = true;

      try {
        // Use tf.tidy to automatically clean up tensors and prevent memory leaks
        const isFearTriggered = tf.tidy(() => {
          // 1. Capture frame to tensor
          let tensor = tf.browser.fromPixels(imageElement);
          
          // 2. Resize to the dimensions required by FER2013 MobileNetV2 (224x224)
          tensor = tf.image.resizeBilinear(tensor, [224, 224]);
          
          // 3. Normalize if necessary (MobileNetV2 typically expects values between -1 and 1 or 0 and 1)
          // Adjust based on how your specific Keras model was trained. 
          // Here we assume standard MobileNetV2 preprocessing (pixel values / 127.5 - 1)
          tensor = tensor.div(tf.scalar(127.5)).sub(tf.scalar(1));
          
          // 4. Expand dimensions to create a batch of 1
          const batchedTensor = tensor.expandDims(0);
          
          // 5. Predict
          const prediction = model.predict(batchedTensor) as tf.Tensor;
          const scores = prediction.dataSync(); // Outputs array of 7 emotion probabilities
          
          // 6. Index 4 is "Fear"
          const fearScore = scores[4];
          
          // Debug (uncomment to see scores)
          // console.log(`[BiometricOverwatch] Fear probability: ${(fearScore * 100).toFixed(1)}%`);
          
          return fearScore > 0.75;
        });

        // Update counter based on fear threshold
        if (isFearTriggered) {
          fearCounterRef.current++;
          console.warn(`[BiometricOverwatch] High fear detected! Sequence: ${fearCounterRef.current}/3`);
          
          if (fearCounterRef.current >= 3) {
            console.error('[BiometricOverwatch] EMOTIONAL DISTRESS THRESHOLD MET. TRIGGERING LOCKDOWN.');
            fearCounterRef.current = 0; // Reset counter after trigger
            onEmergencyLock();
          }
        } else {
          // Reset if consecutive sequence is broken
          fearCounterRef.current = 0;
        }

      } catch (err) {
        console.error('[BiometricOverwatch] Inference error:', err);
      } finally {
        isPredictingRef.current = false;
      }
    }, 500);

    return () => clearInterval(intervalId);
  }, [model, onEmergencyLock]);

  // Render hidden webcam
  return (
    <div className="absolute -left-[9999px] opacity-0 pointer-events-none aria-hidden">
      <Webcam
        ref={webcamRef}
        audio={false}
        width={224}
        height={224}
        videoConstraints={{
          width: 224,
          height: 224,
          facingMode: 'user',
        }}
        onUserMediaError={(err) => console.error('[BiometricOverwatch] Webcam access denied/failed:', err)}
      />
    </div>
  );
}
