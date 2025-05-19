# prediction/views.py

import os
import numpy as np
import pandas as pd
import joblib
import tensorflow as tf
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse

from training.models import TrainingDay

# 1) Raw feature names
RAW_FEATURES = [
    'nr_sessions','total_km','km_z3_4','km_z5_t1_t2','km_sprinting',
    'strength_training','hours_alternative',
    'perceived_exertion','perceived_training_success','perceived_recovery',
]

# 2) Build the full FEATURE_COLS ordering
FEATURE_COLS = []
FEATURE_COLS += RAW_FEATURES
for feat in RAW_FEATURES:
    FEATURE_COLS += [
        f'{feat}_mean7', f'{feat}_std7',
        f'{feat}_min7',  f'{feat}_max7',
        f'{feat}_delta', f'{feat}_ratio',
    ]

# 3) Load global z-score parameters and model
BASE_DIR    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEPLOY_DIR  = os.path.join(BASE_DIR, 'deployment')

GLOBAL_MEAN = joblib.load(os.path.join(DEPLOY_DIR, 'global_mean.pkl'))
GLOBAL_STD  = joblib.load(os.path.join(DEPLOY_DIR, 'global_std.pkl'))
GLOBAL_STD[GLOBAL_STD == 0] = 1.0

imported   = tf.saved_model.load(os.path.join(DEPLOY_DIR, 'saved_model'))
infer      = imported.signatures["serving_default"]

with open(os.path.join(DEPLOY_DIR, 'best_threshold.txt')) as f:
    BEST_THRESHOLD = float(f.read())

# 4) Temporal feature function
def add_temporal_features(df, window=7):
    df = df.sort_values('date').copy()
    for c in RAW_FEATURES:
        df[f'{c}_mean{window}'] = df[c].rolling(window,1).mean()
        df[f'{c}_std{window}']  = df[c].rolling(window,1).std().fillna(0)
        df[f'{c}_min{window}']  = df[c].rolling(window,1).min()
        df[f'{c}_max{window}']  = df[c].rolling(window,1).max()
        df[f'{c}_delta']       = df[c].diff().fillna(0)
        m = df[f'{c}_mean{window}']
        df[f'{c}_ratio']       = df[c] / (m + 1e-6)
    return df

# 5) Prediction endpoint
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def predict_injury(request):
    user = request.user
    today   = timezone.now().date()
    weekago = today - timezone.timedelta(days=7)

    # 5.1) Fetch last 7 days
    qs = TrainingDay.objects.filter(
        user=user,
        date__gt=weekago,
        date__lte=today
    ).order_by('date').values('date', *RAW_FEATURES)

    # return 0 zero for if none exist
    if not qs.exists():
        return JsonResponse({'injury_risk': False, 'probability': 0.0})
    
    df = pd.DataFrame(qs)

    # 5.2) Pad or convert date *after* building df
    if len(df) < 7:
        n = 7 - len(df)
        pad = pd.DataFrame([{c:0.0 for c in RAW_FEATURES} for _ in range(n)])
        start = df['date'].min() if not df.empty else today
        pad['date'] = pd.date_range(end=start - pd.Timedelta(days=1), periods=n)
        df = pd.concat([pad, df], ignore_index=True)

    # 5.3) Now date column always exists—cast to datetime
    df['date'] = pd.to_datetime(df['date'])

    # 5.4) Add rolling / delta / ratio features
    df2 = add_temporal_features(df)

    # 5.5) Build raw matrix
    X_raw = df2[FEATURE_COLS].to_numpy(dtype=np.float32)

    # 5.6) Global z-score
    flat    = X_raw.reshape(-1, len(FEATURE_COLS))
    z       = (flat - GLOBAL_MEAN) / GLOBAL_STD
    z = np.clip(z, -6, 6)

    # 5.7) Reshape for model
    X_input = z.reshape((1,7,len(FEATURE_COLS))).astype(np.float32)

    # 5.8) Inference
    key_in   = list(infer.structured_input_signature[1].keys())[0]
    out      = infer(tf.constant(X_input, name=key_in))
    key_out  = list(out.keys())[0]
    prob     = float(out[key_out].numpy()[0][0])
    risk     = prob >= BEST_THRESHOLD

    return JsonResponse({
        'injury_risk': risk,
        'probability': prob,
    })
