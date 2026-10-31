import os
import sys
import time
import math
import struct
import wave
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Set paths
WORKSPACE = r"c:\Users\dell\Desktop\AfterHours"
ARTIFACT_DIR = r"C:\Users\dell\.gemini\antigravity\brain\45362c51-52a4-425f-95d4-3809c4b92183"
OUTPUT_VIDEO = os.path.join(WORKSPACE, "AEGIS_AGENT_Complete_Project_Presentation.mp4")
TEMP_AUDIO = os.path.join(WORKSPACE, "temp_soundtrack.wav")
FFMPEG_EXE = r"C:\Users\dell\AppData\Local\Programs\Python\Python310\lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"

# Video specs: 3 minutes exactly (180s) @ 24fps
TOTAL_SECONDS = 180.0
FPS = 24
TOTAL_FRAMES = int(TOTAL_SECONDS * FPS) # 4320 frames
WIDTH = 1280
HEIGHT = 720
SAMPLE_RATE = 44100

print(f"=== AEGIS-AGENT 3-MINUTE PRESENTATION VIDEO GENERATOR ===")
print(f"Resolution: {WIDTH}x{HEIGHT} @ {FPS}fps | Total Frames: {TOTAL_FRAMES} | Duration: {TOTAL_SECONDS}s")

# Load fonts
try:
    font_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 32)
    font_subtitle = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 20)
    font_sub_sec = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 17)
    font_heading = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 24)
    font_body = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 16)
    font_mono = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 15)
    font_mono_bold = ImageFont.truetype("C:/Windows/Fonts/consolab.ttf", 16)
    font_small = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 12)
    font_badge = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 11)
except Exception as e:
    print(f"Font loading error, using default: {e}")
    font_title = font_subtitle = font_sub_sec = font_heading = font_body = font_mono = font_mono_bold = font_small = font_badge = ImageFont.load_default()

# -------------------------------------------------------------
# 1. AUDIO SYNTHESIS ENGINE
# -------------------------------------------------------------
def synthesize_soundtrack(out_wav=TEMP_AUDIO, duration=180.0, sr=44100):
    print(f"[1/3] Synthesizing 180.0s multi-track electronic cyber soundtrack...")
    t0 = time.time()
    n_samples = int(duration * sr)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    
    # 1. Sub-bass drone (55Hz / 110Hz with harmonic movement)
    bass_freqs = [55.0, 55.0, 48.99, 43.65, 41.20, 48.99, 55.0, 65.41, 48.99, 43.65, 55.0, 55.0]
    bass_wave = np.zeros(n_samples)
    seg_samples = n_samples // 12
    for i, bf in enumerate(bass_freqs):
        idx_start = i * seg_samples
        idx_end = (i + 1) * seg_samples if i < 11 else n_samples
        t_seg = t[idx_start:idx_end]
        sub = 0.22 * np.sin(2 * np.pi * bf * t_seg) + 0.12 * np.sin(2 * np.pi * (bf * 2) * t_seg)
        bass_wave[idx_start:idx_end] = sub
    
    # 2. Tech Kick & Hi-hat (120 BPM = 2 beats / sec)
    bpm = 120.0
    beat_sec = 60.0 / bpm # 0.5 sec
    t_beat = np.mod(t, beat_sec)
    
    # Kick on every beat
    kick_env = np.exp(-t_beat / 0.08)
    kick_freq = 140 * np.exp(-t_beat / 0.04) + 42
    kick = 0.38 * np.sin(2 * np.pi * kick_freq * t_beat) * kick_env
    
    # Hi-hat on 8th notes (every 0.25 sec)
    t_hat = np.mod(t, beat_sec / 2.0)
    hat_env = np.exp(-t_hat / 0.02)
    hat_noise = np.random.uniform(-1, 1, n_samples)
    hat = 0.12 * hat_noise * hat_env
    
    # Clap / Snare on beat 2 and 4 (every 1.0 sec offset by 0.5s)
    t_snare = np.mod(t - 0.5, 1.0)
    snare_env = np.exp(-t_snare / 0.09) * (t_snare < 0.25)
    snare_noise = np.random.uniform(-1, 1, n_samples)
    snare = 0.20 * snare_noise * snare_env
    
    # 3. High-tech Synth Pad Chords (Stereo ping-pong / detune)
    pad_left = np.zeros(n_samples)
    pad_right = np.zeros(n_samples)
    
    # Chord progressions across 12 chapters (each 15s)
    # Roots: Am (220, 261, 329), F (174, 220, 261), C (196, 261, 329), G (196, 246, 293), etc.
    chords = [
        [220.0, 261.63, 329.63, 392.00], # Am7
        [174.61, 220.00, 261.63, 329.63], # Fmaj7
        [196.00, 246.94, 293.66, 392.00], # G
        [146.83, 174.61, 220.00, 261.63], # Dm7
        [220.0, 261.63, 329.63, 392.00], # Am7
        [174.61, 220.00, 261.63, 329.63], # Fmaj7
        [146.83, 174.61, 220.00, 293.66], # Dm (Red alert tension)
        [155.56, 185.00, 220.00, 311.13], # D#dim (Sentinel exploit verification)
        [174.61, 220.00, 261.63, 329.63], # Fmaj7 (Fix synthesis)
        [196.00, 246.94, 293.66, 392.00], # G (Auditor regression)
        [261.63, 329.63, 392.00, 493.88], # Cmaj7 (Attack Graph governance)
        [220.0, 261.63, 329.63, 440.00]  # A heroic resolution
    ]
    
    for i, chord in enumerate(chords):
        idx_start = i * seg_samples
        idx_end = (i + 1) * seg_samples if i < 11 else n_samples
        t_seg = t[idx_start:idx_end]
        
        # Soft envelope for each chapter
        seg_dur = (idx_end - idx_start) / sr
        t_local = t_seg - t_seg[0]
        chord_env = np.sin(np.pi * np.clip(t_local / seg_dur, 0, 1))
        
        sig_l = np.zeros(len(t_seg))
        sig_r = np.zeros(len(t_seg))
        for freq in chord:
            sig_l += 0.05 * np.sin(2 * np.pi * (freq * 0.998) * t_seg)
            sig_r += 0.05 * np.sin(2 * np.pi * (freq * 1.002) * t_seg)
        pad_left[idx_start:idx_end] = sig_l * chord_env
        pad_right[idx_start:idx_end] = sig_r * chord_env
        
    # 4. Sound Effects & Scene Transitions (Whooshes, Chirps, Red Alert, Victory Chime)
    sfx_l = np.zeros(n_samples)
    sfx_r = np.zeros(n_samples)
    
    # Scene risers at 15s intervals
    for sc in range(12):
        t_trans = sc * 15.0
        if t_trans > 0:
            idx_trans = int(t_trans * sr)
            # 1.2s whoosh leading up to transition
            len_trans = int(1.2 * sr)
            idx_w_start = max(0, idx_trans - len_trans)
            t_w = np.linspace(0, 1.2, idx_trans - idx_w_start)
            sweep = np.random.uniform(-0.15, 0.15, len(t_w)) * (t_w / 1.2)**2
            sfx_l[idx_w_start:idx_trans] += sweep
            sfx_r[idx_w_start:idx_trans] += sweep
            
            # High frequency chirp at scene arrival
            len_chirp = int(0.15 * sr)
            if idx_trans + len_chirp < n_samples:
                t_c = np.linspace(0, 0.15, len_chirp)
                chirp_env = np.exp(-t_c / 0.03)
                chirp = 0.15 * np.sin(2 * np.pi * (1800 + 1200 * t_c) * t_c) * chirp_env
                sfx_l[idx_trans:idx_trans + len_chirp] += chirp
                sfx_r[idx_trans:idx_trans + len_chirp] += chirp
    
    # Red Agent Alarm Pulse at 90s - 105s (Scene 7)
    idx_red_start = int(90.0 * sr)
    idx_red_end = int(105.0 * sr)
    t_red = t[idx_red_start:idx_red_end]
    red_pulse = np.mod(t_red - 90.0, 1.0)
    red_alarm_env = np.exp(-red_pulse / 0.15) * (red_pulse < 0.3)
    red_tone = 0.16 * (np.sin(2 * np.pi * 880 * t_red) + 0.5 * np.sin(2 * np.pi * 1100 * t_red)) * red_alarm_env
    sfx_l[idx_red_start:idx_red_end] += red_tone
    sfx_r[idx_red_start:idx_red_end] += red_tone
    
    # Auditor Victory Triad Chime at 145s (Scene 10)
    idx_vic = int(145.0 * sr)
    len_vic = int(3.5 * sr)
    t_vic = np.linspace(0, 3.5, len_vic)
    vic_env = np.exp(-t_vic / 0.8)
    vic_chime = (0.12 * np.sin(2 * np.pi * 1046.5 * t_vic) + # C6
                 0.10 * np.sin(2 * np.pi * 1318.5 * t_vic) + # E6
                 0.10 * np.sin(2 * np.pi * 1567.9 * t_vic)) * vic_env # G6
    sfx_l[idx_vic:idx_vic + len_vic] += vic_chime
    sfx_r[idx_vic:idx_vic + len_vic] += vic_chime
    
    # Master Mix
    mix_left = bass_wave + kick + hat + snare + pad_left + sfx_l
    mix_right = bass_wave + kick + hat + snare + pad_right + sfx_r
    
    # Smooth Fade In (2s) and Fade Out (3s)
    fade_in_len = int(2.0 * sr)
    fade_in = np.linspace(0, 1, fade_in_len)
    mix_left[:fade_in_len] *= fade_in
    mix_right[:fade_in_len] *= fade_in
    
    fade_out_len = int(3.0 * sr)
    fade_out = np.linspace(1, 0, fade_out_len)
    mix_left[-fade_out_len:] *= fade_out
    mix_right[-fade_out_len:] *= fade_out
    
    # Peak normalization to -1.0 dB (0.89)
    peak = max(np.max(np.abs(mix_left)), np.max(np.abs(mix_right)))
    if peak > 0:
        norm_factor = 0.88 / peak
        mix_left *= norm_factor
        mix_right *= norm_factor
        
    int_left = np.int16(mix_left * 32767)
    int_right = np.int16(mix_right * 32767)
    stereo_interleaved = np.empty((n_samples * 2,), dtype=np.int16)
    stereo_interleaved[0::2] = int_left
    stereo_interleaved[1::2] = int_right
    
    with wave.open(out_wav, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(stereo_interleaved.tobytes())
        
    print(f"Soundtrack generated: {out_wav} ({time.time() - t0:.2f}s)")
    return out_wav

# -------------------------------------------------------------
# 2. IMAGE ASSETS CACHE & PREPARATION
# -------------------------------------------------------------
print("[2/3] Loading and caching UI screenshots...")

def safe_load_img(name):
    # Try artifact dir then workspace
    p1 = os.path.join(ARTIFACT_DIR, name)
    p2 = os.path.join(WORKSPACE, name)
    p = p1 if os.path.exists(p1) else (p2 if os.path.exists(p2) else None)
    if p and os.path.exists(p):
        return Image.open(p).convert("RGB")
    return None

ui_landing = safe_load_img("ui_friendly_landing.png")
ui_overview = safe_load_img("ui_overview_screenshot.png")
ui_research = safe_load_img("ui_research_perfected.png")
ui_warroom = safe_load_img("ui_friendly_warroom.png")
ui_finding = safe_load_img("ui_findingdetail_screenshot.png")
ui_diff = safe_load_img("ui_warroom_final.png")
ui_attack = safe_load_img("ui_attackpath_screenshot.png")

# Fallback generator if any image missing
def create_fallback_card(title, desc):
    fb = Image.new("RGB", (1100, 520), (15, 20, 30))
    d = ImageDraw.Draw(fb)
    d.rectangle([0, 0, 1100, 520], outline=(0, 240, 255), width=2)
    d.text((50, 40), title, font=font_title, fill=(0, 255, 136))
    d.text((50, 100), desc, font=font_subtitle, fill=(220, 230, 240))
    return fb

if not ui_landing: ui_landing = create_fallback_card("AEGIS-AGENT Platform", "Autonomous Security Operations")
if not ui_overview: ui_overview = create_fallback_card("System Overview", "Metrics and Real-time Telemetry")
if not ui_research: ui_research = create_fallback_card("Target Research", "AST Ingestion & Attack Surface Discovery")
if not ui_warroom: ui_warroom = create_fallback_card("Live War Room", "Autonomous Multi-Agent Orchestration")
if not ui_finding: ui_finding = create_fallback_card("Finding Detail", "Stack Trace & Exploit Verification")
if not ui_diff: ui_diff = create_fallback_card("AI Patch Synthesis", "Unified Git Diff & Prepared Statement")
if not ui_attack: ui_attack = create_fallback_card("Attack Graph", "Blast Radius & Topological Risk Mapping")

# Helper to draw browser mock frame
def draw_mock_window(base_img, inner_img, box=(90, 60, 1190, 595), title="AEGIS-AGENT SEC-OPS CONSOLE"):
    bx, by, bw, bh = box[0], box[1], box[2] - box[0], box[3] - box[1]
    d = ImageDraw.Draw(base_img)
    # Window glow & shadow
    d.rectangle([bx-2, by-2, bx+bw+2, by+bh+2], outline=(0, 120, 200), width=1)
    d.rectangle([bx, by, bx+bw, by+bh], fill=(13, 17, 26), outline=(30, 42, 60), width=2)
    # Window titlebar
    d.rectangle([bx, by, bx+bw, by+28], fill=(18, 24, 38))
    # Window dots
    d.ellipse([bx+10, by+8, bx+20, by+18], fill=(255, 95, 86))
    d.ellipse([bx+26, by+8, bx+36, by+18], fill=(255, 189, 46))
    d.ellipse([bx+42, by+8, bx+52, by+18], fill=(39, 201, 63))
    d.text((bx+65, by+6), title, font=font_badge, fill=(140, 160, 180))
    d.text((bx+bw-160, by+6), "SEC-LOCAL-8080 | ACTIVE", font=font_badge, fill=(0, 255, 136))
    
    # Fit inner image into window content area
    cx, cy, cw, ch = bx+2, by+29, bw-4, bh-31
    if inner_img:
        # Scale to fit width while maintaining aspect
        iw, ih = inner_img.size
        scale = max(cw / iw, ch / ih)
        nw, nh = int(iw * scale), int(ih * scale)
        resized = inner_img.resize((nw, nh), Image.Resampling.BILINEAR)
        # Crop to fit
        crop_x = max(0, (nw - cw) // 2)
        crop_y = min(max(0, (nh - ch) // 4), max(0, nh - ch))
        cropped = resized.crop((crop_x, crop_y, crop_x + cw, crop_y + ch))
        base_img.paste(cropped, (cx, cy))
        
    # Inner border line
    d.rectangle([cx, cy, cx+cw, cy+ch], outline=(25, 38, 55), width=1)

# Helper to draw dynamic text with drop-shadow form
def draw_shadow_text(draw, pos, text, font, fill=(255, 255, 255), shadow_fill=(0, 0, 0)):
    x, y = pos
    # Deep outer multi-layer drop shadow
    for dx, dy in [(3, 3), (2, 2), (1, 1), (-1, 1), (1, -1), (2, 0), (0, 2)]:
        draw.text((x + dx, y + dy), text, font=font, fill=shadow_fill)
    draw.text((x, y), text, font=font, fill=fill)

# Helper to draw Top HUD
def draw_top_hud(draw, t, chapter_title, scene_idx):
    # Top bar background
    draw.rectangle([0, 0, WIDTH, 48], fill=(9, 13, 21))
    draw.line([(0, 48), (WIDTH, 48)], fill=(0, 240, 255), width=1)
    
    # Red Shield Icon & Platform Logo
    draw.polygon([(16, 12), (32, 12), (36, 26), (24, 38), (12, 26)], fill=(255, 45, 85))
    draw.polygon([(18, 14), (30, 14), (33, 25), (24, 35), (15, 25)], fill=(180, 20, 50))
    draw.text((22, 15), "A", font=font_small, fill=(255, 255, 255))
    
    # Title & Version Badge
    draw.text((45, 12), "AEGIS-AGENT", font=font_heading, fill=(255, 255, 255))
    draw.rectangle([200, 14, 280, 34], fill=(0, 40, 25), outline=(0, 255, 136), width=1)
    draw.text((207, 17), "CYBER V2.4", font=font_badge, fill=(0, 255, 136))
    
    # Current Active Module / Chapter
    draw.rectangle([300, 14, 680, 34], fill=(15, 22, 35), outline=(30, 50, 80), width=1)
    draw.text((312, 17), f"MODULE: {chapter_title.upper()}", font=font_badge, fill=(0, 240, 255))
    
    # Right-hand Telemetry HUD
    mins = int(t) // 60
    secs = int(t) % 60
    time_str = f"{mins:02d}:{secs:02d} / 03:00"
    draw.text((WIDTH - 420, 16), "● ONLINE | SANDBOX: SEC-LOCAL-8080", font=font_small, fill=(0, 255, 136))
    draw.rectangle([WIDTH - 150, 13, WIDTH - 16, 35], fill=(16, 22, 34), outline=(0, 240, 255), width=1)
    draw.text((WIDTH - 140, 16), time_str, font=font_mono_bold, fill=(255, 255, 255))

# Helper to draw Bottom Subtitle & Progress HUD
def draw_bottom_subtitle_hud(draw, t, chapter_badge, line1, line2, highlight_terms=[]):
    # Subtitle glassmorphism card
    draw.rectangle([0, 608, WIDTH, HEIGHT], fill=(8, 12, 20))
    # Glowing top accent line
    draw.line([(0, 608), (WIDTH, 608)], fill=(0, 240, 255), width=2)
    draw.line([(0, 610), (WIDTH, 610)], fill=(0, 80, 120), width=1)
    
    # Chapter indicator badge
    draw.rectangle([24, 620, 280, 642], fill=(14, 25, 40), outline=(0, 200, 255), width=1)
    draw.text((32, 624), chapter_badge.upper(), font=font_badge, fill=(0, 240, 255))
    
    # Dynamic text with shadow form
    # Line 1 (Main assertion)
    draw_shadow_text(draw, (300, 618), line1, font=font_subtitle, fill=(255, 255, 255))
    
    # Line 2 (Technical explanation / detail)
    draw_shadow_text(draw, (300, 648), line2, font=font_sub_sec, fill=(180, 215, 245))
    
    # Live frame progress track (at y=715, height 5px)
    progress_ratio = min(1.0, max(0.0, t / TOTAL_SECONDS))
    bar_width = int(WIDTH * progress_ratio)
    draw.rectangle([0, 715, WIDTH, 720], fill=(20, 30, 45))
    if bar_width > 0:
        draw.rectangle([0, 715, bar_width, 720], fill=(0, 255, 136))
        # Glowing head
        draw.rectangle([max(0, bar_width - 8), 714, bar_width, 720], fill=(255, 255, 255))

# -------------------------------------------------------------
# 3. INDIVIDUAL CHAPTER RENDERERS (12 Chapters x 15s each = 180s)
# -------------------------------------------------------------

# Ch 01: Platform Identity & Mission (0s - 15s)
def render_chapter_1(draw, img, t, t_local):
    # Futuristic Hex Grid Background
    for x in range(0, WIDTH, 80):
        draw.line([(x, 50), (x, 608)], fill=(14, 20, 32), width=1)
    for y in range(50, 608, 60):
        draw.line([(0, y), (WIDTH, y)], fill=(14, 20, 32), width=1)
        
    # Animated Radar scan sweep
    sweep_x = int((t_local / 15.0) * WIDTH)
    draw.line([(sweep_x, 50), (sweep_x, 608)], fill=(0, 240, 255), width=2)
    
    # Central Platform Shield Banner
    cx, cy = 640, 310
    # Shield Outer Glow
    for r in range(12, 0, -2):
        draw.polygon([(cx-90-r, cy-120-r), (cx+90+r, cy-120-r), (cx+115+r, cy+10), (cx, cy+150+r), (cx-115-r, cy+10)],
                     outline=(0, 80 + r*12, 120 + r*10), width=1)
    # Shield Core
    draw.polygon([(cx-90, cy-120), (cx+90, cy-120), (cx+115, cy+10), (cx, cy+150), (cx-115, cy+10)],
                 fill=(16, 24, 38), outline=(0, 255, 136), width=3)
    # Inner Emblem
    draw.polygon([(cx-60, cy-90), (cx+60, cy-90), (cx+75, cy), (cx, cy+110), (cx-75, cy)],
                 fill=(22, 34, 54), outline=(0, 240, 255), width=2)
    draw_shadow_text(draw, (cx-42, cy-65), "AEGIS", font_heading, fill=(0, 255, 136))
    draw_shadow_text(draw, (cx-35, cy-25), "AGENT", font_title, fill=(255, 255, 255))
    draw.text((cx-52, cy+35), "CYBER SEC-OPS", font=font_small, fill=(0, 240, 255))
    
    # Title & Mission Text
    draw_shadow_text(draw, (180, 110), "AEGIS-AGENT AUTONOMOUS CYBERSECURITY", font_title, fill=(255, 255, 255))
    draw_shadow_text(draw, (230, 155), "Multi-Agent AI Application Security & Self-Healing Pipeline", font_heading, fill=(0, 240, 255))
    
    # Badges
    badges = [
        ("AUTONOMOUS TRIAGE", (0, 255, 136)),
        ("OPENROUTER AI ENGINE", (0, 240, 255)),
        ("0% FALSE POSITIVES", (255, 215, 0)),
        ("DUAL REGRESSION PASSED", (0, 255, 136)),
        ("LOCAL SANDBOX BOUND", (255, 75, 95))
    ]
    bx = 140
    for btext, bcol in badges:
        draw.rectangle([bx, 500, bx + 180, 535], fill=(12, 18, 28), outline=bcol, width=1)
        draw.text((bx + 14, 510), btext, font=font_badge, fill=bcol)
        bx += 205

# Ch 02: The Core Problem in AppSec (15s - 30s)
def render_chapter_2(draw, img, t, t_local):
    # Background subtle overview
    if ui_overview:
        draw_mock_window(img, ui_overview, (60, 60, 1220, 595), "AEGIS-AGENT • METRICS & REAL-TIME INCIDENT TELEMETRY")
        
    # Semi-transparent dark overlay cards to compare Traditional vs AEGIS
    # Card 1: Traditional DevSecOps Crisis
    draw.rectangle([90, 110, 620, 540], fill=(20, 10, 14), outline=(255, 60, 80), width=2)
    draw.rectangle([90, 110, 620, 155], fill=(45, 15, 22))
    draw_shadow_text(draw, (110, 122), "TRADITIONAL DEVSECOPS (THE CRISIS)", font_heading, fill=(255, 90, 110))
    
    trad_points = [
        "● Over 500+ static scanner alerts per week",
        "● 80%+ False Positive rate waste developer hours",
        "● Mean-Time-To-Remediate (MTTR): 2 to 3 weeks",
        "● Code vulnerabilities remain unpatched in staging",
        "● Friction between Security teams and Developers",
        "● Manual testing cannot keep pace with CI/CD"
    ]
    ty = 180
    for tp in trad_points:
        draw.text((115, ty), tp, font=font_body, fill=(240, 200, 205))
        ty += 40
    draw.rectangle([115, 450, 595, 510], fill=(35, 12, 18), outline=(255, 70, 90), width=1)
    draw_shadow_text(draw, (130, 465), "RESULT: Alert Fatigue & Unpatched Exploits", font_subtitle, fill=(255, 120, 130))
    
    # Card 2: AEGIS-AGENT Autonomous Solution
    draw.rectangle([660, 110, 1190, 540], fill=(10, 22, 18), outline=(0, 255, 136), width=2)
    draw.rectangle([660, 110, 1190, 155], fill=(15, 40, 28))
    draw_shadow_text(draw, (680, 122), "AEGIS-AGENT AUTONOMOUS SOLUTION", font_heading, fill=(0, 255, 136))
    
    aegis_points = [
        "✔ Active Empirical Verification (Red Agent)",
        "✔ 0% False Positives (Sentinel Exploit Confirmation)",
        "✔ Automated Patch Synthesis (OpenRouter AI)",
        "✔ Mean-Time-To-Remediate (MTTR): Under 60 Seconds",
        "✔ Dual-Pass Regression: Zero Code Breakage",
        "✔ Standard SARIF 2.1.0 & Auditable Git Diffs"
    ]
    ay = 180
    for ap in aegis_points:
        draw.text((685, ay), ap, font=font_body, fill=(210, 255, 230))
        ay += 40
    draw.rectangle([685, 450, 1165, 510], fill=(12, 38, 25), outline=(0, 255, 136), width=1)
    draw_shadow_text(draw, (700, 465), "RESULT: Instant Autonomous Self-Healing Immunity", font_subtitle, fill=(0, 255, 136))

# Ch 03: System Design & 5-Tier Architecture (30s - 45s)
def render_chapter_3(draw, img, t, t_local):
    draw.rectangle([0, 48, WIDTH, 608], fill=(10, 14, 22))
    
    # Heading banner
    draw_shadow_text(draw, (80, 68), "ENTERPRISE 5-TIER SYSTEM DESIGN & ARCHITECTURE", font_title, fill=(0, 240, 255))
    draw.text((82, 112), "Decoupled, event-driven microservices architecture uniting telemetry, AI models, and local sandboxes", font=font_body, fill=(180, 205, 230))
    
    # Draw 5 Architectural Tiers as connected high-tech blocks
    tiers = [
        ("TIER 1: CLIENT PRESENTATION", "Responsive Glassmorphism UI\nLive War Room HUD\nInteractive Attack Graph DAG\nSARIF & Git Diff Visualizer", (0, 240, 255), 70),
        ("TIER 2: SECURE API GATEWAY", "Express.js REST Middleware\nRoute Controllers & Sanitizers\nCORS & Localhost Boundary\nTask Process Daemon Manager", (0, 255, 136), 305),
        ("TIER 3: MULTI-AGENT ENGINE", "Red Agent (Probing)\nSentinel (Exploit Verify)\nFix Agent (Patch Synthesis)\nAuditor (Regression Matrix)", (255, 215, 0), 540),
        ("TIER 4: AI REASONING CORE", "OpenRouter AI API\nClaude 3.5 Sonnet / Llama 70B\nFew-shot SecOps Prompts\nSurgical AST Diff Generator", (170, 120, 255), 775),
        ("TIER 5: STORAGE & SANDBOX", "SQLite WAL Database\nTarget Repository AST Ingest\nSEC-LOCAL-8080 Container\nIsolated Ephemeral Worktree", (255, 90, 120), 1010)
    ]
    
    # Render Tier Cards
    for title, desc, col, x in tiers:
        draw.rectangle([x, 155, x + 205, 480], fill=(14, 20, 32), outline=col, width=2)
        # Header box
        draw.rectangle([x, 155, x + 205, 205], fill=(20, 28, 44))
        draw_shadow_text(draw, (x + 8, 168), title.split(":")[0], font_badge, fill=col)
        draw_shadow_text(draw, (x + 8, 184), title.split(":")[1].strip(), font_small, fill=(255, 255, 255))
        
        # Descriptions
        dy = 225
        for line in desc.split("\n"):
            draw.text((x + 12, dy), f"• {line}", font=font_small, fill=(215, 230, 245))
            dy += 38
            
        # Tier tag at bottom
        draw.rectangle([x + 12, 435, x + 193, 465], fill=(18, 25, 40), outline=col, width=1)
        draw.text((x + 22, 442), "FULLY DECOUPLED", font=font_badge, fill=col)
        
    # Animated connecting data flow arrows
    flow_x = 275 + int((t_local % 3.0) / 3.0 * 200)
    for x_arr in [275, 510, 745, 980]:
        draw.line([(x_arr, 317), (x_arr + 30, 317)], fill=(0, 255, 136), width=3)
        draw.polygon([(x_arr + 30, 311), (x_arr + 38, 317), (x_arr + 30, 323)], fill=(0, 255, 136))
        
    # Bottom callout
    draw.rectangle([70, 515, 1210, 570], fill=(16, 24, 38), outline=(0, 180, 255), width=1)
    draw_shadow_text(draw, (90, 530), "KEY ARCHITECTURAL GUARANTEE: Zero external network probing. Code AST is parsed read-only.", font_subtitle, fill=(0, 255, 136))

# Ch 04: Safety Governance & Sandbox Boundary (45s - 60s)
def render_chapter_4(draw, img, t, t_local):
    draw.rectangle([0, 48, WIDTH, 608], fill=(11, 15, 24))
    
    draw_shadow_text(draw, (80, 68), "STRICT SAFETY GOVERNANCE & SANDBOX ISOLATION", font_title, fill=(255, 90, 120))
    draw.text((82, 112), "Enterprise defense-in-depth ensures no unauthorized traffic ever escapes to production networks", font=font_body, fill=(180, 205, 230))
    
    # Center: The Secure Local Container SEC-LOCAL-8080
    cx, cy = 640, 330
    draw.rectangle([cx - 240, cy - 170, cx + 240, cy + 180], fill=(14, 26, 38), outline=(0, 255, 136), width=3)
    draw.rectangle([cx - 240, cy - 170, cx + 240, cy - 125], fill=(18, 40, 50))
    draw_shadow_text(draw, (cx - 210, cy - 155), "SAFE ISOLATED SANDBOX: SEC-LOCAL-8080", font_heading, fill=(0, 255, 136))
    
    sandbox_specs = [
        "● STRICT URL ALLOWLIST: http://127.0.0.1:8080 ONLY",
        "● EPHEMERAL GIT WORKTREE: aegis-fix-cwe89 branch",
        "● AST READ-ONLY PARSING: Codebase inspected safely",
        "● NON-DESTRUCTIVE PAYLOADS: SQL syntax breakers only",
        "● DUAL REGRESSION: Both security & functional checks",
        "● HUMAN OPERATOR GATE: One-click manual approval"
    ]
    sy = cy - 105
    for s in sandbox_specs:
        draw.text((cx - 215, sy), s, font=font_body, fill=(220, 245, 235))
        sy += 36
        
    # Perimeter Firewall on Left & Right
    # Left: External Public Repos (Blocked from execution)
    draw.rectangle([60, cy - 140, 340, cy + 150], fill=(24, 12, 16), outline=(255, 75, 95), width=2)
    draw.rectangle([60, cy - 140, 340, cy - 95], fill=(45, 15, 20))
    draw_shadow_text(draw, (75, cy - 125), "PRODUCTION NETWORKS", font_subtitle, fill=(255, 95, 115))
    draw.text((75, cy - 75), "• External Cloud APIs\n• Live Production DB\n• Customer Credential Store\n• Public Repositories", font=font_body, fill=(240, 200, 210))
    draw.rectangle([80, cy + 85, 320, cy + 125], fill=(50, 15, 20), outline=(255, 75, 95), width=1)
    draw_shadow_text(draw, (110, cy + 96), "ACCESS BLOCKED", font_heading, fill=(255, 75, 95))
    
    # Right: Operator Security Console Gate
    draw.rectangle([940, cy - 140, 1220, cy + 150], fill=(15, 22, 35), outline=(0, 240, 255), width=2)
    draw.rectangle([940, cy - 140, 1220, cy - 95], fill=(20, 32, 50))
    draw_shadow_text(draw, (960, cy - 125), "HUMAN-IN-THE-LOOP", font_subtitle, fill=(0, 240, 255))
    draw.text((955, cy - 75), "• Manual Diff Inspection\n• One-Click Approval\n• Instant Rollback Gate\n• Cryptographic SARIF Log", font=font_body, fill=(205, 230, 250))
    draw.rectangle([960, cy + 85, 1200, cy + 125], fill=(20, 45, 35), outline=(0, 255, 136), width=1)
    draw_shadow_text(draw, (995, cy + 96), "OPERATOR APPROVE", font_heading, fill=(0, 255, 136))
    
    # Animated Firewall Shield Lines
    fw_col = (255, 75, 95) if (int(t_local * 4) % 2 == 0) else (0, 255, 136)
    draw.line([(345, cy), (395, cy)], fill=fw_col, width=3)
    draw.line([(885, cy), (935, cy)], fill=(0, 240, 255), width=3)

# Ch 05: Stage 01 Target Research & AST Ingestion (60s - 75s)
def render_chapter_5(draw, img, t, t_local):
    if ui_research:
        draw_mock_window(img, ui_research, (60, 60, 1220, 595), "STAGE 01: TARGET INPUT CONFIGURATION & AST INGESTION INTELLIGENCE")
    # Highlight overlay on Discovered Attack Surface
    draw.rectangle([680, 290, 1180, 560], outline=(0, 255, 136), width=2)
    draw.rectangle([680, 260, 940, 290], fill=(10, 35, 20), outline=(0, 255, 136), width=1)
    draw.text((690, 268), "✔ AST DISCOVERED ATTACK VECTORS", font=font_small, fill=(0, 255, 136))

# Ch 06: Custom Target Staging & Offline AST Evaluation (75s - 90s)
def render_chapter_6(draw, img, t, t_local):
    if ui_research:
        draw_mock_window(img, ui_research, (60, 60, 1220, 595), "SAFE CUSTOM STAGING TARGET EVALUATION (OFFLINE SIMULATION)")
    # Highlight the input sector box
    draw.rectangle([80, 115, 650, 560], outline=(0, 240, 255), width=3)
    draw.rectangle([80, 85, 390, 115], fill=(15, 30, 48), outline=(0, 240, 255), width=1)
    draw.text((92, 92), "INPUT SECTOR: REPO, STAGING URL & SPEC", font=font_small, fill=(0, 240, 255))
    
    # Floating explanation card
    draw.rectangle([450, 380, 1180, 540], fill=(12, 18, 28), outline=(0, 255, 136), width=2)
    draw_shadow_text(draw, (470, 395), "RESPONSIVE TARGET INPUT SECTOR CAPABILITIES", font_heading, fill=(0, 255, 136))
    points = [
        "1. Direct Git Source Repository input with branch ref selector",
        "2. Custom Staging URL support (e.g. portfolio, microservice test env)",
        "3. Live OpenAPI / Swagger JSON parser extracts routes automatically",
        "4. Safe Offline AST Evaluation: Zero unauthorized traffic touches staging"
    ]
    py = 430
    for p in points:
        draw.text((470, py), p, font=font_body, fill=(225, 240, 255))
        py += 24

# Ch 07: Stage 02 Red Agent Probing & Attack Simulation (90s - 105s)
def render_chapter_7(draw, img, t, t_local):
    if ui_warroom:
        draw_mock_window(img, ui_warroom, (60, 60, 1220, 595), "STAGE 02: RED AGENT ACTIVE PROBING & BOUNDARY TESTING")
    # Red Agent active alert box
    pulse_col = (255, 50, 70) if (int(t_local * 3) % 2 == 0) else (255, 120, 140)
    draw.rectangle([100, 140, 600, 360], fill=(22, 10, 14), outline=pulse_col, width=2)
    draw.rectangle([100, 140, 600, 180], fill=(45, 12, 20))
    draw_shadow_text(draw, (115, 150), "[RED AGENT] ACTIVE SYNTAX BREAKER DISPATCH", font_heading, fill=pulse_col)
    
    logs = [
        "> TARGET: POST /api/v1/auth/login",
        "> VECTOR: CWE-89 SQL Injection",
        "> PAYLOAD: ' OR '1'='1 --",
        "> HEADERS: Content-Type: application/json",
        "> STATUS: 500 Internal Server Error",
        "> TRACE: SQLite unescaped syntax error detected"
    ]
    ly = 195
    for l in logs:
        draw.text((115, ly), l, font=font_mono, fill=(255, 210, 220))
        ly += 24
        
    draw.rectangle([100, 320, 600, 355], fill=(35, 10, 15))
    draw.text((115, 328), "NON-DESTRUCTIVE: Validates boundary without modifying DB rows", font=font_small, fill=(255, 160, 170))

# Ch 08: Stage 03 Sentinel Agent Exploit Verification (105s - 120s)
def render_chapter_8(draw, img, t, t_local):
    if ui_finding:
        draw_mock_window(img, ui_finding, (60, 60, 1220, 595), "STAGE 03: SENTINEL AGENT EXPLOIT VERIFICATION (0% FALSE POSITIVE)")
    # Verification highlight badge
    draw.rectangle([700, 120, 1180, 280], fill=(12, 28, 20), outline=(0, 255, 136), width=2)
    draw_shadow_text(draw, (720, 135), "EXPLOIT EMPIRICALLY CONFIRMED", font_heading, fill=(0, 255, 136))
    
    specs = [
        "✔ Finding ID: FINDING-CWE-89-001 (CRITICAL)",
        "✔ Database: SqliteError: near 'OR': syntax error",
        "✔ Stack Trace captured from server runtime",
        "✔ Heuristics discarded -> 100% Proven Exploit",
        "✔ Sentinel marks candidate for AI Patch Synthesis"
    ]
    sy = 175
    for s in specs:
        draw.text((720, sy), s, font=font_body, fill=(210, 255, 230))
        sy += 24

# Ch 09: Stage 04 Fix Agent AI Patch Synthesis (120s - 135s)
def render_chapter_9(draw, img, t, t_local):
    if ui_diff:
        draw_mock_window(img, ui_diff, (60, 60, 1220, 595), "STAGE 04: FIX AGENT AI PATCH SYNTHESIS (MINIMAL UNIFIED GIT DIFF)")
    # OpenRouter Model Badge
    draw.rectangle([100, 110, 640, 200], fill=(16, 22, 36), outline=(0, 240, 255), width=2)
    draw_shadow_text(draw, (115, 122), "AI MODEL: OPENROUTER / CLAUDE-3.5-SONNET", font_heading, fill=(0, 240, 255))
    draw.text((115, 158), "• Synthesizes minimal AST-compliant unified git diff\n• Replaces vulnerable concatenation with prepared statements", font=font_body, fill=(200, 225, 245))
    
    # Highlight the diff box
    draw.rectangle([100, 215, 640, 360], fill=(10, 15, 22), outline=(0, 255, 136), width=2)
    draw.text((115, 228), "- const query = \"SELECT * FROM users WHERE user = '\" + u + \"'\";", font=font_mono, fill=(255, 90, 110))
    draw.text((115, 260), "+ const stmt = db.prepare(\"SELECT * FROM users WHERE user = ?\");", font=font_mono, fill=(0, 255, 136))
    draw.text((115, 290), "+ const user = stmt.get(u);", font=font_mono, fill=(0, 255, 136))
    draw.text((115, 325), "RESULT: SQL Injection vector neutralized at AST level", font=font_small, fill=(0, 240, 255))

# Ch 10: Stage 05 Auditor Agent Dual-Pass Regression (135s - 150s)
def render_chapter_10(draw, img, t, t_local):
    draw.rectangle([0, 48, WIDTH, 608], fill=(10, 14, 22))
    draw_shadow_text(draw, (80, 68), "STAGE 05: AUDITOR AGENT DUAL-PASS REGRESSION MATRIX", font_title, fill=(0, 255, 136))
    draw.text((82, 112), "Mathematical proof that the vulnerability is neutralized while authentic application behavior is preserved", font=font_body, fill=(180, 205, 230))
    
    # Test Pass 1: Security Test (Exploit neutralized)
    draw.rectangle([80, 150, 610, 480], fill=(14, 22, 34), outline=(0, 240, 255), width=2)
    draw.rectangle([80, 150, 610, 195], fill=(18, 30, 48))
    draw_shadow_text(draw, (100, 162), "PASS 1: SECURITY REGRESSION TEST", font_heading, fill=(0, 240, 255))
    
    p1_items = [
        "● Re-dispatches exact exploit payload: ' OR '1'='1",
        "● Target Endpoint: POST /api/v1/auth/login",
        "● Database Query: db.prepare('... WHERE user = ?')",
        "● Raw payload treated strictly as literal string parameter",
        "● Target Response: HTTP 401 Unauthorized",
        "● Database Error: NONE (0 Syntax Exceptions)"
    ]
    y1 = 215
    for p in p1_items:
        draw.text((105, y1), p, font=font_body, fill=(210, 235, 250))
        y1 += 34
    draw.rectangle([100, 420, 590, 460], fill=(15, 45, 30), outline=(0, 255, 136), width=1)
    draw_shadow_text(draw, (125, 430), "✔ EXPLOIT COMPLETELY NEUTRALIZED", font_subtitle, fill=(0, 255, 136))
    
    # Test Pass 2: Functional Test (Authentic Login Passes)
    draw.rectangle([670, 150, 1200, 480], fill=(14, 26, 22), outline=(0, 255, 136), width=2)
    draw.rectangle([670, 150, 1200, 195], fill=(18, 40, 32))
    draw_shadow_text(draw, (690, 162), "PASS 2: FUNCTIONAL REGRESSION TEST", font_heading, fill=(0, 255, 136))
    
    p2_items = [
        "● Dispatches authentic user credentials: admin / password",
        "● Target Endpoint: POST /api/v1/auth/login",
        "● Verifies user row returned cleanly from database",
        "● Target Response: HTTP 200 OK (Auth Token Issued)",
        "● Zero regression introduced to production functionality",
        "● Ephemeral worktree verified clean for master merge"
    ]
    y2 = 215
    for p in p2_items:
        draw.text((695, y2), p, font=font_body, fill=(210, 250, 230))
        y2 += 34
    draw.rectangle([690, 420, 1180, 460], fill=(15, 45, 30), outline=(0, 255, 136), width=1)
    draw_shadow_text(draw, (715, 430), "✔ AUTHENTIC FUNCTIONALITY 100% PRESERVED", font_subtitle, fill=(0, 255, 136))
    
    # Bottom stamp
    draw.rectangle([80, 510, 1200, 565], fill=(12, 32, 22), outline=(0, 255, 136), width=2)
    draw_shadow_text(draw, (110, 525), "AUDITOR VERDICT: DUAL REGRESSION PASSED • ZERO CODE BREAKAGE • SAFE TO MERGE", font_heading, fill=(0, 255, 136))

# Ch 11: Attack Graph & Operator Governance (150s - 165s)
def render_chapter_11(draw, img, t, t_local):
    if ui_attack:
        draw_mock_window(img, ui_attack, (60, 60, 1220, 595), "INTERACTIVE ATTACK GRAPH & OPERATOR GOVERNANCE CONSOLE")
    # Highlight the Operator Action Bar
    draw.rectangle([650, 460, 1200, 565], fill=(14, 24, 36), outline=(0, 255, 136), width=2)
    draw_shadow_text(draw, (670, 475), "HUMAN-IN-THE-LOOP GOVERNANCE ACTIONS", font_heading, fill=(0, 255, 136))
    draw.rectangle([670, 510, 910, 550], fill=(0, 60, 35), outline=(0, 255, 136), width=1)
    draw.text((685, 522), "✔ APPROVE & DEPLOY PATCH", font=font_small, fill=(0, 255, 136))
    draw.rectangle([930, 510, 1170, 550], fill=(20, 30, 45), outline=(0, 200, 255), width=1)
    draw.text((945, 522), "⬇ DOWNLOAD UNIFIED .PATCH", font=font_small, fill=(0, 240, 255))

# Ch 12: Production Deliverables & Summary (165s - 180s)
def render_chapter_12(draw, img, t, t_local):
    draw.rectangle([0, 48, WIDTH, 608], fill=(10, 15, 24))
    
    # Grand finale title
    draw_shadow_text(draw, (220, 70), "AEGIS-AGENT COMPLETE PROJECT SUMMARY", font_title, fill=(255, 255, 255))
    draw_shadow_text(draw, (290, 115), "Autonomous Cybersecurity & Self-Healing Platform", font_heading, fill=(0, 255, 136))
    
    # 4 Output Deliverable Cards
    cards = [
        ("SARIF 2.1.0 REPORT", "Standard static & dynamic analysis format. Compatible with GitHub Code Scanning, DefectDojo, and Jira.", (0, 240, 255), 80),
        ("UNIFIED GIT PATCH", "Production-grade git diff ready for automated PR creation or human operator review.", (0, 255, 136), 360),
        ("PDF ARCHITECTURE GUIDES", "Complete system design, execution manuals, API flowcharts, and onboarding guides.", (255, 215, 0), 640),
        ("ISOLATED WORKTREE", "Tested in ephemeral container SEC-LOCAL-8080 with zero production code regression.", (255, 90, 120), 920)
    ]
    for ctitle, cdesc, ccol, cx in cards:
        draw.rectangle([cx, 170, cx + 260, 370], fill=(15, 22, 34), outline=ccol, width=2)
        draw.rectangle([cx, 170, cx + 260, 215], fill=(20, 30, 46))
        draw_shadow_text(draw, (cx + 14, 184), ctitle, font=font_subtitle, fill=ccol)
        draw.text((cx + 14, 235), cdesc, font=font_body, fill=(210, 230, 245))
        draw.rectangle([cx + 14, 320, cx + 246, 355], fill=(18, 28, 42), outline=ccol, width=1)
        draw.text((cx + 25, 330), "READY FOR PRODUCTION", font=font_badge, fill=ccol)
        
    # Key Performance Metrics Recap
    draw.rectangle([80, 400, 1200, 500], fill=(12, 28, 20), outline=(0, 255, 136), width=2)
    metrics = [
        ("MTTR", "< 60 SECONDS", (0, 255, 136)),
        ("FALSE POSITIVES", "0.0% VERIFIED", (0, 255, 136)),
        ("PATCH ACCURACY", "100% REGRESSION-FREE", (0, 240, 255)),
        ("SANDBOX SAFETY", "STRICT SEC-LOCAL-8080", (255, 215, 0))
    ]
    mx = 110
    for mlabel, mval, mcol in metrics:
        draw.text((mx, 420), mlabel, font=font_badge, fill=(160, 200, 180))
        draw_shadow_text(draw, (mx, 445), mval, font=font_heading, fill=mcol)
        mx += 275
        
    # Closing statement
    draw.rectangle([80, 520, 1200, 575], fill=(16, 24, 38), outline=(0, 240, 255), width=1)
    draw_shadow_text(draw, (180, 535), "Transforming reactive AppSec into proactive, autonomous immunity.", font_heading, fill=(255, 255, 255))

# Chapter configuration table
CHAPTERS = [
    {
        "id": 1,
        "title": "Platform Identity & Mission",
        "badge": "01/12 • PLATFORM MISSION",
        "line1": "AEGIS-AGENT: Autonomous Multi-Agent AI Security Operations & Self-Healing Pipeline",
        "line2": "Engineered to autonomously discover, exploit, and self-heal modern web microservices in seconds.",
        "renderer": render_chapter_1
    },
    {
        "id": 2,
        "title": "The AppSec Problem",
        "badge": "02/12 • THE APPSEC CRISIS",
        "line1": "Traditional AppSec drowns teams in 500+ unverified static scanner alerts and 80% false positives.",
        "line2": "AEGIS-AGENT replaces weeks of manual triage with autonomous, 60-second end-to-end remediation.",
        "renderer": render_chapter_2
    },
    {
        "id": 3,
        "title": "5-Tier System Architecture",
        "badge": "03/12 • 5-TIER ARCHITECTURE",
        "line1": "Enterprise 5-tier architecture: Glassmorphism UI, Express Gateway, Multi-Agent, AI, & Storage.",
        "line2": "Decoupled services allow secure local execution, real-time telemetry, and LLM reasoning.",
        "renderer": render_chapter_3
    },
    {
        "id": 4,
        "title": "Safety & Sandbox Boundary",
        "badge": "04/12 • SAFETY & GOVERNANCE",
        "line1": "Strict safety governance: All probing and patching is strictly confined to SEC-LOCAL-8080.",
        "line2": "URL allowlists, AST read-only inspection, and operator confirmation guarantee zero production leakage.",
        "renderer": render_chapter_4
    },
    {
        "id": 5,
        "title": "Stage 01: Target Research & AST",
        "badge": "05/12 • STAGE 01: TARGET RESEARCH",
        "line1": "Stage 1: Target Research ingests source repositories and OpenAPI specs via static AST analysis.",
        "line2": "The AST parser maps exposed attack surfaces, parameters, and identifies high-risk injection candidates.",
        "renderer": render_chapter_5
    },
    {
        "id": 6,
        "title": "Custom Targets & Offline AST",
        "badge": "06/12 • CUSTOM STAGING TARGETS",
        "line1": "Users can input custom staging URLs and cURL templates through the responsive input sector.",
        "line2": "AEGIS performs safe static route modeling, preserving the container boundary without untrusted network egress.",
        "renderer": render_chapter_6
    },
    {
        "id": 7,
        "title": "Stage 02: Red Agent Probing",
        "badge": "07/12 • STAGE 02: RED AGENT PROBING",
        "line1": "Stage 2: The Red Agent executes targeted, non-destructive syntax-breaking probes against target routes.",
        "line2": "Payloads test boundary handling and input validation in real time without damaging underlying database state.",
        "renderer": render_chapter_7
    },
    {
        "id": 8,
        "title": "Stage 03: Sentinel Exploit Verify",
        "badge": "08/12 • STAGE 03: SENTINEL VERIFY",
        "line1": "Stage 3: The Sentinel Agent captures server execution telemetry and database stack traces.",
        "line2": "By verifying authentic exploitation rather than static heuristics, false positives are completely eliminated.",
        "renderer": render_chapter_8
    },
    {
        "id": 9,
        "title": "Stage 04: Fix Agent AI Patch",
        "badge": "09/12 • STAGE 04: FIX AGENT AI PATCH",
        "line1": "Stage 4: The Fix Agent leverages OpenRouter AI to formulate a minimal, surgical unified git diff.",
        "line2": "The vulnerable string concatenation is cleanly replaced with secure, parameterized prepared statements.",
        "renderer": render_chapter_9
    },
    {
        "id": 10,
        "title": "Stage 05: Auditor Regression",
        "badge": "10/12 • STAGE 05: DUAL REGRESSION",
        "line1": "Stage 5: The Auditor Agent conducts rigorous dual-pass regression testing on an isolated branch.",
        "line2": "It mathematically confirms the exploit is blocked while ensuring authentic user workflows remain intact.",
        "renderer": render_chapter_10
    },
    {
        "id": 11,
        "title": "Attack Graph & Governance",
        "badge": "11/12 • ATTACK GRAPH GOVERNANCE",
        "line1": "The Interactive Attack Graph maps systemic blast radius and potential lateral movement paths.",
        "line2": "Human-in-the-loop governance empowers security operators to inspect and approve patches with one click.",
        "renderer": render_chapter_11
    },
    {
        "id": 12,
        "title": "Deliverables & Summary",
        "badge": "12/12 • COMPLETE DELIVERABLES",
        "line1": "AEGIS-AGENT delivers production-grade SARIF audit logs, verified git diffs, and complete documentation.",
        "line2": "Transforming reactive cybersecurity into proactive, autonomous immunity for modern software systems.",
        "renderer": render_chapter_12
    }
]

# -------------------------------------------------------------
# 4. MASTER VIDEO PIPELINE & ENCODING
# -------------------------------------------------------------
def render_and_encode_video():
    # Step 1: Synthesize Audio
    audio_path = synthesize_soundtrack(TEMP_AUDIO, TOTAL_SECONDS, SAMPLE_RATE)
    
    # Step 2: Start FFmpeg Pipe
    print(f"[3/3] Launching FFmpeg encoder and piping {TOTAL_FRAMES} frames...")
    ffmpeg_cmd = [
        FFMPEG_EXE,
        "-y", # overwrite
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{WIDTH}x{HEIGHT}",
        "-pix_fmt", "bgr24",
        "-r", str(FPS),
        "-i", "-", # stdin
        "-i", audio_path, # audio input
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        OUTPUT_VIDEO
    ]
    
    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    
    t_start = time.time()
    chapter_duration = TOTAL_SECONDS / 12.0 # 15.0 seconds per chapter
    
    for frame_idx in range(TOTAL_FRAMES):
        t = frame_idx / float(FPS)
        
        # Determine active chapter (0 to 11)
        ch_idx = min(11, int(t / chapter_duration))
        t_local = t - (ch_idx * chapter_duration)
        chapter = CHAPTERS[ch_idx]
        
        # Create base canvas
        frame_img = Image.new("RGB", (WIDTH, HEIGHT), (10, 14, 22))
        draw = ImageDraw.Draw(frame_img)
        
        # Render chapter-specific content
        chapter["renderer"](draw, frame_img, t, t_local)
        
        # Render top HUD (branding, chapter title, live time)
        draw_top_hud(draw, t, chapter["title"], ch_idx + 1)
        
        # Render bottom subtitle HUD (with dynamic text shadow form)
        draw_bottom_subtitle_hud(draw, t, chapter["badge"], chapter["line1"], chapter["line2"])
        
        # Convert RGB to BGR numpy buffer for FFmpeg
        rgb_arr = np.array(frame_img)
        bgr_arr = rgb_arr[:, :, ::-1] # RGB to BGR
        proc.stdin.write(bgr_arr.tobytes())
        
        # Print progress every 360 frames (15 seconds)
        if frame_idx % 360 == 0 or frame_idx == TOTAL_FRAMES - 1:
            elapsed = time.time() - t_start
            fps_cur = (frame_idx + 1) / max(0.001, elapsed)
            percent = ((frame_idx + 1) / TOTAL_FRAMES) * 100.0
            print(f"  Frame {frame_idx + 1}/{TOTAL_FRAMES} ({percent:.1f}%) | Speed: {fps_cur:.1f} fps | Elapsed: {elapsed:.1f}s")
            
    proc.stdin.close()
    stderr_out = proc.stderr.read().decode('utf-8', errors='ignore')
    proc.wait()
    
    if proc.returncode != 0:
        print(f"FFmpeg error:\n{stderr_out}")
        raise RuntimeError("FFmpeg encoding failed!")
        
    print(f"Video successfully rendered to: {OUTPUT_VIDEO}")
    file_size_mb = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
    print(f"Final Video File Size: {file_size_mb:.2f} MB | Duration: {TOTAL_SECONDS}s")
    
    # Copy to artifact directory
    artifact_copy = os.path.join(ARTIFACT_DIR, "AEGIS_AGENT_Complete_Project_Presentation.mp4")
    try:
        import shutil
        shutil.copyfile(OUTPUT_VIDEO, artifact_copy)
        print(f"Copied to Artifacts directory: {artifact_copy}")
    except Exception as e:
        print(f"Warning: could not copy to artifact directory: {e}")
        
    # Clean up temporary audio
    if os.path.exists(TEMP_AUDIO):
        try:
            os.remove(TEMP_AUDIO)
        except:
            pass

if __name__ == "__main__":
    render_and_encode_video()
