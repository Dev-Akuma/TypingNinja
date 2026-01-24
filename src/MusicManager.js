// src/MusicManager.js
class MusicManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.isPlaying = false;
        this.currentTrack = 'neon';
        this.intervalID = null;
        this.beat = 0;
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    tracks = {
        neon: { base: 110, scale: [0, 3, 7, 10, 12], speed: 200, wave: 'sawtooth' },
        zen:  { base: 146, scale: [0, 4, 7, 11, 14], speed: 400, wave: 'sine' },
        boss: { base: 87,  scale: [0, 1, 4, 7, 8],    speed: 150, wave: 'square' }
    };

    start(trackName) {
        this.resume(); // Ensure we can play
        this.stop();
        this.currentTrack = trackName;
        this.isPlaying = true;
        
        const track = this.tracks[trackName];
        this.beat = 0;

        this.intervalID = setInterval(() => {
            if (!this.isPlaying) return;
            this.playNote(track);
            this.beat++;
        }, track.speed);
    }

    stop() {
        this.isPlaying = false;
        if (this.intervalID) clearInterval(this.intervalID);
    }

    playNote(track) {
        if(this.ctx.state === 'suspended') return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        const noteIndex = this.beat % track.scale.length;
        const semitone = track.scale[noteIndex];
        const octave = (this.beat % 8 === 0) ? 0.5 : (this.beat % 4 === 0) ? 2 : 1;
        const freq = track.base * Math.pow(2, semitone / 12) * octave;

        osc.type = track.wave;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }
}

export default new MusicManager();