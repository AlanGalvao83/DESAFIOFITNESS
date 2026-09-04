# -*- coding: utf-8 -*-
"""
Script Auxiliar: Contador Inteligente de Flexões Multi-Ângulo (MediaPipe Pose)
Detecta e valida flexões com alta precisão em vídeos gravados de perfil, diagonal, frontal ou superior.
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

def calculate_angle_2d(a, b, c):
    ab = np.array([a[0] - b[0], a[1] - b[1]])
    cb = np.array([c[0] - b[0], c[1] - b[1]])
    nab = ab / (np.linalg.norm(ab) + 1e-8)
    ncb = cb / (np.linalg.norm(cb) + 1e-8)
    cosang = np.clip(np.dot(nab, ncb), -1.0, 1.0)
    return float(np.degrees(np.arccos(cosang)))

class ArmTracker:
    def __init__(self, name, fps, down_thresh=102.0, up_thresh=139.0):
        self.name = name
        self.fps = fps
        self.down_thresh = down_thresh
        self.up_thresh = up_thresh
        self.stage = "UP"
        self.rep_count = 0
        self.smooth_angle = None
        self.down_frame = 0
        self.last_rep_frame = -100
        self.min_down_frames = max(2, int(0.14 * fps))
        self.min_rep_frames = max(6, int(0.48 * fps))
        self.angles = []

    def update(self, frame_idx, raw_angle):
        self.angles.append(raw_angle)
        if self.smooth_angle is None:
            self.smooth_angle = raw_angle
        else:
            self.smooth_angle = 0.45 * raw_angle + 0.55 * self.smooth_angle
            
        ang = self.smooth_angle
        if ang <= self.down_thresh:
            if self.stage != "DOWN":
                self.stage = "DOWN"
                self.down_frame = frame_idx
        elif ang >= self.up_thresh:
            if self.stage == "DOWN":
                if (frame_idx - self.down_frame) >= self.min_down_frames and (frame_idx - self.last_rep_frame) >= self.min_rep_frames:
                    self.rep_count += 1
                    self.last_rep_frame = frame_idx
                    self.stage = "UP"
                elif (frame_idx - self.last_rep_frame) >= self.min_rep_frames:
                    self.stage = "UP"
            else:
                self.stage = "UP"
        return self.smooth_angle

class FrontalDisplacementTracker:
    def __init__(self, fps):
        self.fps = fps
        self.stage = "UP"
        self.rep_count = 0
        self.smooth_disp = None
        self.down_frame = 0
        self.last_rep_frame = -100
        self.min_down_frames = max(2, int(0.18 * fps))
        self.min_rep_frames = max(8, int(0.52 * fps))

    def update(self, frame_idx, disp_y, min_elbow_angle):
        if self.smooth_disp is None:
            self.smooth_disp = disp_y
        else:
            self.smooth_disp = 0.35 * disp_y + 0.65 * self.smooth_disp
            
        disp = self.smooth_disp
        if (disp <= 0.24 and min_elbow_angle <= 125) or (min_elbow_angle <= 95):
            if self.stage != "DOWN":
                self.stage = "DOWN"
                self.down_frame = frame_idx
        elif (disp >= 0.35 and min_elbow_angle >= 135) or (min_elbow_angle >= 150):
            if self.stage == "DOWN":
                if (frame_idx - self.down_frame) >= self.min_down_frames and (frame_idx - self.last_rep_frame) >= self.min_rep_frames:
                    self.rep_count += 1
                    self.last_rep_frame = frame_idx
                    self.stage = "UP"
                elif (frame_idx - self.last_rep_frame) >= self.min_rep_frames:
                    self.stage = "UP"
            else:
                self.stage = "UP"
        return self.smooth_disp

def analyze_pushups(video_path):
    if not os.path.exists(video_path):
        print(f"Erro: Arquivo não encontrado: {video_path}")
        return 0

    cap = cv2.VideoCapture(video_path)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 640)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 480)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)

    l_tracker = ArmTracker("Braço Esquerdo", fps, down_thresh=102.0, up_thresh=139.0)
    r_tracker = ArmTracker("Braço Direito", fps, down_thresh=102.0, up_thresh=139.0)
    d_tracker = FrontalDisplacementTracker(fps)

    torso_dx_samples = []
    sh_dx_samples = []
    l_vis_samples = []
    r_vis_samples = []

    print(f"\nIniciando análise inteligente de: {Path(video_path).name}")
    print(f"Resolução: {width}x{height} @ {fps:.1f} FPS")

    f_idx = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        f_idx += 1

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb)

        if results.pose_landmarks:
            l = results.pose_landmarks.landmark
            p = lambda idx: (l[idx].x * width, l[idx].y * height)

            la = calculate_angle_2d(p(11), p(13), p(15))
            ra = calculate_angle_2d(p(12), p(14), p(16))

            lv = (l[11].visibility + l[13].visibility + l[15].visibility) / 3
            rv = (l[12].visibility + l[14].visibility + l[16].visibility) / 3

            sh_x = (l[11].x + l[12].x) / 2
            sh_y = (l[11].y + l[12].y) / 2
            hip_x = (l[23].x + l[24].x) / 2
            wy = (l[15].y + l[16].y) / 2

            torso_dx = abs(sh_x - hip_x)
            sh_dx = abs(l[11].x - l[12].x)
            disp_y = wy - sh_y

            torso_dx_samples.append(torso_dx)
            sh_dx_samples.append(sh_dx)
            l_vis_samples.append(lv)
            r_vis_samples.append(rv)

            l_tracker.update(f_idx, la)
            r_tracker.update(f_idx, ra)
            d_tracker.update(f_idx, disp_y, min(la, ra))

    cap.release()

    mean_torso_dx = np.mean(torso_dx_samples) if torso_dx_samples else 0.0
    mean_sh_dx = np.mean(sh_dx_samples) if sh_dx_samples else 0.0
    mean_l_vis = np.mean(l_vis_samples) if l_vis_samples else 0.0
    mean_r_vis = np.mean(r_vis_samples) if r_vis_samples else 0.0

    l_amp = np.percentile(l_tracker.angles, 90) - np.percentile(l_tracker.angles, 10) if l_tracker.angles else 0
    r_amp = np.percentile(r_tracker.angles, 90) - np.percentile(r_tracker.angles, 10) if r_tracker.angles else 0

    # Decisão de Perspectiva e Seleção de Rastreador
    if mean_torso_dx > 0.35:
        mode_str = "Perfil Lateral"
        chosen_reps = l_tracker.rep_count if mean_l_vis >= mean_r_vis else r_tracker.rep_count
        dominant_arm = "Esquerdo" if mean_l_vis >= mean_r_vis else "Direito"
    elif mean_sh_dx > 0.50 and abs(mean_l_vis - mean_r_vis) < 0.20:
        mode_str = "Frontal (De Frente)"
        chosen_reps = d_tracker.rep_count
        dominant_arm = "Deslocamento Vertical do Torso"
    else:
        mode_str = "Diagonal / Superior"
        chosen_reps = l_tracker.rep_count if l_amp >= r_amp else r_tracker.rep_count
        dominant_arm = "Esquerdo" if l_amp >= r_amp else "Direito"

    print(f"Perspectiva da Câmera Identificada: {mode_str}")
    print(f"Rastreador Selecionado: {dominant_arm}")
    print(f"Contagens por Rastreador -> Esquerdo: {l_tracker.rep_count} | Direito: {r_tracker.rep_count} | Deslocamento Torso: {d_tracker.rep_count}")
    print(f"Total Final de Flexões Válidas: {chosen_reps}")
    return chosen_reps

if __name__ == "__main__":
    default_folder = r"C:\Users\ALAN\Documents\PROJETOS\DESAFIOFITNESS\VIDEOS DE TREINO"
    video_files = sorted(list(Path(default_folder).glob("*.mp4"))) if os.path.exists(default_folder) else []

    if len(sys.argv) > 1:
        target = sys.argv[1]
        analyze_pushups(target)
    elif video_files:
        print(f"Processando todos os {len(video_files)} vídeos da pasta VIDEOS DE TREINO...\n")
        total_reps = 0
        for vf in video_files:
            reps = analyze_pushups(str(vf))
            total_reps += reps
            print("-" * 60)
        print(f"\nConcluído! Total acumulado de flexões em todos os vídeos: {total_reps}")
    else:
        print("Uso: python analisador_flexoes.py <video>")
        sys.exit(0)