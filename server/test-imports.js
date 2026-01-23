import 'dotenv/config';
console.log('Testing imports...');

try {
    await import('./src/config/db.js');
    console.log('db.js loaded');
} catch (e) { console.error('db.js failed', e.message); }

try {
    await import('./src/config/socket.js');
    console.log('socket.js loaded');
} catch (e) { console.error('socket.js failed', e.message); }

try {
    await import('./src/services/otpService.js');
    console.log('otpService.js loaded');
} catch (e) { console.error('otpService.js failed', e.message); }

try {
    await import('./src/services/meetupService.js');
    console.log('meetupService.js loaded');
} catch (e) { console.error('meetupService.js failed', e.message); }

try {
    await import('./src/routes/auth.js');
    console.log('auth.js loaded');
} catch (e) { console.error('auth.js failed', e.message); }

try {
    await import('./src/routes/items.js');
    console.log('items.js loaded');
} catch (e) { console.error('items.js failed', e.message); }

try {
    await import('./src/routes/matches.js');
    console.log('matches.js loaded');
} catch (e) { console.error('matches.js failed', e.message); }

console.log('Done testing.');
