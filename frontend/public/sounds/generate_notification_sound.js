// Script para generar un sonido de notificación simple
// Este script puede ejecutarse en el navegador para crear un archivo de audio

function generateNotificationSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 0.5; // Duración en segundos
    const sampleRate = audioContext.sampleRate;
    const numSamples = duration * sampleRate;
    
    // Crear buffer de audio
    const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generar sonido de notificación (dos tonos)
    for (let i = 0; i < numSamples; i++) {
        const time = i / sampleRate;
        const frequency1 = 800; // Primer tono
        const frequency2 = 600; // Segundo tono
        
        let sample = 0;
        if (time < 0.25) {
            sample = Math.sin(2 * Math.PI * frequency1 * time) * 0.3;
        } else {
            sample = Math.sin(2 * Math.PI * frequency2 * time) * 0.3;
        }
        
        // Aplicar envelope para suavizar
        const envelope = Math.exp(-time * 4);
        data[i] = sample * envelope;
    }
    
    return buffer;
}

// Función para convertir buffer a WAV y descargar
function downloadNotificationSound() {
    const buffer = generateNotificationSound();
    const wav = audioBufferToWav(buffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notification.wav';
    a.click();
    
    URL.revokeObjectURL(url);
}

// Función auxiliar para convertir AudioBuffer a WAV
function audioBufferToWav(buffer) {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // PCM data
    const data = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
        const sample = Math.max(-1, Math.min(1, data[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
    }
    
    return arrayBuffer;
}

console.log('Script de generación de sonido cargado. Ejecuta downloadNotificationSound() en la consola para descargar el archivo.');
