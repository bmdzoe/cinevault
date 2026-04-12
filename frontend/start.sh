#!/bin/bash
cd frontend && npm install && npm run build && cd ..
gunicorn run:app --bind 0.0.0.0:8080