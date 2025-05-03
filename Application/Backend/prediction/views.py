# prediction/views.py
import os
import numpy as np
import tensorflow as tf
from django.http import JsonResponse

# Paths
BASE_DIR    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEPLOY_DIR  = os.path.join(BASE_DIR, 'deployment')
SAVED_MODEL = os.path.join(DEPLOY_DIR, 'saved_model')
THRESH_PATH = os.path.join(DEPLOY_DIR, 'best_threshold.txt')

# 1) Load the raw SavedModel (not via keras.load_model)
imported = tf.saved_model.load(SAVED_MODEL)

# 2) Grab the serving_default function
infer = imported.signatures["serving_default"]

# 3) Load threshold
with open(THRESH_PATH, 'r') as f:
    BEST_THRESHOLD = float(f.read())

def predict_injury(request):
    # 🔢 Dummy input: shape (1, 7, 70)
    X_input = np.random.rand(1, 7, 70).astype(np.float32)
    
    # 4) Build a tf.constant with the correct input key
    #    Inspect the signature’s input name if needed. It's often "input_1" or similar.
    #    Let’s fetch it programmatically:
    input_key = list(infer.structured_input_signature[1].keys())[0]
    
    # 5) Call the signature
    result = infer(tf.constant(X_input, dtype=tf.float32, name=input_key))
    
    # 6) Extract the output tensor (usually the only key in result)
    output_key = list(result.keys())[0]
    prob = result[output_key].numpy()[0][0]
    
    injury_risk = prob >= BEST_THRESHOLD

    return JsonResponse({
        'injury_risk': bool(injury_risk),
        'probability': float(prob)
    })