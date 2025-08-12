# RunSafe

RunSafe is an application for monitoring running activity and predicts potential injury, the applicaiton utilises Bi-directional LSTM to predict injury and is built on React frontend and Django backend

# Purpose
This application was developed in order to provide a more accessible method for injury prediction. 

Most effective researches using Machine Learning to predict relies on lab obtained data such as genetic markers and biomechanics, while regular training data have been used to train models, they have been less effective. The model developed is based on the Bi-LSTM architecture to utilise weekly, time-series training data easily obtainable through Strava, an already popular application where users have continuous records.

The web application integrates the machine learning model in order to provide real time injury prediction whenever the user updates trainning record, on top of this, it provides visualisation to breakdown training volume and intensity over the past week to help user make adjustments to training, and forsee possible injury based on personal intuition.

## Features

- Provide users insight into training quality and training volume over the last 7 days
- Strava OAuth2.0 integration allowing users to sync data with their Strava account
- Provide injury prediction using LSTM model with AUC of 0.81

