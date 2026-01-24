import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
    Button, Typography, Box, Card, Dialog, 
    DialogTitle, DialogContent, DialogActions, IconButton, 
    Slider, Switch, ToggleButton, ToggleButtonGroup, 
    List, ListItem, ListItemText, Divider, Fade 
} from '@mui/material';
import { 
    Settings, VolumeUp, Palette, Pause, PlayArrow, 
    Speed, GroupWork, MusicNote, Refresh 
} from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';

import { getRandomWord } from './dictionary';
import soundManager from './SoundManager';
import musicManager from './MusicManager';

// ... [Keep THEMES constant unchanged] ...
const THEMES = [
    { id: 'neon', label: 'NEON', bgClass: 'bg-neon', palette: ['#ff00cc', '#33ff00', '#00ccff', '#ffcc00'], uiAccent: '#00ccff', blockStyle: 'glow', font: '"Bangers", cursive' },
    { id: 'wood', label: 'WOOD', bgClass: 'bg-wood', palette: ['#eebb99', '#ddaa77', '#cc8855'], uiAccent: '#eebb99', blockStyle: 'solid', font: '"Roboto Slab", serif' },
    { id: 'void', label: 'VOID', bgClass: 'bg-midnight', palette: ['#ffffff', '#aaaaaa'], uiAccent: '#ffffff', blockStyle: 'minimal', font: '"Courier New", monospace' }
];

// ... [Keep Particle, Slash, and Word classes unchanged] ...
class Particle {
    constructor(x, y, colorIndex) {
        this.x = x; this.y = y; this.colorIndex = colorIndex;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 200 + 50;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0; this.decay = Math.random() * 1.5 + 0.5;
    }
    update(dt) {
        this.x += this.vx * dt; this.y += this.vy * dt; this.vy += 400 * dt;
        this.life -= this.decay * dt;
    }
    draw(ctx, theme) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = theme.palette[this.colorIndex % theme.palette.length];
        ctx.beginPath(); ctx.arc(this.x, this.y, Math.random()*3+2, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Slash {
    constructor(x, y, angle, colorIndex) {
        this.x = x; this.y = y; this.angle = angle; this.colorIndex = colorIndex;
        this.life = 1.0; this.length = 200;
    }
    update(dt) { this.life -= 4.0 * dt; }
    draw(ctx, theme) {
        if (this.life <= 0) return;
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
        const color = theme.palette[this.colorIndex % theme.palette.length];
        const gradient = ctx.createLinearGradient(-this.length/2, 0, this.length/2, 0);
        gradient.addColorStop(0, 'rgba(255,255,255,0)'); gradient.addColorStop(0.5, color); gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient; ctx.globalAlpha = this.life;
        ctx.beginPath(); ctx.moveTo(-this.length/2, 0); ctx.lineTo(0, -2*this.life); ctx.lineTo(this.length/2, 0); ctx.lineTo(0, 2*this.life); ctx.fill();
        ctx.restore();
    }
}

class Word {
    constructor(canvasWidth, canvasHeight, minLen, maxLen, comboMultiplier = 1, themePaletteLength) {
        this.text = getRandomWord(minLen, maxLen);
        this.colorIndex = Math.floor(Math.random() * themePaletteLength);
        
        const padding = 100;
        this.x = padding + Math.random() * (canvasWidth - padding * 2);
        this.y = canvasHeight + 60;
        
        const difficultyFactor = 1 + (comboMultiplier * 0.05); 
        const centerX = canvasWidth / 2;
        const dirX = (centerX - this.x) / (canvasWidth / 2);
        
        this.vx = (dirX * (Math.random() * 80 + 40)) * difficultyFactor; 
        const targetH = canvasHeight * (0.15 + Math.random() * 0.35); 
        const gravity = 450 * difficultyFactor; 
        this.gravity = gravity;
        this.vy = -Math.sqrt(2 * gravity * (canvasHeight - targetH));
        
        this.rotation = (Math.random() - 0.5) * 0.2;
        this.rotSpeed = (Math.random() - 0.5) * (0.5 * difficultyFactor);
        this.typedIndex = 0; this.isDead = false; this.scale = 1;
    }
    update(dt, canvasHeight) {
        this.vy += this.gravity * dt; this.x += this.vx * dt; this.y += this.vy * dt;
        this.rotation += this.rotSpeed * dt;
        if (this.y > canvasHeight + 100) { this.isDead = true; return 'missed'; }
        return 'active';
    }
    draw(ctx, isTarget, theme) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
        const color = theme.palette[this.colorIndex % theme.palette.length];
        if (isTarget) { this.scale = 1.15; if(theme.blockStyle === 'glow') { ctx.shadowColor = color; ctx.shadowBlur = 25; } } 
        else { this.scale = 1.0; ctx.shadowBlur = 0; }
        ctx.scale(this.scale, this.scale);
        
        ctx.font = `bold 30px ${theme.blockStyle==='minimal'||theme.id==='wood'?theme.font:'"Roboto Mono"'}`;
        const textMetrics = ctx.measureText(this.text);
        const width = textMetrics.width + 40; const height = 50;
        
        ctx.beginPath();
        if(theme.blockStyle === 'glow') {
            if(ctx.roundRect) ctx.roundRect(-width/2, -height/2, width, height, 8); else ctx.rect(-width/2, -height/2, width, height);
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fill(); ctx.lineWidth = isTarget ? 3 : 2; ctx.strokeStyle = color; ctx.stroke();
        } else if (theme.blockStyle === 'solid') {
            if(ctx.roundRect) ctx.roundRect(-width/2, -height/2, width, height, 6); else ctx.rect(-width/2, -height/2, width, height);
            ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke();
        } else {
            ctx.moveTo(-width/2, -height/2); ctx.lineTo(-width/2, height/2); ctx.moveTo(width/2, -height/2); ctx.lineTo(width/2, height/2);
            ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
        }

        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        const startX = -textMetrics.width/2;
        const typedStr = this.text.substring(0, this.typedIndex);
        const remainStr = this.text.substring(this.typedIndex);

        if (theme.blockStyle === 'glow') { ctx.fillStyle = '#666'; ctx.fillText(typedStr, startX, 2); ctx.fillStyle = '#fff'; ctx.fillText(remainStr, startX + ctx.measureText(typedStr).width, 0); } 
        else if (theme.blockStyle === 'solid') { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText(typedStr, startX, 2); ctx.fillStyle = '#222'; ctx.fillText(remainStr, startX + ctx.measureText(typedStr).width, 0); }
        else { ctx.fillStyle = '#444'; ctx.fillText(typedStr, startX, 2); ctx.fillStyle = color; ctx.fillText(remainStr, startX + ctx.measureText(typedStr).width, 0); }
        ctx.restore();
    }
}

// --- MAIN COMPONENT ---

const TypeNinja = () => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [themeIndex, setThemeIndex] = useState(0);
    const currentTheme = THEMES[themeIndex];

    const engineRef = useRef({
        words: [], particles: [], slashes: [],
        score: 0, lives: 3, combo: 0,
        screenLoad: 0, maxScreenLoad: 15,
        spawnTimer: 0, spawnInterval: 2000,
        targetWord: null, isPlaying: false, isPaused: false,
        lastTime: 0, shake: 0
    });

    const [gameState, setGameState] = useState('START'); 
    const [uiStats, setUiStats] = useState({ score: 0, lives: 3, combo: 0, currentWPM: 30, maxLoad: 15 });
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [highScores, setHighScores] = useState([]);
    const [isNewHighScore, setIsNewHighScore] = useState(false);

    const [soundEnabled, setSoundEnabled] = useState(true);
    const [musicTrack, setMusicTrack] = useState('neon');
    const [difficulty, setDifficulty] = useState('ADAPTIVE');
    const [customWPM, setCustomWPM] = useState(30);
    const [customWordLen, setCustomWordLen] = useState([1, 8]);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('typeNinjaScores') || '[]');
        setHighScores(saved);
        soundManager.enabled = soundEnabled;
    }, []);

    useEffect(() => { soundManager.enabled = soundEnabled; }, [soundEnabled]);

    useEffect(() => {
        if (gameState === 'PLAYING' && soundEnabled) musicManager.start(musicTrack);
        else musicManager.stop();
        return () => musicManager.stop();
    }, [gameState, soundEnabled, musicTrack]);

    const togglePause = () => {
        if(gameState === 'GAMEOVER' || gameState === 'START') return;
        const isPaused = !engineRef.current.isPaused;
        engineRef.current.isPaused = isPaused;
        if (!isPaused) engineRef.current.lastTime = performance.now();
        setGameState(isPaused ? 'PAUSED' : 'PLAYING');
    };

    const startGame = () => {
        soundManager.resume();
        musicManager.resume();

        let initialInterval = 2000;
        let initialMaxLoad = 12;

        if (difficulty === 'CUSTOM') {
            const avgLen = (customWordLen[0] + customWordLen[1]) / 2;
            const lengthScalar = Math.max(avgLen, 1.5) / 5;
            initialInterval = (60000 / customWPM) * lengthScalar;
            initialMaxLoad = avgLen < 3 ? 25 : Math.floor(customWPM * 0.8);
        }

        engineRef.current = {
            ...engineRef.current,
            words: [], particles: [], slashes: [],
            score: 0, lives: 3, combo: 0, screenLoad: 0,
            targetWord: null, isPlaying: true, isPaused: false,
            lastTime: performance.now(), shake: 0
        };
        engineRef.current.spawnInterval = initialInterval;
        engineRef.current.maxScreenLoad = initialMaxLoad;
        
        setIsNewHighScore(false);
        setUiStats({ score: 0, lives: 3, combo: 0, currentWPM: Math.round(60000/initialInterval), maxLoad: initialMaxLoad });
        setGameState('PLAYING');
        setSettingsOpen(false);
    };

    const clearData = () => {
        if(window.confirm("Delete all history?")) {
            localStorage.removeItem('typeNinjaScores');
            setHighScores([]);
        }
    };

    const triggerConfetti = (centerX, centerY) => {
        const engine = engineRef.current;
        for(let i=0; i<100; i++) {
            engine.particles.push(new Particle(centerX, centerY, Math.floor(Math.random()*4)));
        }
    };

    const handleGameOver = useCallback(() => {
        const engine = engineRef.current;
        engine.isPlaying = false;
        setGameState('GAMEOVER');
        soundManager.playGameOver();

        const currentScore = engine.score;
        const highestSoFar = highScores.length > 0 ? highScores[0].score : 0;
        
        const newEntry = { 
            score: currentScore, 
            date: new Date().toLocaleDateString(),
            mode: difficulty === 'CUSTOM' ? `Custom (${customWPM})` : 'Adaptive'
        };

        const updatedList = [...highScores, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
        setHighScores(updatedList);
        localStorage.setItem('typeNinjaScores', JSON.stringify(updatedList));

        if (currentScore > highestSoFar && currentScore > 0) {
            setIsNewHighScore(true);
            triggerConfetti(window.innerWidth/2, window.innerHeight/2);
        }
    }, [difficulty, customWPM, highScores]);

    // ... [Loop useEffect remains exactly same as previous] ...
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let rAF;

        const loop = (timestamp) => {
            const engine = engineRef.current;
            if (!engine.isPlaying && gameState !== 'GAMEOVER') return; 
            if (engine.isPaused) { rAF = requestAnimationFrame(loop); return; }

            const dt = Math.min((timestamp - engine.lastTime) / 1000, 0.1);
            engine.lastTime = timestamp;

            const dpr = window.devicePixelRatio || 1;
            const rect = containerRef.current.getBoundingClientRect();
            if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
                canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
                ctx.scale(dpr, dpr);
            }
            ctx.clearRect(0, 0, rect.width, rect.height);

            ctx.save();
            if (engine.shake > 0) {
                const shakeX = (Math.random() - 0.5) * engine.shake;
                const shakeY = (Math.random() - 0.5) * engine.shake;
                ctx.translate(shakeX, shakeY);
                engine.shake -= dt * 30; if(engine.shake < 0) engine.shake = 0;
            }

            if (engine.isPlaying) {
                engine.spawnTimer += dt * 1000;
                let currentInterval = engine.spawnInterval;
                let currentMinLen = 1, currentMaxLen = 8;
                
                if(difficulty === 'CUSTOM') {
                    const avgLen = (customWordLen[0] + customWordLen[1]) / 2;
                    const lengthScalar = Math.max(avgLen, 1.5) / 5;
                    currentInterval = (60000 / customWPM) * lengthScalar;
                    currentMinLen = customWordLen[0]; currentMaxLen = customWordLen[1];
                } else {
                    if(engine.score < 200) { currentMinLen=1; currentMaxLen=4; }
                    else if(engine.score < 800) { currentMinLen=3; currentMaxLen=8; }
                    else { currentMinLen=4; currentMaxLen=12; }
                }

                if (engine.spawnTimer > currentInterval) {
                    if(engine.screenLoad < engine.maxScreenLoad) {
                        const w = new Word(rect.width, rect.height, currentMinLen, currentMaxLen, engine.combo, currentTheme.palette.length);
                        engine.words.push(w);
                        engine.screenLoad += w.text.length;
                        engine.spawnTimer = 0;
                    } else { engine.spawnTimer = currentInterval - 100; }
                }
            }

            engine.words = engine.words.filter(w => !w.isDead);
            engine.words.forEach(w => {
                const status = w.update(dt, rect.height);
                w.draw(ctx, w === engine.targetWord, currentTheme);
                if (status === 'missed' && engine.isPlaying) {
                    engine.screenLoad -= (w.text.length - w.typedIndex);
                    if(w === engine.targetWord) engine.targetWord = null;
                    engine.lives--;
                    engine.combo = 0;
                    engine.shake = 20;
                    soundManager.playError();
                    engine.spawnInterval += 300; 
                    engine.screenLoad = Math.max(0, engine.screenLoad - 2); 
                    setUiStats(prev => ({ ...prev, lives: engine.lives, combo: 0, currentWPM: Math.round(60000/engine.spawnInterval) }));
                    if (engine.lives <= 0) handleGameOver();
                }
            });

            engine.particles = engine.particles.filter(p => p.life > 0);
            engine.particles.forEach(p => { p.update(dt); p.draw(ctx, currentTheme); });
            engine.slashes = engine.slashes.filter(s => s.life > 0);
            engine.slashes.forEach(s => { s.update(dt); s.draw(ctx, currentTheme); });

            ctx.restore();
            rAF = requestAnimationFrame(loop);
        };

        engineRef.current.lastTime = performance.now();
        rAF = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rAF);
    }, [gameState, difficulty, customWPM, customWordLen, handleGameOver, currentTheme]);

    // --- UPDATED INPUT (Added Enter/Escape for pause) ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Updated Pause Logic: Escape OR Enter
            if (e.key === 'Escape' || e.key === 'Enter') { 
                togglePause(); 
                return; 
            }
            if (gameState !== 'PLAYING' || engineRef.current.isPaused) return;

            const key = e.key.toUpperCase();
            if (!/^[A-Z]$/.test(key)) return;
            const engine = engineRef.current;

            const handleHit = () => {
                engine.targetWord.typedIndex++;
                engine.screenLoad--;
                soundManager.playClick();
                if (engine.targetWord.typedIndex >= engine.targetWord.text.length) destroyWord(engine.targetWord);
            };

            if (engine.targetWord) {
                if (key === engine.targetWord.text[engine.targetWord.typedIndex]) handleHit();
                else {
                    engine.combo = 0;
                    setUiStats(prev => ({ ...prev, combo: 0 }));
                    soundManager.playError();
                    engine.shake = 5;
                }
            } else {
                const candidates = engine.words.filter(w => w.text.startsWith(key) && !w.isDead);
                if (candidates.length > 0) {
                    candidates.sort((a,b) => b.y - a.y);
                    engine.targetWord = candidates[0];
                    engine.targetWord.typedIndex = 1;
                    engine.screenLoad--;
                    soundManager.playClick();
                    if (engine.targetWord.typedIndex >= engine.targetWord.text.length) destroyWord(engine.targetWord);
                }
            }
        };

        const destroyWord = (word) => {
            const engine = engineRef.current;
            word.isDead = true;
            soundManager.playSlash();
            
            for(let i=0; i<15; i++) engine.particles.push(new Particle(word.x, word.y, word.colorIndex));
            const angle = (Math.random() - 0.5) * Math.PI; 
            engine.slashes.push(new Slash(word.x, word.y, angle, word.colorIndex));

            engine.combo++;
            const lengthBonus = word.text.length * 5; 
            engine.score += 10 + (engine.combo * 2) + lengthBonus;

            if (difficulty === 'ADAPTIVE') {
                if(engine.spawnInterval > 300) engine.spawnInterval -= 35; 
                if(engine.score % 100 === 0) engine.maxScreenLoad += 1;
            }

            engine.targetWord = null;
            setUiStats({ 
                score: engine.score, combo: engine.combo, lives: engine.lives,
                currentWPM: Math.round(60000 / engine.spawnInterval),
                maxLoad: engine.maxScreenLoad
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, difficulty, currentTheme]);

    return (
        <div ref={containerRef} className={currentTheme.bgClass}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

            {/* --- HUD SECTION: HIDDEN WHEN NOT PLAYING --- */}
            {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
                <>
                    {/* TOP BAR */}
                    <div className="container-fluid fixed-top pt-3 px-4" style={{pointerEvents:'none'}}>
                        <div className="row align-items-center">
                            <div className="col-4">
                                <Typography variant="h4" sx={{ fontFamily: currentTheme.font, color: currentTheme.uiAccent, textShadow: '3px 3px rgba(0,0,0,0.5)' }}>TypingNINJA</Typography>
                            </div>
                            <div className="col-4 text-center">
                                <Box sx={{ display: 'inline-block', bgcolor: 'rgba(0,0,0,0.6)', px: 3, py: 1, borderRadius: 2 }}>
                                    <Typography variant="caption" sx={{ color: '#aaa' }}>SCORE</Typography>
                                    {highScores.length > 0 && uiStats.score > highScores[0].score && (
                                        <Typography variant="caption" sx={{display:'block', color: '#e74c3c', animation:'blink 1s infinite', fontWeight:'bold'}}>HI-SCORE!</Typography>
                                    )}
                                    <Typography variant="h3" sx={{ fontFamily: currentTheme.font, color: currentTheme.uiAccent, lineHeight: 0.8 }}>{uiStats.score}</Typography>
                                </Box>
                            </div>
                            <div className="col-4 text-end" style={{pointerEvents:'auto'}}>
                                <IconButton onClick={togglePause} sx={{ color: '#fff', mr: 1, bgcolor: 'rgba(0,0,0,0.5)' }}>{gameState === 'PAUSED' ? <PlayArrow /> : <Pause />}</IconButton>
                                <IconButton onClick={() => { togglePause(); setSettingsOpen(true); }} sx={{ color: '#fff', bgcolor: 'rgba(0,0,0,0.5)' }}><Settings /></IconButton>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM LEFT: STATUS */}
                    <Box sx={{ position: 'absolute', bottom: 30, left: 30, zIndex: 5, pointerEvents: 'none' }}>
                        <Box sx={{ bgcolor: 'rgba(0,0,0,0.7)', borderLeft: `4px solid ${currentTheme.uiAccent}`, p: 2, borderRadius: '0 8px 8px 0', color: '#fff', fontFamily: '"Roboto Mono", monospace', minWidth: 150 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Speed sx={{ color: currentTheme.uiAccent, fontSize: '1.2rem', mr: 1.5 }} />
                                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>~{uiStats.currentWPM} RPM</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <GroupWork sx={{ color: currentTheme.uiAccent, fontSize: '1.2rem', mr: 1.5 }} />
                                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>{uiStats.maxLoad} CAP</Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* BOTTOM RIGHT: LIVES */}
                    <Box sx={{ position: 'absolute', bottom: 30, right: 30, zIndex: 5, display: 'flex', gap: 1 }}>
                        {[...Array(3)].map((_, i) => (
                            <Typography key={i} variant="h3" sx={{ color: currentTheme.uiAccent, opacity: i < uiStats.lives ? 1 : 0.2, filter: i < uiStats.lives ? `drop-shadow(0 0 5px ${currentTheme.uiAccent})` : 'grayscale(100%)' }}>♥</Typography>
                        ))}
                    </Box>

                    {/* CENTER: COMBO */}
                    {uiStats.combo > 1 && (
                        <Box sx={{ position: 'absolute', top: 120, left: '50%', transform: 'translateX(-50%) rotate(-5deg)', zIndex: 4, animation: 'pop 0.2s', pointerEvents: 'none' }}>
                            <Typography variant="h3" sx={{ fontFamily: currentTheme.font, color: currentTheme.uiAccent, textShadow: '2px 2px 0 #000' }}>x{uiStats.combo} COMBO!</Typography>
                        </Box>
                    )}
                </>
            )}
            
            {/* --- SCREENS --- */}

            {/* PAUSE */}
            {gameState === 'PAUSED' && !settingsOpen && (
                 <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
                     <Typography variant="h1" sx={{ fontFamily: currentTheme.font, color: '#fff', letterSpacing: 10 }}>PAUSED</Typography>
                 </Box>
            )}

            {/* START / GAMEOVER */}
            {(gameState === 'START' || gameState === 'GAMEOVER') && !settingsOpen && (
                <Fade in={true}>
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20 }}>
                        <Card sx={{ bgcolor: '#222', color: '#fff', border: `2px solid ${currentTheme.uiAccent}`, p: 4, textAlign: 'center', minWidth: 400 }}>
                            <Typography variant="h2" sx={{ fontFamily: currentTheme.font, color: currentTheme.uiAccent, mb: 2 }}>{gameState === 'GAMEOVER' ? 'GAME OVER' : 'DOJO READY'}</Typography>
                            
                            {/* RESULT SCREEN */}
                            {gameState === 'GAMEOVER' && (
                                <Box sx={{ mb: 3 }}>
                                    {isNewHighScore && <Typography variant="h4" sx={{color: '#f1c40f', fontFamily: currentTheme.font, animation:'pop 0.5s infinite'}}>NEW HIGH SCORE!</Typography>}
                                    <Typography variant="h3" sx={{mb:2}}>{uiStats.score}</Typography>
                                    <Divider sx={{bgcolor:'#555', mb:2}} />
                                    <Typography variant="subtitle2" sx={{color:'#aaa', mb:1}}>TOP RANKS</Typography>
                                    {highScores.slice(0, 3).map((s, i) => (
                                        <Box key={i} sx={{display:'flex', justifyContent:'space-between', px:4, mb:0.5}}>
                                            <Typography sx={{color: i===0?'#f1c40f':'#fff'}}>#{i+1}</Typography>
                                            <Typography sx={{fontWeight:'bold', color:'#fff'}}>{s.score}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                            
                            <Button variant="contained" size="large" onClick={startGame} sx={{ fontFamily: currentTheme.font, fontSize: '1.8rem', px: 5, bgcolor: currentTheme.uiAccent, '&:hover': {filter:'brightness(1.1)'} }}>
                                {gameState === 'GAMEOVER' ? 'RETRY' : 'START'}
                            </Button>
                        </Card>
                    </Box>
                </Fade>
            )}

            {/* SETTINGS (Kept same as before) */}
            <Dialog open={settingsOpen} onClose={() => { setSettingsOpen(false); if(gameState === 'PAUSED') togglePause(); }} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#222', color: '#fff' } }}>
                <DialogTitle sx={{ fontFamily: currentTheme.font, fontSize: '2rem', color: currentTheme.uiAccent, textAlign: 'center' }}>SETTINGS</DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <Typography sx={{display:'flex', alignItems:'center', mb:1}}><Palette sx={{mr:1, color:currentTheme.uiAccent}}/> Theme</Typography>
                        <Box sx={{display:'flex', gap:1, flexWrap:'wrap'}}>
                            {THEMES.map((t, idx) => (
                                <Button key={t.id} variant={themeIndex === idx ? "contained" : "outlined"} onClick={() => setThemeIndex(idx)} sx={{ borderColor: t.uiAccent, color: themeIndex === idx ? '#000' : t.uiAccent, bgcolor: themeIndex === idx ? t.uiAccent : 'transparent' }}>{t.label}</Button>
                            ))}
                        </Box>
                    </Box>
                    <Divider sx={{ bgcolor: '#444' }} />
                    <Box sx={{ my: 2 }}>
                        <Typography sx={{display:'flex', alignItems:'center', mb:1}}><MusicNote sx={{mr:1, color:currentTheme.uiAccent}}/> Music</Typography>
                        <ToggleButtonGroup value={musicTrack} exclusive onChange={(e, val) => val && setMusicTrack(val)} fullWidth sx={{ bgcolor: '#333' }}>
                            <ToggleButton value="neon" sx={{ color: '#fff', '&.Mui-selected': { color: '#000', bgcolor: currentTheme.uiAccent } }}>NEON</ToggleButton>
                            <ToggleButton value="zen" sx={{ color: '#fff', '&.Mui-selected': { color: '#000', bgcolor: currentTheme.uiAccent } }}>ZEN</ToggleButton>
                            <ToggleButton value="boss" sx={{ color: '#fff', '&.Mui-selected': { color: '#000', bgcolor: currentTheme.uiAccent } }}>BOSS</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                    <Divider sx={{ bgcolor: '#444' }} />
                    <Typography variant="h6" sx={{ color: '#aaa', mt: 2 }}>DIFFICULTY</Typography>
                    <ToggleButtonGroup value={difficulty} exclusive onChange={(e, val) => val && setDifficulty(val)} fullWidth sx={{ mt: 1, mb: 2, bgcolor: '#333' }}>
                        <ToggleButton value="ADAPTIVE" sx={{ color: '#fff', '&.Mui-selected': { color: '#000', bgcolor: currentTheme.uiAccent } }}>ADAPTIVE</ToggleButton>
                        <ToggleButton value="CUSTOM" sx={{ color: '#fff', '&.Mui-selected': { color: '#000', bgcolor: currentTheme.uiAccent } }}>CUSTOM</ToggleButton>
                    </ToggleButtonGroup>
                    {difficulty === 'CUSTOM' && (
                         <Box sx={{ px: 2, mb: 2, bgcolor: '#333', p: 2, borderRadius: 1 }}>
                            <Typography gutterBottom>Speed: {customWPM} WPM</Typography>
                            <Slider value={customWPM} onChange={(e, val) => setCustomWPM(val)} min={10} max={200} step={5} sx={{color:currentTheme.uiAccent}} />
                            <Typography gutterBottom sx={{mt:2}}>Length: {customWordLen[0]} - {customWordLen[1]}</Typography>
                            <Slider value={customWordLen} onChange={(e, val) => setCustomWordLen(val)} valueLabelDisplay="auto" min={1} max={15} sx={{color:currentTheme.uiAccent}} />
                        </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Typography><VolumeUp sx={{mr:1, verticalAlign:'bottom'}}/> Sound FX</Typography>
                        <Switch checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} color="success" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button startIcon={<Refresh/>} color="error" size="small" onClick={clearData}>Clear History</Button>
                    </Box>
                </DialogContent>
                <DialogActions sx={{justifyContent:'center', p:2}}>
                    <Button variant="contained" onClick={() => { setSettingsOpen(false); if(gameState === 'PAUSED') togglePause(); }} sx={{ bgcolor: currentTheme.uiAccent }}>CLOSE</Button>
                </DialogActions>
            </Dialog>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Roboto+Mono:wght@500&family=Roboto+Slab:wght@700&family=Courier+Prime&display=swap');
                body, html { margin: 0; padding: 0; overflow: hidden; background: #000; }
                div[class*="bg-"] { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; overflow: hidden; user-select: none; transition: background 1s ease; }
                .bg-neon { background: radial-gradient(circle at center, #2a2a2a 0%, #000000 100%); }
                .bg-wood { background: repeating-linear-gradient(45deg, #6d4c41 0px, #5d4037 20px, #4e342e 40px); }
                .bg-midnight { background: #000; }
                @keyframes pop { 0% { transform: translate(-50%) rotate(-5deg) scale(0.8); } 50% { transform: translate(-50%) rotate(-5deg) scale(1.2); } 100% { transform: translate(-50%) rotate(-5deg) scale(1); } }
                @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default TypeNinja;