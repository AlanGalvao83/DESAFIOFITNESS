# -*- coding: utf-8 -*-
"""
Script Auxiliar: Contador Inteligente de Flexoes via Terminal (MediaPipe Pose)
Permite processar videos locais (como os de VIDEOS DE TREINO) via linha de comando.
"""
import sys
import os
import math
from pathlib import Path

try:
    import cv2
    import numpy as np
    import mediapipe as mp
except ImportError:
    print("Aviso: Para rodar este script Python no terminal, instale os pacotes:")
    print("  pip install opencv-python mediapipe numpy")
    sys.exit(1)

def calculate_angle(a, b, c):
    ab = np.array([a[0] - b[0], a[1] - b[1]])
    cb = np.array([c[0] - b[0], c[1] - b[1]])
    nab = ab / (np.linalg.norm(ab) + 1e-8)
    ncb = cb / (np.linalg.norm(cb) + 1e-8)
    cosang = np.clip(np.dot(nab, ncb), -1.0, 1.0)
    return float(np.degrees(np.arccos(cosang)))

def analyze_pushups(video_path):
    if not os.path.exists(video_path):
        print(f"Erro: Arquivo nao encontrado: {video_path}")
        return 0

    cap = cv2.VideoCapture(video_path)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 640)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 480)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)

    rep_count = 0
    stage = "UP"

    print(f"\nIniciando analise de: {Path(video_path).name}")
    print(f"Resolucao: {width}x{height} @ {fps:.1f} FPS")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb)

        if results.pose_landmarks:
            lms = results.pose_landmarks.landmark
            def pt(idx):
                return (int(lms[idx].x * width), int(lms[idx].y * height))

            l_vis = (lms[11].visibility + lms[13].visibility + lms[15].visibility) / 3
            r_vis = (lms[12].visibility + lms[14].visibility + lms[16].visibility) / 3

            if l_vis >= r_vis:
                shoulder, elbow, wrist = pt(11), pt(13), pt(15)
            else:
                shoulder, elbow, wrist = pt(12), pt(14), pt(16)

            elbow_angle = calculate_angle(shoulder, elbow, wrist)

            if elbow_angle <= 95:
                if stage != "DOWN":
                    stage = "DOWN"
            elif elbow_angle >= 155:
                if stage == "DOWN":
                    rep_count += 1
                    stage = "UP"
                    print(f"  [REP {rep_count}] Validada! Angulo: {elbow_angle:.1f} deg")

    cap.release()
    print(f"\nAnalise concluida! Total de flexoes validas: {rep_count}")
    return rep_count

if __name__ == "__main__":
    default_folder = r"C:\Users\ALAN\Documents\PROJETOS\DESAFIOFITNESS\VIDEOS DE TREINO"
    video_files = list(Path(default_folder).glob("*.mp4")) if os.path.exists(default_folder) else []

    if len(sys.argv) > 1:
        target = sys.argv[1]
    elif video_files:
        target = str(video_files[0])
    else:
        print("Uso: python analisador_flexoes.py <video>")
        sys.exit(0)

    analyze_pushups(target)